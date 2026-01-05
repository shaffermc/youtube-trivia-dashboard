import { useEffect, useState } from "react";
import AddQuestionForm from "./components/AddQuestionForm";
import QuestionsList from "./components/QuestionsList";
import ChatMessagesViewer from "./components/ChatMessagesViewer";
import ConnectionInfoPanel from "./components/ConnectionInfoPanel";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

function App() {
  const [msg, setMsg] = useState("Loading...");
  const [currentUserName, setCurrentUserName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);


  const handleQuestionAdded = () => {
    setRefreshKey((k) => k + 1);
  };

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
              <AddQuestionForm userName={currentUserName} onQuestionAdded={handleQuestionAdded} />
              <QuestionsList userName={currentUserName} refreshKey={refreshKey} />
            </>
          ) : (
            <p>Enter username and load settings to edit questions.</p>
          )}

          <h3 style={{ marginTop: 24 }}>{msg}</h3>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            width: "60%",
            minWidth: 320,
            maxWidth: 700,
            minHeight: 600,
            maxHeight: 700,
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
