# ResumeCheck – AI Resume Analyzer (PERN)

PostgreSQL + Express + React (Vite) + Node. Scores a PDF resume against a job description.

## Setup
1. Create a database:  `createdb resume_analyzer`
2. Server:
   ```
   cd server
   cp .env.example .env      # edit DATABASE_URL
   npm install
   npm run dev               # http://localhost:5000  (table is created automatically)
   ```
3. Client (new terminal):
   ```
   cd client
   npm install
   npm run dev               # http://localhost:5173  (proxies /api to :5000)
   ```

## API
- `POST /api/analyze`  multipart: `resume` (PDF), `jobTitle`, `jobDescription` → `{ id }`
- `GET /api/analyses` · `GET /api/analyses/:id` · `DELETE /api/analyses/:id`

## Score (out of 100)
40% skills match · 25% keyword match · 15% text similarity (cosine) · 20% resume structure.
Edit the `SKILLS` object in `server/analyzer.js` to add skills.

## AI suggestions (Gemini)
1. Get a free key at https://aistudio.google.com (Get API key).
2. Paste it into `server/.env` as `GEMINI_API_KEY` and restart the server.
3. Without a key the app still works and just skips the AI section.
Email, phone and links are removed from the resume text before it is sent. Names are not.
If the model name errors, set `GEMINI_MODEL` to a Flash model listed in AI Studio.
