# Deploying this to Vercel

There are two ways to get this running on Vercel, depending on what you
want out of it.

## Option A — everything on Vercel (recommended)

This folder now includes `api/` — a set of Vercel serverless functions
(Node.js) that implement the *exact same REST API* as the Java backend
(`/api/students`, `/api/faculty`, `/api/attendance`, `/api/courses`,
`/api/dashboard`). Deploy this one folder and you get frontend *and*
backend from a single Vercel project — no second host, no `config.js`
edit needed (it already defaults to same-origin, which now works here
too).

Data is stored in Redis rather than files, because serverless functions
have no persistent disk. Steps:

1. Import this project into Vercel (Root Directory = this folder, i.e.
   wherever `index.html`, `app.html`, `api/`, and `package.json` live
   together). Vercel auto-detects the `api/` functions — no build step
   needed for the static files.
2. Deploy once (it'll go live, but API calls will 500 until step 3).
3. In the Vercel dashboard: **Storage → Connect Database → Redis**
   (Marketplace, Upstash-backed — the free tier is enough for this).
   Connect it to this project.
4. Redeploy (env vars from step 3 only apply to the next deployment —
   the "Redeploy" button on the latest deployment is enough, no code
   change needed).
5. Open the site, go to `app.html`, and check the status dot in the
   sidebar — "Connected to API" means it's fully live.

That's the whole thing. Sample students/faculty are seeded into Redis
automatically on first request.

## Option B — frontend on Vercel, Java backend elsewhere

If you'd rather the *Java* backend be the one actually running (e.g. to
point at it as the "real" implementation for a resume/demo), skip the
`api/` functions entirely and host them separately instead:

1. Deploy `backend/` (from the full project) to Render, Railway, or any
   host that runs an arbitrary process:
   - Build command: `javac -d out $(find src -name "*.java")`
   - Start command: `java -cp out com.campus.Main $PORT`
2. Copy the URL it gives you, e.g. `https://scholaris-api.onrender.com`.
3. Edit `assets/config.js`:
   ```js
   window.SCHOLARIS_API_BASE = "https://scholaris-api.onrender.com/api";
   ```
4. Deploy this folder to Vercel as before (Root Directory set correctly).
   The `api/` functions can stay in the repo unused, or be deleted —
   either is fine, since `config.js` overriding the same-origin default
   means they're never called.

Both options serve the identical frontend and the identical API
contract — `app.js` doesn't change between them.
