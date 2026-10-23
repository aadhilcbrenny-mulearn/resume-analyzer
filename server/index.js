require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse/lib/pdf-parse.js"); // avoids pdf-parse's debug-mode bug on index.js
const { pool, init } = require("./db");
const { analyze } = require("./analyzer");
const { getAiFeedback } = require("./llm");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json());

// PDF stays in memory only; nothing is written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const fail = (res, status, error) => res.status(status).json({ error });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    const jd = (req.body.jobDescription || "").trim();
    const title = (req.body.jobTitle || "").trim() || "Untitled role";

    if (!file) return fail(res, 400, "Choose a PDF resume to upload.");
    if (file.mimetype !== "application/pdf") return fail(res, 400, "Only PDF files are supported.");
    if (jd.split(/\s+/).filter(Boolean).length < 20) return fail(res, 400, "Paste the full job description (at least 20 words).");

    let text;
    try {
      text = (await pdfParse(file.buffer)).text.trim();
    } catch {
      return fail(res, 400, "That PDF could not be read. Try exporting it again from your editor.");
    }
    if (text.split(/\s+/).filter(Boolean).length < 50) {
      return fail(res, 400, "No readable text found. Scanned or image-only PDFs aren't supported.");
    }

    const result = analyze(text, jd);
    result.ai = await getAiFeedback(text, jd, result); // null if no key, { error } on failure
    const { rows } = await pool.query(
      "INSERT INTO analyses (filename, job_title, score, details) VALUES ($1,$2,$3,$4) RETURNING id",
      [file.originalname, title, result.score, result]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    console.error(err);
    fail(res, 500, "Something went wrong on the server.");
  }
});

app.get("/api/analyses", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, filename, job_title, score, created_at FROM analyses ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    fail(res, 500, "Could not load history.");
  }
});

app.get("/api/analyses/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM analyses WHERE id = $1", [req.params.id]);
    if (!rows.length) return fail(res, 404, "That analysis doesn't exist.");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    fail(res, 500, "Could not load the analysis.");
  }
});

app.delete("/api/analyses/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM analyses WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    fail(res, 500, "Could not delete the analysis.");
  }
});

// multer errors (file too large, etc.)
app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") return fail(res, 400, "File is larger than 5 MB.");
  console.error(err);
  fail(res, 500, "Something went wrong on the server.");
});

const port = process.env.PORT || 5000;
init()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((e) => { console.error("Database setup failed:", e.message); process.exit(1); });
