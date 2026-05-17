const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");

// POST /api/match — Basic skill + experience matching
router.post("/", async (req, res) => {
  try {
    const { requiredSkills, minExperience, preferredSkills } = req.body;

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({ error: "requiredSkills array is required." });
    }

    const candidates = await Candidate.find({
      experience: { $gte: minExperience || 0 },
    });

    const normalizeSkill = (s) => s.toLowerCase().trim();
    const reqSkillsNorm = requiredSkills.map(normalizeSkill);
    const prefSkillsNorm = (preferredSkills || []).map(normalizeSkill);

    const scored = candidates.map((candidate) => {
      const candidateSkillsNorm = candidate.skills.map(normalizeSkill);

      const matchedRequired = reqSkillsNorm.filter((s) =>
        candidateSkillsNorm.includes(s)
      );
      const matchedPreferred = prefSkillsNorm.filter((s) =>
        candidateSkillsNorm.includes(s)
      );

      const requiredScore = reqSkillsNorm.length > 0
        ? matchedRequired.length / reqSkillsNorm.length
        : 0;

      const preferredBonus = prefSkillsNorm.length > 0
        ? (matchedPreferred.length / prefSkillsNorm.length) * 0.2
        : 0;

      const finalScore = Math.min(requiredScore + preferredBonus, 1);

      let matchLevel = "Low";
      if (finalScore >= 0.8) matchLevel = "High";
      else if (finalScore >= 0.5) matchLevel = "Medium";

      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        experience: candidate.experience,
        bio: candidate.bio,
        matchScore: Math.round(finalScore * 100),
        matchLevel,
        matchedRequired,
        matchedPreferred,
      };
    });

    const sorted = scored
      .filter((c) => c.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ total: sorted.length, results: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
