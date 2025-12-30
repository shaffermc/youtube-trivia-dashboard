import { useEffect, useState } from "react";
import AddQuestionForm from "./AddQuestionForm";
import QuestionsList from "./QuestionsList";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setMsg(`Status: ${data.status}`))
      .catch((err) => {
        console.error("API error:", err);
        setMsg("Failed to load message");
      });
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>{msg}</h1>
      <AddQuestionForm />
      <QuestionsList />
    </div>
  );
}

export default App;
