import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://ai-based-candidate-shortlisting-system-nksd.onrender.com";

export default function CandidateList() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/candidates`, {
        params: search ? { search } : {},
      });
      setCandidates(res.data);
    } catch {
      setError("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []); // eslint-disable-line

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchCandidates();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await axios.delete(`${API}/api/candidates/${id}`);
      setCandidates((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">👥 All Candidates</div>
        <div style={{ color: "var(--text2)", fontSize: 14 }}>
          {candidates.length} total
        </div>
      </div>

      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search by name or skill... (press Enter)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <div>Loading candidates...</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🗂️</div>
          <div className="empty-text">No candidates found. Add some!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {candidates.map((c) => (
            <div key={c._id} className="candidate-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="candidate-name">{c.name}</div>
                  <div className="candidate-email">✉️ {c.email}</div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(c._id, c.name)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>

              <div className="skills-wrap">
                {c.skills.map((s) => (
                  <span key={s} className="badge badge-skill">{s}</span>
                ))}
              </div>

              <div className="candidate-exp">
                🕒 {c.experience} {c.experience === 1 ? "year" : "years"} experience
              </div>

              {c.bio && (
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
                  {c.bio}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
