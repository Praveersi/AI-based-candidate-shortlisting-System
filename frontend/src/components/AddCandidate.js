import React, { useState } from "react";
import axios from "axios";

const API = "https://ai-based-candidate-shortlisting-system-nksd.onrender.com";

export default function AddCandidate({ onSuccess }) {
  const [form, setForm] = useState({
    name: "", email: "", skills: "", experience: "", bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const { name, email, skills, experience } = form;
    if (!name || !email || !skills || experience === "") {
      return setError("Please fill all required fields.");
    }
    const skillsArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillsArr.length === 0) return setError("Enter at least one skill.");

    setLoading(true);
    try {
      await axios.post(`${API}/api/candidates`, {
        name, email,
        skills: skillsArr,
        experience: parseFloat(experience),
        bio: form.bio,
      });
      setSuccess(`✅ ${name} added successfully!`);
      setForm({ name: "", email: "", skills: "", experience: "", bio: "" });
      setTimeout(() => onSuccess && onSuccess(), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 580 }}>
      <div className="card-title">➕ Add New Candidate</div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="form-group">
          <label>Full Name *</label>
          <input name="name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input name="email" type="email" placeholder="e.g. rahul@gmail.com" value={form.email} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Skills * <span style={{ color: "var(--text2)", fontWeight: 400 }}>(comma separated)</span></label>
        <input name="skills" placeholder="e.g. React, Node.js, MongoDB, Python" value={form.skills} onChange={handleChange} />
        <div className="form-hint">Separate each skill with a comma</div>
      </div>

      <div className="form-group">
        <label>Experience (years) *</label>
        <input name="experience" type="number" min="0" step="0.5" placeholder="e.g. 2" value={form.experience} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Bio / Projects <span style={{ color: "var(--text2)", fontWeight: 400 }}>(optional)</span></label>
        <textarea name="bio" placeholder="Brief description of projects, background..." value={form.bio} onChange={handleChange} />
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "⏳ Adding..." : "➕ Add Candidate"}
      </button>
    </div>
  );
}
