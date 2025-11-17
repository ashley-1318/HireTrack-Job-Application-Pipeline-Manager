import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function aiAtsScore(resumeText, jobDescription) {
  const prompt = `
You are an ATS scoring engine. Compare the resume with the job description.

Return ONLY JSON in this format:
{
 "skill_match": number,
 "experience_match": number,
 "education_match": number,
 "keyword_match": number,
 "total_score": number,
 "decision": "Screening" or "Rejected",
 "explanation": "short reason"
}

Rules:
- Weightage: skill 40%, experience 30%, education 20%, keyword match 10%
- If total_score >= 60 → decision = "Screening"
- Otherwise → "Rejected"

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}
