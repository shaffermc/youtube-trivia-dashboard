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
    <div style={{ marginTop: 20, maxWidth: 600 }}>
      <h2>Add Question</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Question:
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Answer:
          </label>
          <input
            type="text"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </div>

        <button type="submit" disabled={loading || !userName}>
          {loading ? "Saving..." : "Add Question"}
        </button>

        {status && <div style={{ marginTop: 8 }}>{status}</div>}
      </form>
    </div>
  );
}
