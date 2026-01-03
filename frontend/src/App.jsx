import { useEffect, useState } from "react";
import AddQuestionForm from "./components/AddQuestionForm";
import QuestionsList from "./components/QuestionsList";
import ChatMessagesViewer from "./components/ChatMessagesViewer";
import ConnectionInfoPanel from "./components/ConnectionInfoPanel";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

function App() {
  const [msg, setMsg] = useState("Loading...");
  const [currentUserName, setCurrentUserName] = useState("");

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

      <ConnectionInfoPanel
        onLoginUser={(userName) => setCurrentUserName(userName)}
      />

      {currentUserName ? (
        <>
          <h2>Questions and Answers</h2>
          <AddQuestionForm userName={currentUserName} />
          <QuestionsList userName={currentUserName} />
        </>
      ) : (
        <p>Enter username and load settings to edit questions.</p>
      )}

      <h2>Live Chat</h2>
      <ChatMessagesViewer />
    </div>
  );
}

export default App;
