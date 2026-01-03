import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function QuestionsList({ userName }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");

  // Load questions
  useEffect(() => {
    if (!userName) {
      setQuestions([]);
      return;
    }
    const fetchQuestions = async () => {
      setLoading(true);
      setStatus("Loading questions");
      try {
        const res = await fetch(`${API_BASE}/questions?userName=${encodeURIComponent(userName)}`);
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
  }, [userName]);

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

  if (loading) return <p>Loading questions...</p>;

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Questions</h2>
      {status && <div style={{ marginBottom: 10 }}>{status}</div>}

      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            maxWidth: "900px",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Question</th>
              <th style={thStyle}>Answer</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const isEditing = editingId === q._id;
              return (
                <tr key={q._id}>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <textarea
                        value={editQuestionText}
                        onChange={(e) =>
                          setEditQuestionText(e.target.value)
                        }
                        rows={3}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      q.questionText
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editAnswerText}
                        onChange={(e) =>
                          setEditAnswerText(e.target.value)
                        }
                        style={{ width: "100%" }}
                      />
                    ) : (
                      q.answerText
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(q._id)}
                          style={{ marginRight: 8 }}
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(q)}
                          style={{ marginRight: 8 }}
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteQuestion(q._id)}>
                          Delete
                        </button>
                      </>
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

const thStyle = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "8px",
  verticalAlign: "top",
};
