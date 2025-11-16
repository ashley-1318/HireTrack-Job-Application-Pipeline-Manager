import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import Groq from 'groq-sdk';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import Busboy from 'busboy';
import getRawBody from 'raw-body';
import { createRequire } from 'module';
const requireCJS = createRequire(import.meta.url);
const pdfParse = requireCJS('pdf-parse');

// Initialize Express app
const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://ashley-1318.github.io',
  'https://hiretrack-job-application-ai.web.app',
  'https://hiretrack-job-application-ai.firebaseapp.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing - Skip for multipart/form-data requests (file uploads)
app.use((req, res, next) => {
  const ct = req.headers['content-type'] || '';
  // Skip body parsing for /api/apply completely
  if (req.path === '/api/apply' || ct.includes('multipart/form-data')) {
    console.log('Skipping body parser for', req.path);
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(morgan('dev'));

// Environment variables from Firebase Functions config
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'supersecurepassword';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB connection
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  if (!MONGO_URI) {
    console.warn('⚠ MONGO_URI not set');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✓ MongoDB connected');
  } catch (e) {
    console.error('✗ MongoDB connection error:', e.message);
  }
}

// Models
const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, default: 'General' },
    location: { type: String, default: 'Remote' },
    type: { type: String, default: 'Full-time' },
    skills: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    postedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    pipelineStages: { type: [String], default: ['Screening', 'Interview', 'Offer'] },
  },
  { timestamps: true }
);

JobSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const CandidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    resumeUrl: { type: String },
    jobId: { type: String, required: true },
    stage: { type: String, default: 'Applied' },
    coverNote: { type: String, required: true },
    atsScore: { type: Number },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    recommendedStage: { type: String },
    resumeText: { type: String },
    ats: {
      evaluatedAt: Date,
      totalScore: Number,
      decision: String,
      breakdown: {
        skill_match: Number,
        experience_match: Number,
        education_match: Number,
        keyword_match: Number,
      },
      explanation: String,
    },
    history: [
      {
        from: String,
        to: String,
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

CandidateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
// Pipeline log model for recent activity
const PipelineLogSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true },
    oldStage: { type: String, default: '' },
    newStage: { type: String, required: true },
    time: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
const PipelineLog = mongoose.models.PipelineLog || mongoose.model('PipelineLog', PipelineLogSchema);

// Utility: Download resume from Cloudinary
async function downloadResume(url) {
  try {
    // Try direct download first (works for public files)
    console.log('Attempting direct download...');
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000,
      validateStatus: (status) => status === 200
    });
    console.log('✓ Direct download successful');
    return Buffer.from(response.data);
  } catch (directError) {
    console.log('Direct download failed:', directError.message, '- Trying signed URL...');
    
    // Fallback to signed URL for private files
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = url.split('/');
      const cloudIndex = urlParts.findIndex(part => part === process.env.CLOUDINARY_CLOUD_NAME || part === 'hiretrack');
      
      if (cloudIndex === -1) {
        throw new Error('Invalid Cloudinary URL');
      }
      
      const pathParts = urlParts.slice(cloudIndex + 1);
      let publicIdPath = pathParts.join('/');
      publicIdPath = publicIdPath.replace(/^raw\/upload\/v\d+\//, '');
      const publicId = publicIdPath.replace(/\.[^/.]+$/, '');
      
      console.log('Extracted public_id:', publicId);
      
      const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'raw',
        type: 'upload'
      });
      
      console.log('Downloading from signed URL...');
      const response = await axios.get(signedUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      console.log('✓ Signed URL download successful');
      return Buffer.from(response.data);
    } catch (signedError) {
      console.error('Both download methods failed');
      throw new Error(`Failed to download resume: ${directError.message}`);
    }
  }
}

// Utility: Extract resume text (PDF/DOCX/TXT)
async function extractResumeText(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      // First attempt: pdf2json (fast for simple PDFs)
      const pdf2jsonText = await new Promise((resolve, reject) => {
        try {
          const pdfParser = new PDFParser();
          pdfParser.on('pdfParser_dataError', errData => {
            console.error('pdf2json error:', errData.parserError);
            resolve('');
          });
          pdfParser.on('pdfParser_dataReady', pdfData => {
            try {
              const text = pdfData.Pages
                .flatMap(p => p.Texts)
                .map(t => t.R && t.R[0] && decodeURIComponent(t.R[0].T) || '')
                .join(' ');
              resolve(text.trim());
            } catch (aggErr) {
              console.error('Aggregation error:', aggErr);
              resolve('');
            }
          });
          pdfParser.parseBuffer(buffer);
        } catch (initErr) {
          console.error('Initialization error pdf2json:', initErr);
          resolve('');
        }
      });
      if (pdf2jsonText && pdf2jsonText.length >= 20) return pdf2jsonText;
      // Fallback: pdf-parse (more robust for modern PDFs)
      try {
        const parsed = await pdfParse(buffer);
        const text = (parsed?.text || '').trim();
        if (text) return text;
      } catch (ppErr) {
        console.error('pdf-parse fallback error:', ppErr?.message || ppErr);
      }
      return '';
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }
  } catch (err) {
    console.error('Error extracting resume text:', err);
  }
  return '';
}

// Utility: Score resume with Groq
async function scoreResumeForCandidate(resumeText, job) {
  if (!GROQ_API_KEY) {
    console.warn('⚠ GROQ_API_KEY not set');
    return null;
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const systemPrompt = `You are an ATS (Applicant Tracking System) that evaluates resumes against job descriptions. Return a JSON object with:
{
  "totalScore": <number 0-100>,
  "decision": "Recommended" | "Maybe" | "Rejected",
  "breakdown": {
    "skill_match": <number 0-100>,
    "experience_match": <number 0-100>,
    "education_match": <number 0-100>,
    "keyword_match": <number 0-100>
  },
  "explanation": "<brief explanation>"
}`;

  const userPrompt = `Job Title: ${job.title}
Description: ${job.description}
Skills: ${job.skills?.join(', ') || 'N/A'}
Requirements: ${job.requirements?.join(', ') || 'N/A'}

Resume Text:
${resumeText.substring(0, 3000)}

Evaluate this resume.`;

  try {
    console.log('📤 Calling Groq API for job:', job.title);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    let raw = completion.choices[0]?.message?.content || '{}';
    console.log('📥 Groq API response received, length:', raw.length);
    
    let parsed;
    try { 
      parsed = JSON.parse(raw);
      console.log('✓ Successfully parsed Groq response');
    } catch (e) {
      console.warn('⚠ Initial JSON parse failed, attempting extraction...');
      // Attempt to extract JSON substring if extra text wrapped
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { 
          parsed = JSON.parse(match[0]); 
          console.log('✓ Successfully extracted and parsed JSON');
        } catch { 
          console.error('✗ Failed to parse extracted JSON');
          parsed = null; 
        }
      }
    }
    
    if (!parsed || typeof parsed.totalScore !== 'number') {
      console.error('✗ ATS parsing failed - invalid structure. Received:', raw.slice(0,200));
      return null;
    }
    
    console.log('✓ ATS scoring successful - Score:', parsed.totalScore, 'Decision:', parsed.decision);
    return parsed;
  } catch (error) {
    console.error('✗ Groq API error:', error.message);
    console.error('Error details:', error);
    return null;
  }
}

// Multer for file uploads (memory storage for Firebase Functions)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    fieldSize: 10 * 1024 * 1024, // 10MB max field size
    fields: 10, // Maximum number of non-file fields
    files: 1 // Maximum number of file fields
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Middleware: Connect DB before each request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========== Routes ==========
// JSON fallback application (base64 resume) to bypass multipart issues
app.post('/api/apply-json', async (req, res) => {
  try {
    const { name, email, phone, jobId, coverNote, resumeBase64, resumeName } = req.body || {};
    if (!name || !email || !phone || !jobId || !coverNote) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    let resumeUrl = '';
    let resumeText = '';
    if (resumeBase64) {
      try {
        const buffer = Buffer.from(resumeBase64, 'base64');
        const ext = (resumeName || '').split('.').pop()?.toLowerCase();
        const mimetype = ext === 'pdf' ? 'application/pdf' : 
          ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
          ext === 'doc' ? 'application/msword' : 'application/octet-stream';
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'hiretrack/resumes', public_id: resumeName?.replace(/\.[^.]+$/, '') },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
        resumeUrl = uploadResult.secure_url;
        resumeText = await extractResumeText(buffer, mimetype);
      } catch (e) {
        console.error('Base64 resume processing error:', e);
      }
    }
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    let atsResult = null;
    if (resumeText && GROQ_API_KEY) {
      atsResult = await scoreResumeForCandidate(resumeText, job);
    }
    const candidate = new Candidate({
      name,
      email,
      phone,
      jobId,
      coverNote,
      resumeUrl,
      resumeText,
      stage: 'Applied',
      ats: atsResult ? { evaluatedAt: new Date(), ...atsResult } : undefined,
      atsScore: atsResult?.totalScore,
      history: [{ from: '', to: 'Applied', time: new Date() }]
    });
    await candidate.save();
    await PipelineLog.create({ candidateId: String(candidate._id), oldStage: '', newStage: 'Applied', time: new Date() });
    res.status(201).json(candidate);
  } catch (err) {
    console.error('apply-json error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit application (JSON fallback)' });
  }
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { email, role: 'admin' } });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Return current authenticated admin user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { email, role } = req.user || {};
  return res.json({ email, role });
});

// Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidates
app.get('/api/candidates', authMiddleware, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all candidates with basic job info
app.get('/api/admin/candidates', async (_req, res) => {
  try {
    const items = await Candidate.find().sort({ createdAt: -1 }).lean();
    const jobIds = [...new Set(items.map((c) => c.jobId).filter(Boolean))];
    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
    const jobMap = Object.fromEntries(jobs.map((j) => [String(j._id), { id: String(j._id), title: j.title }]));
    const result = items.map((c) => ({
      ...c,
      job: jobMap[c.jobId] || null,
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: Manually trigger ATS scoring for candidates without scores
app.post('/api/admin/candidates/score-all', async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    const candidates = await Candidate.find({
      $or: [
        { 'ats.totalScore': { $exists: false } },
        { 'ats.totalScore': null }
      ],
      resumeUrl: { $exists: true, $ne: null }
    });

    console.log(`Found ${candidates.length} candidates without ATS scores`);

    const results = {
      total: candidates.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process candidates in background
    (async () => {
      for (const candidate of candidates) {
        try {
          console.log(`Processing candidate ${candidate._id} - ${candidate.name}`);
          
          const job = await Job.findById(candidate.jobId);
          if (!job) {
            console.warn(`Job not found for candidate ${candidate._id}`);
            results.failed++;
            results.errors.push({ candidateId: candidate._id.toString(), error: 'Job not found' });
            continue;
          }

          const inferMime = (url) => {
            const u = url.toLowerCase();
            if (u.includes('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (u.includes('.txt')) return 'text/plain';
            return 'application/pdf';
          };

          const buffer = await downloadResume(candidate.resumeUrl);
          const resumeText = await extractResumeText(buffer, inferMime(candidate.resumeUrl));

          if (!resumeText || resumeText.trim().length < 50) {
            console.warn(`Insufficient resume text for candidate ${candidate._id}`);
            results.failed++;
            results.errors.push({ candidateId: candidate._id.toString(), error: 'Insufficient resume text' });
            continue;
          }

          const atsResult = await scoreResumeForCandidate(resumeText, job);
          
          if (atsResult) {
            candidate.ats = { evaluatedAt: new Date(), ...atsResult };
            candidate.atsScore = atsResult.totalScore;
            await candidate.save();
            console.log(`✓ Scored candidate ${candidate._id}: ${atsResult.totalScore}`);
            results.success++;
          } else {
            console.warn(`ATS scoring returned null for candidate ${candidate._id}`);
            results.failed++;
            results.errors.push({ candidateId: candidate._id.toString(), error: 'ATS scoring returned null' });
          }
        } catch (error) {
          console.error(`Error scoring candidate ${candidate._id}:`, error.message);
          results.failed++;
          results.errors.push({ candidateId: candidate._id.toString(), error: error.message });
        }
      }
      console.log(`✓ Batch scoring complete. Success: ${results.success}, Failed: ${results.failed}`);
    })();

    // Return immediately with acknowledgment
    res.json({ 
      message: 'ATS scoring initiated in background', 
      candidatesFound: candidates.length 
    });
  } catch (e) {
    console.error('Error initiating batch ATS scoring:', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin override ATS decision and/or stage
app.patch('/api/admin/candidates/:id/override', async (req, res) => {
  try {
    const { id } = req.params;
    const { ats, stage, decision, reason } = req.body || {};
    const candidate = await Candidate.findById(id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // If new-style override with `decision`, update ats.decision and infer stage
    if (decision) {
      const prevStage = candidate.stage;
      const nextStage = decision === 'Screening' ? 'Screening' : 'Rejected';
      candidate.ats = {
        ...(candidate.ats || {}),
        decision,
        evaluatedAt: new Date(),
        explanation: reason ? `Manual override: ${reason}` : (candidate.ats?.explanation || 'Manual override'),
      };
      if (prevStage !== nextStage) {
        candidate.stage = nextStage;
        candidate.history.push({ from: prevStage, to: nextStage, time: new Date(), by: 'Admin Override' });
      }
    }

    // Legacy support: direct ats/stage patching if provided
    if (ats) {
      candidate.ats = {
        ...candidate.ats,
        ...ats,
        evaluatedAt: new Date(),
      };
    }
    if (stage) {
      const prevStage = candidate.stage;
      candidate.stage = stage;
      candidate.history.push({ from: prevStage, to: stage, time: new Date(), by: 'Admin Override' });
    }

    await candidate.save();
    res.json({ ok: true, candidate });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Cloudinary signed upload endpoint
app.post('/api/upload-signature', async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp: timestamp,
      folder: 'hiretrack/resumes'
    };
    
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );
    
    res.json({
      signature: signature,
      timestamp: timestamp,
      cloudname: process.env.CLOUDINARY_CLOUD_NAME,
      apikey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// Apply endpoint - accepts either file upload OR cloudinary URL
app.post('/api/apply', async (req, res) => {
  try {
    console.log('Apply endpoint hit');
    console.log('Content-Type:', req.headers['content-type']);
    
    const contentType = req.headers['content-type'] || '';
    
    // Check if it's JSON (cloudinary URL submission)
    if (contentType.includes('application/json')) {
      console.log('Processing JSON submission with Cloudinary URL');
      const { name, email, phone, jobId, coverNote, resumeUrl } = req.body;
      
      if (!name || !email || !phone || !jobId || !coverNote || !resumeUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log('All fields present, processing application...');

      const job = await Job.findById(jobId);
      if (!job) {
        console.log('Job not found:', jobId);
        return res.status(404).json({ error: 'Job not found' });
      }

      // Create candidate with the provided Cloudinary URL
      const candidate = new Candidate({
        name,
        email,
        phone,
        jobId,
        coverNote,
        resumeUrl,
        stage: 'Applied',
        history: [{ from: '', to: 'Applied', time: new Date() }]
      });

      await candidate.save();
      console.log('Candidate saved successfully:', candidate._id);
      
      // Log pipeline activity
      const pipelineLog = new PipelineLog({
        candidateId: candidate._id.toString(),
        oldStage: '',
        newStage: 'Applied',
        time: new Date()
      });
      await pipelineLog.save();
      
      // SYNCHRONOUS ATS scoring for JSON Cloudinary submission
      // Score BEFORE responding so dashboard shows score immediately
      if (GROQ_API_KEY) {
        console.log('🚀 Starting ATS scoring for candidate:', candidate._id);
        try {
          const inferMime = (url) => {
            const u = url.toLowerCase();
            if (u.includes('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (u.includes('.txt')) return 'text/plain';
            return 'application/pdf';
          };
          console.log('Fetching resume from URL:', resumeUrl);
          
          let buffer;
          let resumeText;
          
          try {
            buffer = await downloadResume(resumeUrl);
            console.log('Resume downloaded, size:', buffer.length, 'bytes');
            
            const mimetype = inferMime(resumeUrl);
            console.log('Inferred mimetype:', mimetype);
            resumeText = await extractResumeText(buffer, mimetype);
            console.log('Extracted resume text length:', resumeText?.length || 0, 'chars');
          } catch (downloadError) {
            console.warn('⚠ Failed to download/extract resume:', downloadError.message);
            console.log('Attempting to use any stored resumeText from database...');
            resumeText = candidate.resumeText; // Fallback to stored text if available
          }
          
          if (resumeText && resumeText.trim().length > 50) { // basic threshold
            console.log('Resume text sufficient, calling Groq API...');
            const atsResult = await scoreResumeForCandidate(resumeText, job);
            console.log('ATS result received:', JSON.stringify(atsResult));
            
            if (atsResult) {
              candidate.ats = { evaluatedAt: new Date(), ...atsResult };
              candidate.atsScore = atsResult.totalScore;
              await candidate.save();
              console.log('✓ ATS scoring completed for', candidate._id, '- Score:', atsResult.totalScore);
            } else {
              console.warn('⚠ ATS scoring returned null for candidate', candidate._id);
            }
          } else {
            console.warn('⚠ Resume text extraction insufficient for candidate', candidate._id, '- Length:', resumeText?.length || 0);
          }
        } catch (e) {
          console.error('✗ ATS scoring failed for', candidate._id, ':', e.message);
          // Don't fail the application submission if ATS scoring fails
        }
      } else {
        console.warn('⚠ GROQ_API_KEY not set, skipping ATS scoring');
      }

      return res.status(201).json({
        message: 'Application submitted successfully',
        candidateId: candidate._id
      });
    }
    
    // Legacy multipart upload (keeping for compatibility)
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ 
        error: 'Invalid content type. Expected multipart/form-data or application/json.',
        received: contentType 
      });
    }

    console.log('Processing multipart upload (legacy)');

    const busboy = Busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fields: 10
      }
    });

    const formData = {};
    let fileBuffer = null;
    let fileMetadata = {};
    const parseError = [];
    let responded = false;

    const safeJson = (status, payload) => {
      if (!responded) {
        responded = true;
        try { return res.status(status).json(payload); } catch {}
      }
    };

    busboy.on('field', (fieldname, val) => {
      try { console.log('field:', fieldname, 'len', String(val).length); } catch {}
      formData[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      console.log('file start:', fieldname, info?.mimeType, info?.filename);
      const { filename, encoding, mimeType } = info;
      
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      
      if (!allowedMimes.includes(mimeType)) {
        parseError.push('Invalid file type');
        file.resume();
        return;
      }

      fileMetadata = { filename, encoding, mimeType, fieldname };
      const chunks = [];
      
      file.on('data', (data) => { chunks.push(data); });
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); console.log('file end: size', fileBuffer.length); });
      file.on('error', (err) => { console.error('file error:', err?.message); parseError.push(err.message); });
    });

    busboy.on('error', (err) => { 
      console.error('busboy error:', err?.message); 
      parseError.push(err.message);
      safeJson(400, { error: 'Upload incomplete. Please try again.' });
    });

    req.on('aborted', () => {
      console.warn('request aborted by client');
      safeJson(499, { error: 'Upload aborted by client' });
    });

    busboy.on('finish', async () => {
      console.log('busboy finish. fields:', Object.keys(formData), 'hasFile:', !!fileBuffer);
      if (responded) {
        console.log('finish called after response already sent');
        return;
      }
      try {
        if (parseError.length > 0) {
          return safeJson(400, { error: parseError[0] });
        }

        const { name, email, phone, jobId, coverNote } = formData;
        
        if (!name || !email || !phone || !jobId || !coverNote || !fileBuffer) {
          return safeJson(400, { error: 'Missing required fields' });
        }

        const job = await Job.findById(jobId);
        if (!job) return safeJson(404, { error: 'Job not found' });

        // 1) Extract resume text directly from uploaded buffer (avoid re-download)
        console.log('Extracting resume text from uploaded buffer...');
        const resumeText = await extractResumeText(fileBuffer, fileMetadata.mimeType || 'application/pdf');
        console.log('Extracted resume text length:', resumeText?.length || 0);

        // 2) Create candidate first (without resumeUrl yet)
        const candidate = new Candidate({
          name, email, phone, jobId, coverNote,
          stage: 'Applied',
          resumeText: resumeText || '',
          history: [{ from: '', to: 'Applied', time: new Date() }]
        });
        await candidate.save();
        await PipelineLog.create({ 
          candidateId: candidate._id.toString(), 
          oldStage: '', 
          newStage: 'Applied', 
          time: new Date() 
        });

        // 3) Synchronous ATS scoring from extracted text
        if (GROQ_API_KEY && resumeText && resumeText.trim().length > 50) {
          console.log('🚀 Starting ATS scoring (buffer) for candidate:', candidate._id);
          try {
            const atsResult = await scoreResumeForCandidate(resumeText, job);
            console.log('ATS result received:', JSON.stringify(atsResult));
            if (atsResult) {
              candidate.ats = { evaluatedAt: new Date(), ...atsResult };
              candidate.atsScore = atsResult.totalScore;
              await candidate.save();
              console.log('✓ ATS scoring completed for', candidate._id, '- Score:', atsResult.totalScore);
            }
          } catch (err) {
            console.error('✗ ATS scoring (buffer) failed for', candidate._id, ':', err.message);
          }
        } else {
          console.warn('⚠ Skip ATS scoring - missing key or insufficient text');
        }

        // 4) Upload to Cloudinary in background (do not block response)
        (async () => {
          try {
            const uploadResult = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'raw', folder: 'hiretrack/resumes' },
                (error, result) => error ? reject(error) : resolve(result)
              );
              stream.end(fileBuffer);
            });
            candidate.resumeUrl = uploadResult.secure_url;
            await candidate.save();
            console.log('✓ Resume uploaded to Cloudinary for', candidate._id);
          } catch (e) {
            console.error('Cloudinary upload failed (background):', e?.message);
          }
        })();

        // 5) Respond immediately
        safeJson(201, { 
          message: 'Application submitted successfully', 
          candidateId: candidate._id 
        });
      } catch (error) {
        console.error('Error processing application:', error);
        safeJson(500, { error: error.message || 'Failed to process application' });
      }
    });

    // In Firebase Functions/Cloud Run, req.rawBody is often populated and streaming may be consumed.
    // Prefer feeding rawBody directly when available to avoid "Unexpected end of form".
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      console.log('Feeding busboy with req.rawBody buffer, size:', req.rawBody.length);
      busboy.end(req.rawBody);
    } else {
      console.log('Piping request stream into busboy');
      req.pipe(busboy);
    }
    
  } catch (error) {
    console.error('Apply route error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.patch('/api/candidates/:id/stage', authMiddleware, async (req, res) => {
  try {
    const { stage } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    candidate.history.push({ from: candidate.stage, to: stage, time: new Date() });
    candidate.stage = stage;
    await candidate.save();
    await PipelineLog.create({ candidateId: String(candidate._id), oldStage: candidate.history.at(-2)?.to || '', newStage: stage, time: new Date() });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move stage endpoint (for approve/reject)
app.patch('/api/movestage/:id', authMiddleware, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Target stage "to" is required' });
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    
    const old = c.stage;
    if (old === to) return res.json(c);
    c.stage = to;
    c.history.push({ from: old, to, time: new Date(), by: 'Admin' });
    await c.save();
    await PipelineLog.create({ candidateId: String(c._id), oldStage: old, newStage: to, time: new Date() });
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/candidates/:id', authMiddleware, async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const totalCandidates = await Candidate.countDocuments();
    const candidatesByStage = await Candidate.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);
    const stageMap = {};
    candidatesByStage.forEach((s) => { stageMap[s._id] = s.count; });
    const recentLogs = await PipelineLog.find().sort({ time: -1 }).limit(10).lean();
    const recentActivity = await Promise.all(
      recentLogs.map(async (log) => {
        const c = await Candidate.findById(log.candidateId).lean();
        const j = c ? await Job.findById(c.jobId).lean() : null;
        return {
          id: log._id,
          message: c && j ? `${c.name} applied for ${j.title}` : `Candidate moved from ${log.oldStage} to ${log.newStage}`,
          time: log.time,
        };
      })
    );
    res.json({ totalJobs, openJobs, totalCandidates, stageMap, recentActivity });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Unexpected end of form')) {
    return res.status(400).json({ error: 'Upload incomplete. Please try again with a smaller file or better connection.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Export as Firebase Function
export const api = onRequest({ 
  timeoutSeconds: 540,
  memory: '2GiB',  // Increased memory
  region: 'us-central1',
  maxInstances: 10,
  // Increase request body size limit for file uploads
  invoker: 'public'
}, app);
