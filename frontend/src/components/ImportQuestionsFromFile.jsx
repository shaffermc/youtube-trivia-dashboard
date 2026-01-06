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
      // split into lines and send raw; backend will parse "Q#A"
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setStatus("No non-empty lines found in file.");
        return;
      }

      setStatus(`Parsed ${lines.length} lines. Uploading...`);

      const res = await fetch(`${API_BASE}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, lines }), 
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import questions");
      }

      setStatus(`Imported ${data.inserted} question(s).`);

      if (onImported) onImported(); 
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
        Format per line: <code>Question text#Answer text</code>
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
