import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

function App() {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/scores/highscores`)
      .then((res) => res.json())
      .then((data) => setScores(data))
      .catch((err) => {
        console.error("API error:", err);
        setError("Failed to load highscores");
      });
  }, []);

  if (error) return <h1>{error}</h1>;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>YouTube Trivia Dashboard</h1>
      <h2>High Scores</h2>
      <ul>
        {scores.map((s) => (
          <li key={s._id}>
            {s.userName}: {s.score}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
