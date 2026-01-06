// src/components/ImportQuestionsFromFile.jsx
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function ImportQuestionsFromFile({ userName, onImported }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setStatus("");
  };

  const parseText = (text) => {
    const lines = text.split(/\r?\n/);
    const result = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue; // skip empty/comments

      const [q, a] = trimmed.split("|");
      if (!q || !a) continue;

      result.push({
        questionText: q.trim(),
        answerText: a.trim(),
      });
    }

    return result;
  };

  const handleImport = async () => {
    if (!userName) {
      setStatus("No user selected. Load settings first.");
      return;
    }
    if (!file) {
      setStatus("Choose a file first.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Reading file...");

      const text = await file.text();
      const questions = parseText(text);

      if (questions.length === 0) {
        setStatus("No valid questions found in file.");
        return;
      }

      setStatus(`Parsed ${questions.length} questions. Uploading...`);

      const res = await fetch(`${API_BASE}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, questions }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import questions");
      }

      setStatus(`Imported ${data.length} question(s).`);

      if (onImported) onImported(data); // so App can bump refreshKey
    } catch (err) {
      console.error("Import error:", err);
      setStatus(err.message || "Error importing questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20, maxWidth: 600 }}>
      <h3>Import Questions From File</h3>
      <p style={{ fontSize: "0.9em" }}>
        Format: <code>Question text|Answer text</code> per line.
      </p>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        style={{ marginRight: 8 }}
      />

      <button onClick={handleImport} disabled={loading || !file}>
        {loading ? "Importing..." : "Import"}
      </button>

      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
