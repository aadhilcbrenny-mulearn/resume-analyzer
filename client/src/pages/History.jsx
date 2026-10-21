import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAnalysis, getHistory } from "../api.js";

export default function History() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory().then(setRows).catch((e) => setError(e.message));
  }, []);

  async function remove(id) {
    try {
      await deleteAnalysis(id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Past analyses</h1>
      {error && <p className="flash" role="alert">{error}</p>}
      {rows === null && !error && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="muted">Nothing here yet. <Link to="/">Analyze your first resume.</Link></p>
      )}
      {rows && rows.length > 0 && (
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>Job</th><th>Resume</th><th>Score</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td><Link to={`/result/${r.id}`}>{r.job_title}</Link></td>
                  <td>{r.filename}</td>
                  <td><b>{r.score}</b>/100</td>
                  <td><button className="link" onClick={() => remove(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
