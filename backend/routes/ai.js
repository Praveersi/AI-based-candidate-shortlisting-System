const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const Candidate = require("../models/Candidate");

// Helper: robustly extract JSON from AI response
function extractJSON(text) {
  let clean = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// POST /api/ai/shortlist
router.post("/shortlist", async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills } = req.body;

    if (!requiredSkills || requiredSkills.length === 0) {
      return res.status(400).json({ error: "requiredSkills is required." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "API key missing on server." });
    }

    const candidates = await Candidate.find({
      experience: { $gte: minExperience || 0 },
    });

    if (candidates.length === 0) {
      return res.json({ message: "No candidates found.", results: [] });
    }

    const candidateList = candidates
      .map((c, i) =>
        `${i + 1}. Name: ${c.name} | Skills: ${c.skills.join(", ")} | Experience: ${c.experience} years${c.bio ? ` | Bio: ${c.bio}` : ""}`
      )
      .join("\n");

    const prompt = `You are a technical recruiter AI. Rank these candidates for the job below.

JOB:
Required Skills: ${requiredSkills.join(", ")}
Min Experience: ${minExperience || 0} years
Preferred Skills: ${(preferredSkills || []).join(", ") || "None"}

CANDIDATES:
${candidateList}

Return ONLY raw JSON, no markdown, no extra text:
{"rankedCandidates":[{"name":"Full Name","score":85,"explanation":"Short reason.","interviewQuestions":["Q1","Q2"]},{"name":"Other Name","score":60,"explanation":"Short reason.","interviewQuestions":[]}]}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://candidate-shortlister.onrender.com",
        "X-Title": "Candidate Shortlister",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a JSON-only API. Return valid raw JSON only. No markdown, no explanation, no extra text outside the JSON object."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "OpenRouter API error", details: errText });
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

    const parsed = extractJSON(rawText);
    if (!parsed || !parsed.rankedCandidates) {
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

// POST /api/ai/interview-questions
router.post("/interview-questions", async (req, res) => {
  try {
    const { candidateId, jobRole, requiredSkills } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const prompt = `Generate 5 technical interview questions for:
Name: ${candidate.name}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experience} years
Job Role: ${jobRole || "Software Developer"}
Required Skills: ${(requiredSkills || []).join(", ")}

Return ONLY raw JSON: {"questions":["Q1","Q2","Q3","Q4","Q5"]}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://candidate-shortlister.onrender.com",
        "X-Title": "Candidate Shortlister",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: "You are a JSON-only API. Return raw JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const rawText = data.choices[0].message.content;
    const parsed = extractJSON(rawText);
    if (!parsed) return res.status(500).json({ error: "AI returned invalid JSON", raw: rawText });
    res.json({ candidate: candidate.name, ...parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;