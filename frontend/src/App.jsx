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
      .then((data) => setMsg(`Server Status: ${data.status}`))
      .catch((err) => {
        console.error("API error:", err);
        setMsg("Failed to load message");
      });
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Youtube Livestream Trivia Game</h2>
      <h3>Create a new profile or login to run the game.</h3>

      {/* This is the TWO-COLUMN layout */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          marginTop: 16,
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "#f9f9f9", // <-- TEMP so you can see the column
            padding: 8,
            borderRadius: 4,
          }}
        >
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

          <h3 style={{ marginTop: 24 }}>{msg}</h3>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            width: "40%",
            minWidth: 320,
            maxWidth: 500,
            background: "#eef5ff", // <-- TEMP so you can see the column
            padding: 8,
            borderRadius: 4,
          }}
        >
          <ChatMessagesViewer />
        </div>
      </div>
    </div>
  );
}

export default App;
