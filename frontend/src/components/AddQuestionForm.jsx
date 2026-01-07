import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function AddQuestionForm({ userName, onQuestionAdded }) {
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!userName) {
      setStatus("No user selected. Load settings first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionText, answerText, userName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add question");
      }
      const created = await res.json();
      if (onQuestionAdded) onQuestionAdded(created);

      setStatus("Question added!");
      setQuestionText("");
      setAnswerText("");
    } catch (err) {
      console.error("Add question error:", err);
      setStatus(err.message || "Error adding question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label className="field-label">Question</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="field">
          <label className="field-label">Answer</label>
          <input
            className="input"
            type="text"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" type="submit" disabled={loading || !userName}>
          {loading ? "Saving…" : "Add Question"}
        </button>
      </div>

      {status && <div className="status-text">{status}</div>}
    </form>
  );
}
