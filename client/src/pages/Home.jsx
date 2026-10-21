import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeResume } from "../api.js";

export default function Home() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { id } = await analyzeResume(new FormData(e.target));
      navigate(`/result/${id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>See your resume the way an <mark>ATS</mark> does.</h1>
        <p>Upload a PDF and paste the job description. You get a score out of 100, the skills you already show, and the ones the posting asks for that you don't.</p>
      </section>

      {error && <p className="flash" role="alert">{error}</p>}

      <form className="panel" onSubmit={onSubmit}>
        <label htmlFor="resume">Resume (PDF, up to 5 MB)</label>
        <input id="resume" type="file" name="resume" accept="application/pdf" required />

        <label htmlFor="jobTitle">Job title</label>
        <input id="jobTitle" type="text" name="jobTitle" placeholder="Backend Developer" />

        <label htmlFor="jd">Job description</label>
        <textarea id="jd" name="jobDescription" rows="10" placeholder="Paste the full job posting here" required />

        <button type="submit" disabled={busy}>{busy ? "Analyzing…" : "Analyze resume"}</button>
      </form>
    </>
  );
}
