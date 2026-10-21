// NLP + scoring logic (plain JavaScript, no model downloads)
const STOPWORDS = new Set(`a about above after again all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her here
hers him his how i if in into is it its just me more most my no nor not of off on once only or other our out over own
same she should so some such than that the their them then there these they this those through to too under until up
very was we were what when where which while who whom why will with would you your yours experience work working
ability strong knowledge team role looking required requirements preferred responsibilities including etc must
candidate years year plus using use used new good great well able need needs join company job`.split(/\s+/));

// canonical skill -> aliases
const SKILLS = {
  python: [], java: [], javascript: ["js"], typescript: [], "c++": [], "c#": [], go: ["golang"], ruby: [], php: [],
  swift: [], kotlin: [], rust: [], r: [], sql: [], bash: ["shell scripting"], html: ["html5"], css: ["css3"],
  react: ["react.js", "reactjs"], angular: [], vue: ["vue.js"], "node.js": ["nodejs", "node"], express: ["express.js"],
  flask: [], django: [], fastapi: [], "spring boot": ["spring"], "rest api": ["rest", "restful", "restful api", "rest apis"],
  graphql: [], mysql: [], postgresql: ["postgres"], sqlite: [], mongodb: [], redis: [], nosql: [],
  aws: ["amazon web services"], azure: [], gcp: ["google cloud"], docker: [], kubernetes: ["k8s"], terraform: [],
  jenkins: [], "ci/cd": ["cicd", "ci cd"], git: ["github", "gitlab"], linux: [], "machine learning": ["ml"],
  "deep learning": [], nlp: ["natural language processing"], "computer vision": [], tensorflow: [], pytorch: [],
  "scikit-learn": ["sklearn"], pandas: [], numpy: [], "data analysis": ["data analytics"], "data visualization": [],
  tableau: [], "power bi": [], excel: [], statistics: [], spark: ["pyspark"], hadoop: [], etl: [], "data structures": [],
  algorithms: [], "object-oriented programming": ["oop", "object oriented"], microservices: [],
  "unit testing": ["pytest", "junit", "jest", "unit tests"], agile: ["scrum"], jira: [], figma: [], communication: [],
  leadership: [], "problem solving": ["problem-solving"], teamwork: ["collaboration"], "project management": [],
  cybersecurity: ["information security"], networking: [],
};

const SECTIONS = {
  experience: /\b(experience|employment|work history|internship)/,
  education: /\b(education|academic|university|bachelor|master|b\.?tech|m\.?tech|degree)/,
  skills: /\b(skills|technologies|technical skills|tech stack)/,
  projects: /\b(projects?|portfolio)/,
  summary: /\b(summary|objective|profile|about me)/,
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokenize = (text) => (text.toLowerCase().match(/[a-z][a-z0-9+#.\-]*/g) || []).filter((t) => t.length > 1);

function keywords(text, top = 25) {
  const counts = new Map();
  for (const raw of tokenize(text)) {
    const w = raw.replace(/^[.\-]+|[.\-]+$/g, "");
    if (w.length > 2 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([w]) => w);
}

const hasTerm = (low, term) => new RegExp(`(?<![a-z0-9+#])${escapeRe(term)}(?![a-z0-9+#])`).test(low);

function findSkills(text) {
  const low = text.toLowerCase().replace(/\s+/g, " "); // PDF line wraps can split multi-word skills
  return new Set(Object.entries(SKILLS).filter(([s, al]) => [s, ...al].some((t) => hasTerm(low, t))).map(([s]) => s));
}

function cosine(a, b) {
  const count = (arr) => arr.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map());
  const ca = count(a), cb = count(b);
  let dot = 0, na = 0, nb = 0;
  for (const [t, v] of ca) { dot += v * (cb.get(t) || 0); na += v * v; }
  for (const v of cb.values()) nb += v * v;
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

function formatChecks(text) {
  const low = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const checks = {
    "Email address": /[\w.+-]+@[\w-]+\.[\w.]+/.test(text),
    "Phone number": /(\+?\d[\d\s\-().]{8,}\d)/.test(text),
    "Length of 300–1000 words": words >= 300 && words <= 1000,
    "Bullet points used": /[•▪●◦\-*]\s/.test(text),
    "Numbers / measurable results": (text.match(/\b\d+%?/g) || []).length >= 5,
  };
  for (const [name, re] of Object.entries(SECTIONS)) {
    checks[`${name[0].toUpperCase()}${name.slice(1)} section`] = re.test(low);
  }
  return { checks, words };
}

function analyze(resumeText, jdText) {
  const rTokens = tokenize(resumeText).filter((t) => !STOPWORDS.has(t));
  const jTokens = tokenize(jdText).filter((t) => !STOPWORDS.has(t));

  const rSkills = findSkills(resumeText), jSkills = findSkills(jdText);
  const matchedSkills = [...jSkills].filter((s) => rSkills.has(s)).sort();
  const missingSkills = [...jSkills].filter((s) => !rSkills.has(s)).sort();
  const extraSkills = [...rSkills].filter((s) => !jSkills.has(s)).sort();
  const skillScore = jSkills.size ? matchedSkills.length / jSkills.size : null;

  const jdKw = keywords(jdText);
  const rSet = new Set(rTokens);
  const matchedKw = jdKw.filter((k) => rSet.has(k));
  const missingKw = jdKw.filter((k) => !rSet.has(k) && !missingSkills.includes(k));
  const kwScore = jdKw.length ? matchedKw.length / jdKw.length : 0;

  const simScore = Math.min(1, cosine(rTokens, jTokens) * 2.2); // raw cosine on short docs is low; rescale
  const { checks, words } = formatChecks(resumeText);
  const fmtScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

  // weights: skills 40, keywords 25, similarity 15, structure 20 (re-weighted if JD lists no known skills)
  const total = skillScore === null
    ? 0.55 * kwScore + 0.2 * simScore + 0.25 * fmtScore
    : 0.4 * skillScore + 0.25 * kwScore + 0.15 * simScore + 0.2 * fmtScore;
  const score = Math.round(total * 100);

  const tips = [];
  if (missingSkills.length) tips.push(`Add these skills if you genuinely have them: ${missingSkills.slice(0, 8).join(", ")}.`);
  if (missingKw.length) tips.push(`Work these job-description terms into your bullet points: ${missingKw.slice(0, 8).join(", ")}.`);
  for (const [name, ok] of Object.entries(checks)) if (!ok) tips.push(`Missing or weak: ${name}.`);
  if (score >= 75 && !tips.length) tips.push("Strong match. Tailor your summary line to the job title and you're set.");

  const pct = (x) => Math.round(x * 100);
  return {
    score,
    label: score >= 75 ? "Strong match" : score >= 50 ? "Fair match" : "Weak match",
    breakdown: {
      "Skills match": pct(skillScore ?? kwScore),
      "Keyword match": pct(kwScore),
      "Text similarity": pct(simScore),
      "Resume structure": pct(fmtScore),
    },
    matchedSkills, missingSkills, extraSkills, matchedKeywords: matchedKw, missingKeywords: missingKw,
    checks, wordCount: words, tips,
  };
}

module.exports = { analyze };
