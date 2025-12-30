import { useEffect, useState } from "react";

// In dev: VITE_API_URL=http://localhost:3002
// In prod: VITE_API_URL=/trivia/api
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

  return <h1>{msg}</h1>;
}

export default App;
