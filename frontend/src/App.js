import React, { useState } from "react";
import AddCandidate from "./components/AddCandidate";
import CandidateList from "./components/CandidateList";
import MatchForm from "./components/MatchForm";
import ShortlistedResults from "./components/ShortlistedResults";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("candidates");
  const [results, setResults] = useState(null);
  const [isAI, setIsAI] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleResults = (data, aiMode) => {
    setResults(data);
    setIsAI(aiMode);
    setActiveTab("results");
  };

  const tabs = [
    { id: "candidates", label: "Candidates", icon: "👥" },
    { id: "add", label: "Add Candidate", icon: "➕" },
    { id: "match", label: "Shortlist", icon: "🎯" },
    { id: "results", label: "Results", icon: "📊" },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">TalentAI</span>
          </div>
          <p className="tagline">Smart Candidate Shortlisting System</p>
        </div>
      </header>

      <nav className="nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === "candidates" && (
          <CandidateList key={refreshKey} />
        )}
        {activeTab === "add" && (
          <AddCandidate
            onSuccess={() => {
              setRefreshKey((k) => k + 1);
              setActiveTab("candidates");
            }}
          />
        )}
        {activeTab === "match" && (
          <MatchForm onResults={handleResults} />
        )}
        {activeTab === "results" && (
          <ShortlistedResults results={results} isAI={isAI} />
        )}
      </main>
    </div>
  );
}
