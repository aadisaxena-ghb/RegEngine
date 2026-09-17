<div align="center">

# 🏛️ RegEngine
### **Modern Campus Registration & Student Lifecycle Management System**

[![Java](https://img.shields.io/badge/Java-17%20%7C%2021%20%7C%2025-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Dependency--Free%20Micro--Kernel-10B981?style=for-the-badge)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-3B82F6?style=for-the-badge)](https://github.com)
[![UI/UX](https://img.shields.io/badge/Design-Collegiate%20Glassmorphic%20Console-F59E0B?style=for-the-badge)](https://github.com)

**RegEngine** is a complete, friendly, and lightning-fast Campus Registration & Student Lifecycle Management System built for universities, colleges, and polytechnics. Built with a **pure Java micro-kernel (zero external dependencies or frameworks)** and a **modern, college-friendly web interface** featuring a 5-step detailed registration wizard, clean empty database for user inputs, 3D holographic digital ID badges, live attendance terminal, faculty directory, and comprehensive student academic dossiers.

[Explore Features](#-key-features) • [Quick Start](#-quick-start-in-60-seconds) • [Architecture](#-architecture) • [REST API](#-rest-api-reference)

---

</div>

## ✨ Key Features

### 💎 Cinematic Showcase Landing Page (`/index.html`)
- **Ambient Canvas Particles & Glowing Meshes**: Immersive visual atmosphere with smooth 60fps animations.
- **Interactive 3D Holographic ID Card Preview**: Real-time mouse parallax tilt effect with iridescent holographic highlights and scannable QR code.
- **Virtual Interactive Sandbox**: Test cohort attendance marking, stream seat occupancy, and latency benchmarks right on the landing page.
- **Live API Playground**: Interactive cURL, Java, and JavaScript request explorer with syntax highlighting and 1-click copy.
- **Dual Theme & Audio Synthesizer**: Seamless toggle between Dark Mode and Light Mode with subtle synthesized Web Audio UI sound effects.

### 🏛️ Executive Registrar Console (`/app.html`)
- **Global Command Palette (`Ctrl+K` / `⌘K`)**: Spotlight search across students, faculty, courses, views, and instant actions with full keyboard navigation.
- **Executive Telemetry Dashboard**: Live KPI metric cards with animated roll-ups, stream distribution progress bars, and real-time activity audit stream.
- **Enrolment Studio**:
  - Live real-time student ID preview that updates dynamically as you type.
  - Automatic roll number validation & seat capacity quota checks.
  - *"✨ Magic Autofill Demo Data"* button for instant 1-click test registrations.
  - Multi-colored confetti celebration burst upon admission.
- **Student Records & Dossier Explorer**:
  - Multi-attribute search (name, roll number, phone).
  - Stream and attendance standing filters (Safe $\ge 75\%$, Defaulters $< 75\%$).
  - Batch actions: Multi-row selection, Batch CSV Export, and Batch Delete.
  - Individual actions: **3D Holographic ID Badge generator** with printable mode and comprehensive academic dossiers.
- **Smart Attendance Suite**:
  - 1-tap cohort attendance check-in by programme and date.
  - Quick bulk toggles (*"All Present"*, *"All Absent"*, *"Invert"*).
  - **Defaulters Watchlist & Notice Generator**: Automatically highlights students below statutory 75% threshold with a 1-click *"📢 Draft Formal Warning Notice"* ready to copy or print.
- **Faculty Directory & Workload Manager**:
  - Professorship designations, departments, subjects taught, and experience metrics.
  - Slide-over modal to register new faculty members.
- **Programmes & Capacity Studio**:
  - Visual seat occupancy progress rings and assigned teaching staff matrices.
- **Institutional Data Center & Backups**:
  - 1-click CSV exports for Students, Attendance, and Faculty.
  - Full institutional raw JSON backups.

---

## ⚡ Quick Start in 60 Seconds

### Prerequisites
- Any Java Development Kit (**JDK 17, 21, or 25+**) on your system PATH.
- No Maven, no Gradle, no NPM, no external database needed!

### Running with Java (Local Machine / VPS / Server)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/RegEngine.git
cd RegEngine/scholaris/backend

# 2. Compile with pure javac (no build tool needed)
# Windows (PowerShell):
javac -d out (Get-ChildItem -Path src -Recurse -Filter *.java | ForEach-Object { $_.FullName })

# Linux / macOS:
javac -d out $(find src -name "*.java")

# 3. Start the server (default port 8080)
java -cp out com.campus.Main 8080
```

Open your browser:
- **Showcase Landing Site**: [http://localhost:8080/](http://localhost:8080/)
- **Registrar Console App**: [http://localhost:8080/app.html](http://localhost:8080/app.html)
- **API Telemetry Endpoint**: [http://localhost:8080/api/dashboard](http://localhost:8080/api/dashboard)

---

## 📁 Repository Structure

```
RegEngine/
├── .gitignore
├── README.md                          Main project documentation
└── scholaris/
    ├── README.md
    ├── backend/                       Pure Java implementation (JDK Standard)
    │   ├── src/com/campus/
    │   │   ├── Main.java              Server entry point — starts HttpServer
    │   │   ├── model/                 Student, Faculty, AttendanceSession, Course, ActivityEntry
    │   │   ├── store/                 FileStore<T> thread-safe JSON repository + AppData wiring
    │   │   ├── http/                  HttpHandlers (Students, Faculty, Attendance, Courses, Dashboard, Static)
    │   │   └── util/Json.java         Zero-dependency JSON parser & serializer
    │   └── data/                      Persistent JSON database files (auto-seeded)
    └── frontend/
        ├── index.html                 Cinematic showcase landing page with 3D sandbox
        ├── app.html                   Executive registrar console application
        ├── assets/
        │   ├── styles.css             Luxury design system tokens, themes, glassmorphism
        │   ├── app.js                 Console application state engine, Command Palette, SFX
        │   ├── qrcode.min.js          Zero-dependency cryptographic QR code engine
        │   └── config.js              Backend API origin configuration
        └── api/                       (Optional) Vercel serverless functions
```

---

## 🔌 REST API Reference

All endpoints return and accept standard `application/json` payloads:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated institutional telemetry, stream breakdown, and activity log |
| `GET` | `/api/students` | List all enrolled student records |
| `POST` | `/api/students` | Enrol a new student with roll number uniqueness and seat quota validation |
| `DELETE`| `/api/students/{id}` | Remove a student record from the register |
| `GET` | `/api/attendance` | List all cohort attendance sessions |
| `POST` | `/api/attendance` | Record or update daily attendance session by programme and date |
| `GET` | `/api/faculty` | List all teaching faculty members |
| `POST` | `/api/faculty` | Register a new faculty professor |
| `DELETE`| `/api/faculty/{id}` | Remove a faculty member from staff directory |
| `GET` | `/api/courses` | Programme catalog with computed seat occupancies and assigned staff |

---

## 🚀 Pushing to GitHub

To publish this project to your GitHub account:

```bash
# 1. Initialize Git repository
git init
git add .
git commit -m "feat: initial release of Scholaris enterprise registrar platform"

# 2. Add your GitHub remote
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 3. Rename branch and push
git branch -M main
git push -u origin main
```

---

## 📜 License
Built as an enterprise-grade academic registrar platform demonstration. Open source under the MIT License.
