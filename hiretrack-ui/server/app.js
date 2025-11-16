import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { extractResumeText } from './utils/extractResumeText.js';
// Legacy inline ATS scoring (kept for backward compatibility in /api/apply if needed)
// Preferred Groq JSON ATS scoring service (unified ATS path)
import { scoreResumeForCandidate } from './services/groqAtsService.js';

// Load .env from the server folder regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration for GitHub Pages deployment
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://ashley-1318.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Only parse JSON for non-multipart requests (skip for file uploads)
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});
app.use(morgan('dev'));

// Mongo connection (delayed to allow env vars to load)
setTimeout(() => {
  const MONGO_URI = process.env.MONGO_URI || '';
  if (!MONGO_URI) {
    console.warn('⚠ MONGO_URI not set; backend features needing DB will be disabled.');
  } else {
    mongoose
      .connect(MONGO_URI)
      .then(() => console.log('✓ MongoDB connected'))
      .catch((e) => console.error('✗ MongoDB connection error:', e.message));
  }
}, 0);

// Models
// Jobs collection
// Shape: { _id, title, description, pipelineStages: ["Screening","Interview","Offer"] }
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
    // Exclude "Applied" from per-job pipeline stages; candidate defaults to "Applied"
    pipelineStages: { type: [String], default: ['Screening', 'Interview', 'Offer'] },
  },
  { timestamps: true }
);

// Ensure API responses include `id` instead of `_id` and drop __v
JobSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

// Candidates collection
// Extended to store ATS scoring metadata
// Shape: { _id, name, email, resumeUrl, jobId, stage: "Applied", atsScore?, strengths?, gaps?, recommendedStage?, resumeText?, ats?: { evaluatedAt, totalScore, decision, breakdown: { skill_match, experience_match, education_match, keyword_match }, explanation }, history: [{ from, to, time }] }
const CandidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    resumeUrl: { type: String },
    // Keep as string to align with current client usage; could be ObjectId ref to Job
    jobId: { type: String, required: true },
    stage: { type: String, default: 'Applied' },
    coverNote: { type: String, required: true },
    atsScore: { type: Number },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    recommendedStage: { type: String },
    resumeText: { type: String },
    ats: {
      evaluatedAt: { type: Date },
      totalScore: { type: Number },
      decision: { type: String },
      breakdown: {
        skill_match: { type: Number },
        experience_match: { type: Number },
        education_match: { type: Number },
        keyword_match: { type: Number },
      },
      explanation: { type: String },
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

// Pipeline logs collection
// Shape: { candidateId, oldStage, newStage, time }
const PipelineLogSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true },
    oldStage: { type: String, required: true },
    newStage: { type: String, required: true },
    time: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
const PipelineLog = mongoose.models.PipelineLog || mongoose.model('PipelineLog', PipelineLogSchema);

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

// Admin override ATS decision and/or stage (accepts legacy and new payloads)
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

// Auth setup (env-based admin for simplicity)
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
// Store a bcrypt hash in ADMIN_PASSWORD_HASH or plain ADMIN_PASSWORD which we will hash at startup
let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
// Fallback default password for dev & tests when none provided via env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'supersecurepassword';
if (!ADMIN_PASSWORD_HASH && ADMIN_PASSWORD) {
  // Hash once at startup (sync acceptable for dev)
  ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
}

// Manual screening - No AI/LLM required

const issueToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Cloudinary / Storage
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { google } from 'googleapis';
import { Readable } from 'stream';
// (Removed duplicate import of scoreResumeForCandidate)

// Storage provider (currently only cloudinary active; gdrive branch removed pending re-implementation)
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase();

// Delay Cloudinary config to allow env vars to load
setTimeout(() => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✓ Cloudinary configured');
}, 0);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

// Apply: unified Cloudinary upload + background ATS scoring
app.post('/api/apply', upload.single('resume'), async (req, res) => {
  try {
    console.log('=== /api/apply received ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body fields:', Object.keys(req.body));
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');
    
    const { name, email, phone, coverNote, jobId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Resume is required' });
    if (!name || !email || !phone || !coverNote || !jobId) return res.status(400).json({ error: 'Missing required fields' });

    // Cloudinary only (gdrive path removed)
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'hiretrack/resumes', use_filename: true, unique_filename: true },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        try {
          const candidate = await Candidate.create({
            name,
            email,
            phone,
            jobId,
            resumeUrl: result.secure_url,
            coverNote,
            stage: 'Applied',
            history: [],
          });

          // Immediate response
          res.json({ message: 'Application received. ATS scoring queued.', candidate });

          // Background scoring
          (async () => {
            try {
              const job = await Job.findById(candidate.jobId);
              const fresh = await Candidate.findById(candidate._id);
              if (!job || !fresh) return;
              const scoring = await scoreResumeForCandidate({ candidate: fresh, job });
              const thresholdsEnv = process.env.ATS_STAGE_THRESHOLDS || 'Screening:60,Interview:75,Offer:90';
              const thresholds = Object.fromEntries(thresholdsEnv.split(',').map(p => { const [s,v] = p.split(':'); return [s.trim(), Number(v)]; }));
              const score = scoring.atsScore || 0;
              let nextStage = 'Applied';
              if (!scoring.recommendedStage) {
                if (score >= thresholds.Offer) nextStage = 'Offer';
                else if (score >= thresholds.Interview) nextStage = 'Interview';
                else if (score >= thresholds.Screening) nextStage = 'Screening';
                else nextStage = 'Rejected';
              } else {
                const rec = scoring.recommendedStage;
                const needed = thresholds[rec] ?? 0;
                nextStage = score >= needed ? rec : 'Applied';
              }
              fresh.ats = {
                evaluatedAt: new Date(),
                totalScore: scoring.atsScore,
                decision: nextStage === 'Rejected' ? 'Rejected' : nextStage,
                explanation: 'Screened by ATS service',
              };
              fresh.stage = nextStage;
              fresh.atsScore = scoring.atsScore;
              fresh.strengths = scoring.strengths;
              fresh.gaps = scoring.gaps;
              fresh.recommendedStage = scoring.recommendedStage;
              fresh.resumeText = scoring.resumeText;
              fresh.history.push({ from: 'Applied', to: nextStage, time: new Date() });
              await fresh.save();
              console.log(`[ATS] candidate=${candidate._id} score=${score} nextStage=${nextStage} resumeTextLen=${(scoring.resumeText||'').length}`);
              console.log('[ATS] strengths:', scoring.strengths);
              console.log('[ATS] gaps:', scoring.gaps);
            } catch (err) {
              console.error('[ATS] Background scoring failed:', err);
            }
          })();
        } catch (e) {
          return res.status(400).json({ error: e.message });
        }
      }
    ).end(req.file.buffer);
  } catch (e) {
    console.error('Apply route error:', e);
    res.status(500).json({ error: e.message || 'Internal server error' });
  }
});

// Routes
// Health endpoint (simple readiness check)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
  if (email !== ADMIN_EMAIL) return res.status(401).json({ error: 'Invalid credentials' });
  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD) {
    // Plain-text fallback for development if hash not set
    valid = password === ADMIN_PASSWORD;
  }
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = issueToken({ email, role: 'admin' });
  res.json({ token });
});

// Return current authenticated admin user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  // Token payload established in issueToken includes email & role
  const { email, role } = req.user || {};
  return res.json({ email, role });
});

// Jobs: list all (public)
app.get('/api/jobs', async (_req, res) => {
  try {
    const jobs = await Job.find().sort({ postedDate: -1 });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Jobs: get one (public)
app.get('/api/jobs/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete job
app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully', id: req.params.id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Dev-only: seed a few jobs for demo purposes
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/seed-jobs', async (_req, res) => {
    try {
      const sample = [
        {
          title: 'Senior Frontend Developer',
          description:
            'Build and maintain high-quality web applications using React and TypeScript. Collaborate with cross-functional teams to deliver features.',
          department: 'Engineering',
          location: 'Remote',
          type: 'Full-time',
          skills: ['React', 'TypeScript', 'TailwindCSS'],
          requirements: [
            '5+ years of frontend experience',
            'Strong React knowledge',
            'Experience with TypeScript',
          ],
          status: 'open',
        },
        {
          title: 'Product Designer',
          description:
            'Create beautiful, user-centric designs and work closely with product and engineering to ship solutions.',
          department: 'Design',
          location: 'San Francisco, CA',
          type: 'Full-time',
          skills: ['Figma', 'Design Systems', 'User Research'],
          requirements: ['Portfolio of UX/UI work', 'Experience with design systems'],
          status: 'open',
        },
        {
          title: 'DevOps Engineer',
          description:
            'Help scale our infrastructure and CI/CD workflows across environments.',
          department: 'Engineering',
          location: 'New York, NY',
          type: 'Full-time',
          skills: ['AWS', 'Docker', 'Kubernetes'],
          requirements: ['3+ years of DevOps', 'Kubernetes experience'],
          status: 'open',
        },
      ];
      const created = await Job.insertMany(sample);
      res.json({ ok: true, count: created.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}


// Multer error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({ error: `File upload error: ${error.message}` });
  } else if (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ error: error.message || 'File upload failed' });
  }
  next();
});

// Download resume (public access for viewing resumes)
app.get('/api/resume/:candidateId', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (!candidate.resumeUrl) return res.status(404).json({ error: 'Resume not found' });
    
    // Redirect to the actual resume URL (Cloudinary or Google Drive)
    res.redirect(candidate.resumeUrl);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Candidates by job
app.get('/api/candidates/:jobId', async (req, res) => {
  try {
    const items = await Candidate.find({ jobId: req.params.jobId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Manual screening - No API endpoint needed (admin reviews candidates directly in UI)

// Move stage - with pipeline validation
app.patch('/api/movestage/:id', authMiddleware, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Target stage "to" is required' });
    const c = await Candidate.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    
    // Get job pipeline to validate stage transition
    const job = await Job.findById(c.jobId);
    const validStages = ['Applied', ...(job?.pipelineStages || ['Screening', 'Interview', 'Offer']), 'Rejected'];
    if (!validStages.includes(to)) {
      return res.status(400).json({ error: `Invalid stage: ${to}. Valid stages for this job: ${validStages.join(', ')}` });
    }
    
    const old = c.stage;
    if (old === to) return res.json(c); // no-op
    c.stage = to;
    c.history.push({ from: old, to, time: new Date(), by: 'Admin' });
    await c.save();
    // Write pipeline log (best-effort; do not fail main request if log write fails)
    try {
      await PipelineLog.create({ candidateId: String(c._id), oldStage: old, newStage: to, time: new Date() });
    } catch (logErr) {
      console.warn('PipelineLog create failed:', logErr?.message || logErr);
    }
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Optional: list pipeline logs for a candidate
app.get('/api/pipeline-logs/:candidateId', authMiddleware, async (req, res) => {
  try {
    const logs = await PipelineLog.find({ candidateId: req.params.candidateId }).sort({ time: -1 });
    res.json(logs);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Dashboard stats (auth)
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
        return {
          id: log._id,
          message: c ? `${c.name} moved from ${log.oldStage} to ${log.newStage}` : `Candidate moved from ${log.oldStage} to ${log.newStage}`,
          time: log.time,
        };
      })
    );
    res.json({ totalJobs, openJobs, totalCandidates, stageMap, recentActivity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ATS scoring endpoint (auth)
// POST /api/ats/score { candidateId }
app.post('/api/ats/score', authMiddleware, async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ error: 'candidateId is required' });
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    const job = await Job.findById(candidate.jobId);
    if (!job) return res.status(404).json({ error: 'Related job not found' });

    const scoring = await scoreResumeForCandidate({ candidate, job });

    candidate.atsScore = scoring.atsScore;
    candidate.strengths = scoring.strengths;
    candidate.gaps = scoring.gaps;
    candidate.recommendedStage = scoring.recommendedStage;
    candidate.resumeText = scoring.resumeText;

    // Stage auto-update
    const prevStage = candidate.stage;
    let nextStage = prevStage;
    const score = scoring.atsScore || 0;
    const thresholdsEnv = process.env.ATS_STAGE_THRESHOLDS || 'Screening:60,Interview:75,Offer:90';
    const thresholds = Object.fromEntries(thresholdsEnv.split(',').map(p => { const [s,v] = p.split(':'); return [s.trim(), Number(v)]; }));

    if (!scoring.recommendedStage) {
      if (score >= thresholds.Offer) nextStage = 'Offer';
      else if (score >= thresholds.Interview) nextStage = 'Interview';
      else if (score >= thresholds.Screening) nextStage = 'Screening';
    } else {
      const rec = scoring.recommendedStage;
      const needed = thresholds[rec] ?? 0;
      if (score >= needed) nextStage = rec;
    }

    if (nextStage !== prevStage) {
      candidate.stage = nextStage;
      candidate.history.push({ from: prevStage, to: nextStage, time: new Date() });
      try {
        await PipelineLog.create({ candidateId: String(candidate._id), oldStage: prevStage, newStage: nextStage, time: new Date() });
      } catch (e) {
        console.warn('PipelineLog create failed (ATS):', e?.message || e);
      }
    }

    await candidate.save();
    res.json({ ok: true, candidate, scoring });
  } catch (e) {
    console.error('ATS scoring error:', e);
    res.status(500).json({ error: e.message || 'ATS scoring failed' });
  }
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Frontend static serving (Render single service) ----
// Assumes build output at ../dist (built by render.yaml buildCommand)
const distDir = path.resolve(__dirname, '../dist');

app.use(express.static(distDir));

// SPA fallback: send index.html for non-API GET requests
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

export default app;
