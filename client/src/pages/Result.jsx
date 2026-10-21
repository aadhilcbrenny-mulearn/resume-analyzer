import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAnalysis } from "../api.js";

function Chips({ items, kind, empty }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <p className="chips">
      {items.map((s) => <span key={s} className={`chip ${kind}`}>{s}</span>)}
    </p>
  );
}

export default function Result() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalysis(id).then(setRow).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="flash" role="alert">{error} <Link to="/history">Back to history</Link></p>;
  if (!row) return <p className="muted">Loading…</p>;

  const r = row.details;
  return (
    <>
      <section className="scorehead">
        <div className="ring" style={{ "--p": r.score }}><span>{r.score}</span></div>
        <div>
          <h1>{r.label}</h1>
          <p className="muted">{row.filename} against {row.job_title} · {r.wordCount} words</p>
        </div>
      </section>

      <section className="bars">
        {Object.entries(r.breakdown).map(([name, val]) => (
          <div className="bar" key={name}>
            <span>{name}</span>
            <div className="track"><i style={{ width: `${val}%` }} /></div>
            <b>{val}%</b>
          </div>
        ))}
      </section>

      <section className="cols">
        <div className="panel">
          <h2>Missing skills</h2>
          <Chips items={r.missingSkills} kind="miss" empty="Every skill the posting names appears in your resume." />
          <h2>Missing keywords</h2>
          <Chips items={r.missingKeywords} kind="miss" empty="No important keywords missing." />
        </div>
        <div className="panel">
          <h2>Matched skills</h2>
          <Chips items={r.matchedSkills} kind="hit" empty="No skills from the posting were found." />
          <h2>Other skills on your resume</h2>
          <Chips items={r.extraSkills} kind="" empty="None detected." />
        </div>
      </section>

      <section className="panel">
        <h2>What to fix</h2>
        <ul className="tips">{r.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      {r.ai && !r.ai.error && (
        <section className="panel ai">
          <h2>AI suggestions <small>by Gemini · review before using</small></h2>
          <p>{r.ai.summary}</p>
          {r.ai.strengths.length > 0 && (<><h3>Strengths</h3><ul className="tips">{r.ai.strengths.map((t) => <li key={t}>{t}</li>)}</ul></>)}
          {r.ai.improvements.length > 0 && (<><h3>Improve</h3><ul className="tips">{r.ai.improvements.map((t) => <li key={t}>{t}</li>)}</ul></>)}
          {r.ai.rewrites.length > 0 && (
            <>
              <h3>Bullet rewrites</h3>
              {r.ai.rewrites.map((w) => (
                <div className="rewrite" key={w.original}><p className="was">{w.original}</p><p className="now">{w.improved}</p></div>
              ))}
            </>
          )}
          {r.ai.skill_advice && (<><h3>Closing skill gaps</h3><p>{r.ai.skill_advice}</p></>)}
        </section>
      )}
      {r.ai?.error && <p className="note">AI suggestions unavailable: {r.ai.error}</p>}
      {!r.ai && <p className="note">AI suggestions are off. Add GEMINI_API_KEY to server/.env to enable them.</p>}

      <section className="panel">
        <h2>Resume structure checks</h2>
        <ul className="checks">
          {Object.entries(r.checks).map(([name, ok]) => (
            <li key={name} className={ok ? "ok" : "no"}>{ok ? "✓" : "✗"} {name}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
