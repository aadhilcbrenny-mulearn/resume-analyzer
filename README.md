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
   cp .env.example .env      # keep the local API URL unless the server uses another port
   npm install
   npm run dev               # http://localhost:5173  (proxies /api to :5000)
   ```

## Deploying to Render and Vercel

Deploy the `server` directory as a Render Web Service and the `client` directory as a Vercel project. Configure environment variables in each platform's dashboard; do not commit `.env` files or secrets.

### Render server variables

Set these variables on the Render service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The external connection string for your hosted PostgreSQL database |
| `CLIENT_ORIGIN` | The exact Vercel URL, for example `https://resume-check.vercel.app` |
| `GEMINI_API_KEY` | Your Gemini API key (optional) |
| `GEMINI_MODEL` | A model available to your Gemini account, for example `gemini-2.5-flash` |
| `PORT` | Usually omitted; Render provides this automatically |

Use `npm install` as the build command and `npm start` as the start command. The server health-check URL is `/api/health`.

### Vercel client variable

Set this variable for the Vercel project and redeploy after changing it:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | The public Render URL, for example `https://resume-check-api.onrender.com` |

`VITE_*` variables are embedded into the browser bundle, so only use them for public values such as the API URL. Never put database passwords or Gemini keys in the client environment.

The client uses the Vite proxy only during local development. In the Vercel build, `VITE_API_URL` makes requests directly to the Render API, while `CLIENT_ORIGIN` allows that Vercel origin through CORS.

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
