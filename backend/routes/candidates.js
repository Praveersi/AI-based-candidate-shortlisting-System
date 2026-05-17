const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");

// POST /api/candidates — Add a candidate
router.post("/", async (req, res) => {
  try {
    const { name, email, skills, experience, bio } = req.body;

    if (!name || !email || !skills || experience === undefined) {
      return res.status(400).json({ error: "name, email, skills, and experience are required." });
    }

    const existing = await Candidate.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Candidate with this email already exists." });
    }

    const candidate = new Candidate({ name, email, skills, experience, bio });
    await candidate.save();
    res.status(201).json({ message: "Candidate added successfully", candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates — Get all candidates
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { skills: { $elemMatch: { $regex: search, $options: "i" } } },
        ],
      };
    }
    const candidates = await Candidate.find(query).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/candidates/:id — Delete a candidate
router.delete("/:id", async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: "Candidate deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
