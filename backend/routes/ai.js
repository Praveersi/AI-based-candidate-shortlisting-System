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

    // 🔥 Safety check
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    const candidates = await Candidate.find({
      experience: { $gte: minExperience || 0 },
    });

    if (candidates.length === 0) {
      return res.json({ message: "No candidates found matching experience criteria.", results: [] });
    }

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
3. Write a 1-2 sentence explanation.
4. Suggest 2 interview questions for the top candidate.

Respond ONLY in JSON:
{
  "rankedCandidates": [
    {
      "name": "Candidate Name",
      "score": 85,
      "explanation": "Reason",
      "interviewQuestions": ["Q1", "Q2"]
    }
  ]
}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",  // ✅ FIXED
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

    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON", raw: rawText });
    }

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

module.exports = router;