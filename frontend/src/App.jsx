import { useEffect, useState } from "react";
import AddQuestionForm from "./components/AddQuestionForm";
import QuestionsList from "./components/QuestionsList";
import ChatMessagesViewer from "./components/ChatMessagesViewer";
import ConnectionInfoPanel from "./components/ConnectionInfoPanel";
import ImportQuestionsFromFile from "./components/ImportQuestionsFromFile";

import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

function App() {
  const [msg, setMsg] = useState("Checking server…");
  const [currentUserName, setCurrentUserName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleQuestionAdded = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setMsg(`Server status: ${data.status}`))
      .catch((err) => {
        console.error("API error:", err);
        setMsg("Server status: offline");
      });
  }, []);

  const isHealthy = msg.toLowerCase().includes("ok") || msg.toLowerCase().includes("running");

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title-block">
          <h1 className="app-title">
            YouTube Livestream Trivia
            <span className="app-title-pill">Control Panel</span>
          </h1>
          <p className="app-subtitle">
            Configure your channel, manage questions, and monitor live chat.
          </p>
        </div>

        <div className={`status-pill ${isHealthy ? "ok" : "error"}`}>
          <span className="status-dot" />
          <span>{msg}</span>
        </div>
      </header>

      <main className="app-main">
        {/* LEFT COLUMN */}
        <section className="panel panel-left">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Connection & Game Settings</h2>
              <span className="card-subtitle">
                Load or save your configuration, then start the bot.
              </span>
            </div>
            <ConnectionInfoPanel
              onLoginUser={(userName) => setCurrentUserName(userName)}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Question Bank</h2>
              <span className="card-subtitle">
                Add, import, and edit questions used in your trivia game.
              </span>
            </div>
            {currentUserName ? (
              <>
                <AddQuestionForm
                  userName={currentUserName}
                  onQuestionAdded={handleQuestionAdded}
                />
                <hr className="section-divider" />
                <ImportQuestionsFromFile
                  userName={currentUserName}
                  onImported={handleQuestionAdded}
                />
                <QuestionsList
                  userName={currentUserName}
                  refreshKey={refreshKey}
                />
              </>
            ) : (
              <div className="empty-state">
                Enter your username & password above and click <strong>Load
                settings</strong> to start editing questions.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="panel panel-right">
          <ChatMessagesViewer />
        </aside>
      </main>
    </div>
  );
}

export default App;
