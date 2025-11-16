import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;

// Fetch resume (expects a PDF for text extraction). Returns { text, buffer }.
async function fetchAndExtractResume(resumeUrl) {
  if (!resumeUrl) {
    return { text: '', buffer: null };
  }
  try {
    const resp = await fetch(resumeUrl);
    if (!resp.ok) throw new Error(`Failed to download resume: ${resp.status}`);
    const contentType = resp.headers.get('content-type') || '';
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (contentType.includes('pdf') || resumeUrl.toLowerCase().endsWith('.pdf')) {
      try {
        const parsed = await pdfParse(buffer);
        return { text: parsed.text || '', buffer };
      } catch (e) {
        // Fallback: return empty text if parse fails
        return { text: '', buffer };
      }
    }
    // Unsupported type for extraction; return empty text
    return { text: '', buffer };
  } catch (e) {
    return { text: '', buffer: null };
  }
}

function buildPrompt({ resumeText, job }) {
  const limitedResume = resumeText ? resumeText.slice(0, 25000) : 'NO_EXTRACTED_TEXT';
  const jobDesc = job.description || '';
  return `You are an ATS scoring assistant.
Assess how well the candidate's resume matches the job description.
Return ONLY strict JSON with these fields:
{
  "atsScore": <number 0-100>,
  "strengths": ["string"...],
  "gaps": ["string"...],
  "recommendedStage": "Applied" | "Screening" | "Interview" | "Offer"
}
Rules:
- atsScore must be an integer 0-100.
- strengths: concrete skill or experience matches.
- gaps: missing key requirements or skills.
- recommendedStage based on readiness: <60 => Applied, 60-74 => Screening, 75-89 => Interview, >=90 => Offer.
Resume Text:\n${limitedResume}\n\nJob Description:\n${jobDesc}`;
}

function safeParseJson(content) {
  if (!content) return null;
  // Attempt direct parse
  try { return JSON.parse(content); } catch {}
  // Extract first JSON object substring
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const sub = content.slice(start, end + 1);
    try { return JSON.parse(sub); } catch {}
  }
  return null;
}

export async function scoreResumeForCandidate({ candidate, job }) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

  const { text: resumeText } = await fetchAndExtractResume(candidate.resumeUrl);
  const userPrompt = buildPrompt({ resumeText, job });

  const body = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.2,
    messages: [
      { role: 'system', content: 'You are a precise JSON-returning ATS assistant.' },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  };

  let jsonResp = null;
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      throw new Error(`Groq API error ${resp.status}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    jsonResp = safeParseJson(content);
  } catch (e) {
    throw new Error(`Groq request failed: ${e.message || e}`);
  }

  if (!jsonResp || typeof jsonResp.atsScore !== 'number') {
    throw new Error('Invalid JSON response from Groq');
  }

  // Normalize response
  const atsScore = Math.max(0, Math.min(100, Math.round(jsonResp.atsScore)));
  const strengths = Array.isArray(jsonResp.strengths) ? jsonResp.strengths.slice(0, 25) : [];
  const gaps = Array.isArray(jsonResp.gaps) ? jsonResp.gaps.slice(0, 25) : [];
  const recommendedStage = ['Applied','Screening','Interview','Offer'].includes(jsonResp.recommendedStage) ? jsonResp.recommendedStage : undefined;

  return {
    atsScore,
    strengths,
    gaps,
    recommendedStage,
    resumeText
  };
}
