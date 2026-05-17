import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const scoreColor = (score) => {
  if (score >= 80) return "#43e97b";
  if (score >= 50) return "#ffd93d";
  return "#ff6b6b";
};

const levelBadge = (level) => (
  <span className={`badge badge-${level}`}>{level} Match</span>
);

export default function ShortlistedResults({ results, isAI }) {
  if (!results) {
    return (
      <div className="empty">
        <div className="empty-icon">📊</div>
        <div className="empty-text">Run a shortlist to see results here.</div>
      </div>
    );
  }

  const { total, results: candidates } = results;

  if (!candidates || candidates.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🔍</div>
        <div className="empty-text">No candidates matched your criteria.</div>
      </div>
    );
  }

  const chartData = candidates.slice(0, 10).map((c) => ({
    name: c.name.split(" ")[0],
    score: c.score ?? c.matchScore ?? 0,
  }));

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          {isAI ? "🤖 AI Shortlist Results" : "🎯 Match Results"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${isAI ? "badge-skill" : "badge-medium"}`}>
            {isAI ? "AI Powered" : "Basic Match"}
          </span>
          <span style={{ color: "var(--text2)", fontSize: 14 }}>{total} found</span>
        </div>
      </div>

      {/* Chart */}
      <div className="card chart-wrap" style={{ marginBottom: 24 }}>
        <div className="chart-title">📊 Match Score Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a42" />
            <XAxis dataKey="name" tick={{ fill: "#9898b8", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#9898b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#14142a", border: "1px solid #2a2a42", borderRadius: 8 }}
              labelStyle={{ color: "#e8e8f0" }}
              itemStyle={{ color: "#a78bfa" }}
              formatter={(v) => [`${v}%`, "Score"]}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={scoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Candidate Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {candidates.map((c, idx) => {
          const score = c.score ?? c.matchScore ?? 0;
          const level = c.matchLevel || (score >= 80 ? "High" : score >= 50 ? "Medium" : "Low");

          return (
            <div key={idx} className={`result-card ${level}`}>
              <div className="result-rank">#{idx + 1}</div>

              <div style={{ paddingRight: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div className="candidate-name">{c.name}</div>
                  {levelBadge(level)}
                </div>

                {c.email && (
                  <div className="candidate-email">✉️ {c.email}</div>
                )}

                {/* Score bar */}
                <div className="score-bar-wrap">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>Match Score</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
                  </div>
                  <div className="score-bar-bg">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${score}%`, background: scoreColor(score) }}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Skills</div>
                  <div className="skills-wrap">
                    {(c.skills || []).map((s) => {
                      const isMatched = (c.matchedRequired || [])
                        .map((x) => x.toLowerCase())
                        .includes(s.toLowerCase());
                      return (
                        <span
                          key={s}
                          className="badge"
                          style={{
                            background: isMatched ? "rgba(67,233,123,0.15)" : "rgba(108,99,255,0.12)",
                            color: isMatched ? "#43e97b" : "#a78bfa",
                            border: `1px solid ${isMatched ? "rgba(67,233,123,0.3)" : "rgba(108,99,255,0.25)"}`,
                          }}
                        >
                          {isMatched ? "✓ " : ""}{s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="candidate-exp">
                  🕒 {c.experience} {c.experience === 1 ? "year" : "years"} experience
                </div>

                {/* AI Explanation */}
                {c.explanation && (
                  <div className="ai-explanation">
                    🤖 <strong>AI Analysis:</strong> {c.explanation}
                  </div>
                )}

                {/* Interview Questions */}
                {c.interviewQuestions && c.interviewQuestions.length > 0 && (
                  <div className="interview-qs">
                    <h4>🎤 Suggested Interview Questions</h4>
                    <ol>
                      {c.interviewQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Matched skills summary for basic match */}
                {!isAI && c.matchedRequired && c.matchedRequired.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text2)" }}>
                    ✅ Matched: {c.matchedRequired.join(", ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
