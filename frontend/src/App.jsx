import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => res.json())
      .then((data) => setMsg(data.message))
      .catch((err) => {
        console.error("API error:", err);
        setMsg("Failed to load message");
      });
  }, []);

  return <h1>{msg}</h1>;
}

export default App;
