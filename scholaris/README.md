# Scholaris — Student Information System

A full-stack student/faculty/attendance registrar system, with **two
interchangeable backends implementing the same REST API**:

- a **Java** backend (no frameworks, no external libraries — just the
  JDK), for running locally or hosting on anything that runs an
  arbitrary process (Render, Railway, a VPS)
- a **Node.js serverless** backend (Vercel Functions + Redis), for
  deploying the whole project — frontend and backend together — as one
  Vercel project

The frontend (`app.js`) doesn't know or care which one it's talking to
— both expose the identical routes and JSON shapes.

```
scholaris/
├── backend/                       the Java implementation
│   └── src/com/campus/
│       ├── Main.java              entry point — starts the HTTP server
│       ├── model/                 Student, Faculty, AttendanceSession, Course, ActivityEntry
│       ├── store/                 FileStore<T> generic JSON-file repository + AppData wiring
│       ├── http/                  one HttpHandler per REST resource
│       └── util/Json.java         hand-written JSON reader/writer
└── frontend/
    ├── index.html                 marketing / product site
    ├── app.html                   the registrar console (talks to the API)
    ├── api/                       the Node.js implementation (Vercel serverless functions)
    │   ├── students/, faculty/, attendance/    one handler per resource
    │   ├── courses.js, dashboard.js
    │   └── _lib/                  shared Redis-backed store + course catalog
    ├── package.json                declares @upstash/redis for api/
    ├── vercel.json
    └── assets/
        ├── styles.css             shared design tokens
        ├── config.js              sets the API base URL (see below)
        └── app.js                 console logic — all fetch() calls to /api/*
```

## Running it locally (Java)

You need a JDK (17+) on your PATH — nothing else.

```bash
cd backend
javac -d out $(find src -name "*.java")
java -cp out com.campus.Main 8080
```

Then open **http://localhost:8080/** — the Java process serves the
marketing site, the console (`/app.html`), and the API (`/api/*`) all
from one process. Sample data is seeded automatically and written to
`backend/data/*.json`; delete that folder to reset it.

## Deploying it

**Easiest: everything on Vercel.** Import `frontend/` as the project
root, then connect a Redis database (Storage → Connect Database →
Redis, Marketplace/Upstash-backed) and redeploy. `frontend/DEPLOY.md`
has the full walkthrough — this uses the `api/` folder above instead of
the Java backend, since Vercel has no Java runtime.

**Alternative: keep the Java backend live**, e.g. to point at it as the
reference implementation. Deploy `backend/` to Render (or similar) and
set `frontend/assets/config.js`'s `SCHOLARIS_API_BASE` to that URL,
then deploy `frontend/` to Vercel as before. Also covered in
`frontend/DEPLOY.md`.

Either way, `config.js` defaults to `null` (same-origin), which is what
makes local development and the all-in-Vercel option both work with no
edits — it only needs changing for the split-hosting alternative.

## API

Implemented identically by `backend/` (Java) and `frontend/api/`
(Node):

| Method | Path                  | Notes                                      |
|--------|-----------------------|---------------------------------------------|
| GET    | `/api/students`       | list all students                          |
| POST   | `/api/students`       | create — validates roll uniqueness & seats |
| DELETE | `/api/students/{id}`  | remove a student                           |
| GET    | `/api/faculty`        | list all faculty                           |
| POST   | `/api/faculty`        | create                                     |
| DELETE | `/api/faculty/{id}`   | remove a faculty member                    |
| GET    | `/api/attendance`     | list all attendance sessions               |
| POST   | `/api/attendance`     | upsert a session by course + date          |
| GET    | `/api/courses`        | programmes with computed enrolment/staffing|
| GET    | `/api/dashboard`      | aggregated stats + activity feed           |

## Design notes

- **Java persistence** is a generic `FileStore<T>` that mirrors an
  in-memory list to a JSON file after every mutation — fine for a
  single-instance deployment where the process owns its own disk.
- **Node persistence** uses Redis instead, because serverless functions
  have no persistent disk between invocations — `api/_lib/store.js` is
  the equivalent of `FileStore<T>` for that environment.
- **JSON** in the Java backend is hand-rolled (`util/Json.java`) rather
  than pulling in Gson or Jackson, so it compiles with nothing but
  `javac`. The Node backend's request bodies are parsed automatically
  by the Vercel runtime.
- **Frontend** is plain HTML/CSS/JS (no build step) calling the API
  with `fetch`. `index.html` is the public-facing site; `app.html` is
  the authenticated-in-spirit console.
