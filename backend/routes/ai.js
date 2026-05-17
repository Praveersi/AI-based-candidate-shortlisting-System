const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const Candidate = require("../models/Candidate");

// POST /api/ai/shortlist — AI-based candidate ranking via OpenRouter
router.post("/shortlist", async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills } = req.body;

    if (!requiredSkills || requiredSkills.length === 0) {
      return res.status(400).json({ error: "requiredSkills is required." });
    }

    // Fetch candidates meeting experience criteria
    const candidates = await Candidate.find({
      experience: { $gte: minExperience || 0 },
    });

    if (candidates.length === 0) {
      return res.json({ message: "No candidates found matching experience criteria.", results: [] });
    }

    // Build prompt
    const candidateList = candidates
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} | Skills: ${c.skills.join(", ")} | Experience: ${c.experience} years${c.bio ? ` | Bio: ${c.bio}` : ""}`
      )
      .join("\n");

    const prompt = `
You are a professional technical recruiter AI. Analyze and rank the following candidates for a job.

JOB REQUIREMENTS:
- Required Skills: ${requiredSkills.join(", ")}
- Minimum Experience: ${minExperience || 0} years
- Preferred Skills: ${(preferredSkills || []).join(", ") || "None"}

CANDIDATES:
${candidateList}

TASK:
1. Rank all candidates from best to worst fit.
2. For each candidate give a match score out of 100.
3. Write a 1-2 sentence explanation of why they are or aren't a good fit.
4. Also suggest 2 interview questions for the top candidate.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "rankedCandidates": [
    {
      "name": "Candidate Name",
      "score": 85,
      "explanation": "Why this candidate fits or doesn't fit.",
      "interviewQuestions": ["Q1", "Q2"]
    }
  ]
}
Note: include "interviewQuestions" only for the top-ranked candidate, leave it as empty array [] for others.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://candidate-shortlister.onrender.com",
        "X-Title": "Candidate Shortlister",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "OpenRouter API error", details: errText });
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

    // Parse JSON from AI response
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", raw: rawText });
    }

    // Attach candidate metadata
    const enriched = parsed.rankedCandidates.map((aiResult) => {
      const match = candidates.find(
        (c) => c.name.toLowerCase() === aiResult.name.toLowerCase()
      );
      return {
        ...aiResult,
        email: match?.email || "",
        skills: match?.skills || [],
        experience: match?.experience || 0,
      };
    });

    res.json({ total: enriched.length, results: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/interview-questions — Generate questions for a specific candidate
router.post("/interview-questions", async (req, res) => {
  try {
    const { candidateId, jobRole, requiredSkills } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const prompt = `
Generate 5 technical interview questions for the following candidate:
Name: ${candidate.name}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experience} years
Job Role: ${jobRole || "Software Developer"}
Required Skills: ${(requiredSkills || []).join(", ")}

Respond ONLY in JSON format:
{ "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"] }
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://candidate-shortlister.onrender.com",
        "X-Title": "Candidate Shortlister",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    res.json({ candidate: candidate.name, ...parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
