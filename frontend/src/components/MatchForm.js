import React, { useState } from "react";
import axios from "axios";

const API = "https://ai-based-candidate-shortlisting-system-nksd.onrender.com";

export default function MatchForm({ onResults }) {
  const [form, setForm] = useState({
    requiredSkills: "",
    minExperience: "",
    preferredSkills: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const parseSkills = (str) =>
    str.split(",").map((s) => s.trim()).filter(Boolean);

  const handleBasicMatch = async () => {
    setError("");
    if (!form.requiredSkills.trim()) return setError("Required skills cannot be empty.");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/match`, {
        requiredSkills: parseSkills(form.requiredSkills),
        minExperience: parseFloat(form.minExperience) || 0,
        preferredSkills: parseSkills(form.preferredSkills),
      });
      onResults(res.data, false);
    } catch (err) {
      setError(err.response?.data?.error || "Matching failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIMatch = async () => {
    setError("");
    if (!form.requiredSkills.trim()) return setError("Required skills cannot be empty.");
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai/shortlist`, {
        requiredSkills: parseSkills(form.requiredSkills),
        minExperience: parseFloat(form.minExperience) || 0,
        preferredSkills: parseSkills(form.preferredSkills),
      });
      onResults(res.data, true);
    } catch (err) {
      setError(
  err.response?.data?.details ||
  err.response?.data?.error ||
  "AI shortlisting failed."
);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-title">🎯 Shortlist Candidates</div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Required Skills * <span style={{ color: "var(--text2)", fontWeight: 400 }}>(comma separated)</span></label>
        <input
          name="requiredSkills"
          placeholder="e.g. React, Node.js, MongoDB"
          value={form.requiredSkills}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Preferred Skills <span style={{ color: "var(--text2)", fontWeight: 400 }}>(optional)</span></label>
        <input
          name="preferredSkills"
          placeholder="e.g. AWS, Docker, TypeScript"
          value={form.preferredSkills}
          onChange={handleChange}
        />
        <div className="form-hint">Nice-to-have skills (boost match score by up to 20%)</div>
      </div>

      <div className="form-group">
        <label>Minimum Experience (years)</label>
        <input
          name="minExperience"
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 1"
          value={form.minExperience}
          onChange={handleChange}
        />
      </div>

      <div className="alert alert-info" style={{ marginTop: 8 }}>
        💡 💡 <strong>Basic Match</strong> uses skill overlap algorithm. <strong>AI Match</strong> uses LLaMA 3 AI for deeper analysis.
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={handleBasicMatch} disabled={loading || aiLoading}>
          {loading ? "⏳ Matching..." : "🎯 Basic Match"}
        </button>
        <button className="btn btn-ai" onClick={handleAIMatch} disabled={loading || aiLoading}>
          {aiLoading ? "🤖 AI Analyzing..." : "🤖 AI Smart Match"}
        </button>
      </div>
    </div>
  );
}
