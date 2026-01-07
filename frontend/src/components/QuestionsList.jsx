import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function QuestionsList({ userName, refreshKey }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");

  useEffect(() => {
    if (!userName) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    const fetchQuestions = async () => {
      setLoading(true);
      setStatus("Loading questions…");
      try {
        const res = await fetch(
          `${API_BASE}/questions?userName=${encodeURIComponent(userName)}`
        );
        const data = await res.json();
        setQuestions(data);
        setStatus("");
      } catch (err) {
        console.error("Error loading questions:", err);
        setStatus("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [userName, refreshKey]);

  const startEdit = (q) => {
    setEditingId(q._id);
    setEditQuestionText(q.questionText);
    setEditAnswerText(q.answerText);
    setStatus("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestionText("");
    setEditAnswerText("");
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editQuestionText,
          answerText: editAnswerText,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update question");
      }

      const updated = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q._id === id ? updated : q))
      );
      setStatus("Question updated");
      cancelEdit();
    } catch (err) {
      console.error("Update error:", err);
      setStatus(err.message || "Error updating question");
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await fetch(`${API_BASE}/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete question");
      }
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setStatus("Question deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setStatus(err.message || "Error deleting question");
    }
  };

  if (loading) return <p className="status-text">Loading questions…</p>;

  return (
    <div style={{ marginTop: 18 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 15 }}>Questions</h2>
      {status && <div className="status-text">{status}</div>}

      {questions.length === 0 ? (
        <div className="empty-state">No questions found.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const isEditing = editingId === q._id;
              return (
                <tr key={q._id}>
                  <td>
                    {isEditing ? (
                      <textarea
                        value={editQuestionText}
                        onChange={(e) => setEditQuestionText(e.target.value)}
                        rows={3}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      q.questionText
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="input"
                        type="text"
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                      />
                    ) : (
                      q.answerText
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="btn-row">
                        <button
                          className="btn"
                          onClick={() => saveEdit(q._id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="btn-row">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => startEdit(q)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => deleteQuestion(q._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
