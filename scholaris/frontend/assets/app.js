/**
 * RegEngine — Campus Registration & Student Information System
 * Comprehensive frontend application controller with multi-page registration wizard,
 * paginated student dossiers, cryptographic ID badges, attendance monitor, and exports.
 */
(function(){
  "use strict";

  var API = window.SCHOLARIS_API_BASE || "/api";

  /* ================= Academic Disciplines Catalog (SRMIST Delhi-NCR Ghaziabad) ================= */
  var COURSES = [
    { code: "CSE-CORE",  name: "B.Tech Computer Science & Engineering (Core)", capacity: 180, dept: "Computer Science & Engineering" },
    { code: "CSE-AIML",  name: "B.Tech CSE (AI & Machine Learning)", capacity: 120, dept: "Computer Science & Engineering" },
    { code: "CSE-DS",    name: "B.Tech CSE (Data Science)", capacity: 60, dept: "Computer Science & Engineering" },
    { code: "CSE-CYBER", name: "B.Tech CSE (Cyber Security)", capacity: 60, dept: "Computer Science & Engineering" },
    { code: "CSE-CLOUD", name: "B.Tech CSE (Cloud Computing)", capacity: 60, dept: "Computer Science & Engineering" },
    { code: "ECE",       name: "B.Tech Electronics & Communication Engineering", capacity: 60, dept: "Electronics & Communication" },
    { code: "ECE-VLSI",  name: "B.Tech Electronics (VLSI Design & Technology)", capacity: 60, dept: "Electronics & Communication" },
    { code: "MECH",      name: "B.Tech Mechanical Engineering", capacity: 60, dept: "Mechanical & Automobile Engineering" },
    { code: "AUTO",      name: "B.Tech Automobile Engineering", capacity: 60, dept: "Mechanical & Automobile Engineering" },
    { code: "BCA",       name: "Bachelor of Computer Applications (BCA)", capacity: 60, dept: "Computer Applications" },
    { code: "BCA-DS",    name: "BCA (Data Science)", capacity: 60, dept: "Computer Applications" },
    { code: "MCA",       name: "Master of Computer Applications (MCA)", capacity: 60, dept: "Computer Applications" },
    { code: "MCA-AI",    name: "MCA (Generative AI)", capacity: 60, dept: "Computer Applications" },
    { code: "BBA",       name: "Bachelor of Business Administration (BBA)", capacity: 60, dept: "Management Studies" },
    { code: "MBA",       name: "Master of Business Administration (MBA)", capacity: 60, dept: "Management Studies" }
  ];

  function courseByCode(c) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].code === c) return COURSES[i];
    }
    return { code: c, name: c, capacity: 60, dept: "Academic Department" };
  }

  /* ================= Application State ================= */
  var state = {
    students: [],
    faculty: [],
    attendance: [],
    courses: [],
    dashboard: null,
    notices: [],
    calendar: [],
    timetable: [],
    curriculum: [],
    activeTimetableDay: "Monday",
    activeTimetableCourse: "CSE-CORE",
    activeCalendarFilter: "all",
    activeNoticeFilter: "all",
    activeSyllabusCourse: "CSE-CORE",
    portalMode: "student", // "student" or "management"
    authFaculty: (function(){
      try {
        var raw = localStorage.getItem("regengine_auth_faculty");
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    })(),
    pagination: {
      page: 1,
      pageSize: 8
    }
  };

  /* ================= Web Audio SFX Engine ================= */
  var audioCtx = null;
  var soundEnabled = localStorage.getItem("regengine_sfx") !== "false";

  function playTone(freq, type, duration) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  function playSuccessChime() {
    playTone(523.25, "sine", 0.1);
    setTimeout(function(){ playTone(659.25, "sine", 0.1); }, 100);
    setTimeout(function(){ playTone(783.99, "sine", 0.2); }, 200);
  }

  function playAlertTone() {
    playTone(350, "triangle", 0.12);
    setTimeout(function(){ playTone(280, "triangle", 0.18); }, 120);
  }

  var appSoundBtn = document.getElementById("app-sound-btn");
  if (appSoundBtn) {
    function updateAppSoundBtn() {
      appSoundBtn.querySelector(".audio-bars").classList.toggle("playing", soundEnabled);
      appSoundBtn.style.opacity = soundEnabled ? "1" : "0.6";
    }
    updateAppSoundBtn();
    appSoundBtn.addEventListener("click", function(){
      soundEnabled = !soundEnabled;
      localStorage.setItem("regengine_sfx", soundEnabled ? "true" : "false");
      updateAppSoundBtn();
      if (soundEnabled) playSuccessChime();
    });
  }

  /* ================= API Client ================= */
  function api(path, opts) {
    opts = opts || {};
    var start = performance.now();
    return fetch(API + path, opts).then(function(res){
      var duration = Math.round(performance.now() - start);
      var latencyTag = document.getElementById("latency-tag");
      if (latencyTag) latencyTag.textContent = duration + "ms";

      return res.text().then(function(raw){
        var body;
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch(err) {
          throw new Error("Server returned non-JSON: " + raw.slice(0, 80));
        }
        if (!res.ok) {
          var e = new Error(body.error || "HTTP " + res.status + " error");
          e.status = res.status;
          throw e;
        }
        return body;
      });
    });
  }

  function apiGet(path) { return api(path); }
  function apiPost(path, data) {
    return api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }
  function apiDelete(path) { return api(path, { method: "DELETE" }); }

  function refreshAll() {
    return Promise.all([
      apiGet("/students"),
      apiGet("/faculty"),
      apiGet("/attendance"),
      apiGet("/courses"),
      apiGet("/dashboard"),
      apiGet("/notices"),
      apiGet("/calendar"),
      apiGet("/timetable"),
      apiGet("/curriculum")
    ]).then(function(results){
      state.students = results[0] || [];
      state.faculty = results[1] || [];
      state.attendance = results[2] || [];
      state.courses = results[3] || [];
      state.dashboard = results[4] || null;
      state.notices = results[5] || [];
      state.calendar = results[6] || [];
      state.timetable = results[7] || [];
      state.curriculum = results[8] || [];

      updateBadges();
      return state;
    }).catch(function(e){
      showToast("API Unreachable: " + e.message, "error");
      throw e;
    });
  }

  function updateBadges() {
    var stuBadge = document.getElementById("nav-badge-students");
    var facBadge = document.getElementById("nav-badge-faculty");
    if (stuBadge) stuBadge.textContent = state.students.length;
    if (facBadge) facBadge.textContent = state.faculty.length;
  }

  /* ================= Confetti Particle Burst ================= */
  function triggerConfetti() {
    var canvas = document.getElementById("confetti-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    var pieces = [];
    var colors = ["#1E3A8A", "#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6"];

    for (var i = 0; i < 90; i++) {
      pieces.push({
        x: w / 2,
        y: h / 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 8 + 4,
        dx: (Math.random() - 0.5) * 16,
        dy: (Math.random() - 0.7) * 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        dr: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    var frame = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, w, h);
      var active = false;
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.35; // gravity
        p.rotation += p.dr;
        p.opacity -= 0.012;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      if (active && frame < 120) {
        frame++;
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }
    renderConfetti();
  }

  /* ================= Toast Notification System ================= */
  function showToast(msg, kind) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var el = document.createElement("div");
    el.className = "toast " + (kind === "error" ? "error" : "success");
    
    var iconSvg = kind === "error" 
      ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

    el.innerHTML = iconSvg + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);

    if (kind === "error") playAlertTone();
    else playSuccessChime();

    setTimeout(function(){
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(10px) scale(0.95)";
      setTimeout(function(){ el.remove(); }, 300);
    }, 3200);
  }

  function closeModal() {
    var root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";
  }

  function openConfirm(title, msg, onConfirm) {
    var root = document.getElementById("modal-root");
    root.innerHTML =
      '<div class="modal-overlay" id="confirm-overlay">' +
        '<div class="modal-window" style="max-width:440px;">' +
          '<div class="modal-header">' +
            '<h3>' + esc(title) + '</h3>' +
            '<button class="modal-close" id="confirm-close-btn">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p style="color:var(--text-secondary); font-size:14px; line-height:1.6;">' + esc(msg) + '</p>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="confirm-cancel">Cancel</button>' +
            '<button class="btn btn-danger" id="confirm-ok">Confirm Removal</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector("#confirm-close-btn").addEventListener("click", closeModal);
    root.querySelector("#confirm-cancel").addEventListener("click", closeModal);
    root.querySelector("#confirm-overlay").addEventListener("click", function(e){
      if (e.target.id === "confirm-overlay") closeModal();
    });
    root.querySelector("#confirm-ok").addEventListener("click", function(){
      closeModal();
      onConfirm();
    });
  }

  function initials(name) {
    var parts = (name || "").trim().split(/\s+/);
    return ((parts[0] || "")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase() || "ST";
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function(c){
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function attendanceStats(rollNumber) {
    var present = 0, total = 0;
    state.attendance.forEach(function(session){
      (session.records || []).forEach(function(r){
        if (r.rollNumber === rollNumber) {
          total++;
          if (r.present) present++;
        }
      });
    });
    return {
      present: present,
      total: total,
      pct: total ? Math.round((present / total) * 100) : null
    };
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    var t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return sameDay ? "Today at " + t : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + t;
  }

  /* ================= 3D Holographic ID Card Modal ================= */
  function openIdCardModal(student) {
    var root = document.getElementById("modal-root");
    var course = courseByCode(student.course);
    var att = attendanceStats(student.rollNumber);
    var attText = att.pct !== null ? att.pct + "% ATTENDANCE" : "NEW ADMIT";

    root.innerHTML =
      '<div class="modal-overlay" id="idcard-modal-overlay">' +
        '<div class="modal-window" style="max-width:480px; background:#FFFFFF;">' +
          '<div class="modal-header">' +
            '<h3>RegEngine Verified Student ID Badge</h3>' +
            '<button class="modal-close" id="idcard-modal-close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="idcard-perspective-wrap" id="modal-card-wrap">' +
              '<div class="idcard-3d" id="modal-holo-card" style="background:linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%);">' +
                '<div class="idcard-holo-sheen"></div>' +
                '<div class="idcard-top-stripe"></div>' +
                '<div class="idcard-head">' +
                  '<div class="idcard-inst-brand">' +
                    '<div class="idcard-seal">R</div>' +
                    '<div>' +
                      '<div class="idcard-inst-name">RegEngine Campus</div>' +
                      '<div class="idcard-inst-sub">Student Identity Card</div>' +
                    '</div>' +
                  '</div>' +
                  '<span class="badge badge-gold">VERIFIED</span>' +
                '</div>' +
                '<div class="idcard-body">' +
                  '<div class="idcard-profile-row">' +
                    '<div class="idcard-avatar" style="border-color:#F59E0B;">' + initials(student.name) + '</div>' +
                    '<div>' +
                      '<div class="idcard-name-title">' + esc(student.name) + '</div>' +
                      '<div class="idcard-roll-badge">' + esc(student.rollNumber) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="idcard-grid">' +
                    '<div class="idcard-grid-full"><div class="k">Branch & Section</div><div class="v">' + esc(course.name) + ' (' + esc(student.section || "Section A") + ')</div></div>' +
                    '<div><div class="k">Batch / Year</div><div class="v">' + esc(student.batchYear || "2026–2030") + '</div></div>' +
                    '<div><div class="k">Blood Group</div><div class="v">' + esc(student.bloodGroup || "O+") + '</div></div>' +
                    '<div class="idcard-grid-full"><div class="k">Emergency Contact</div><div class="v mono">' + esc(student.emergencyContact || student.phone || "—") + '</div></div>' +
                  '</div>' +
                  '<div class="idcard-qr-section">' +
                    '<div class="idcard-qr-box" id="modal-qr-mount"></div>' +
                    '<div class="idcard-meta-right">' +
                      '<div style="font-size:10px; color:#94A3B8;">ACADEMIC STANDING</div>' +
                      '<div class="idcard-att-badge">' + attText + '</div>' +
                      '<div class="idcard-sig">Registrar Office ✍️</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="print-id-btn">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
              '<span>Print Badge</span>' +
            '</button>' +
            '<button class="btn btn-primary" id="idcard-modal-close-btn">Done</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var qrMount = root.querySelector("#modal-qr-mount");
    if (qrMount && window.QRCode) {
      new window.QRCode(qrMount, {
        text: "https://regengine.campus.edu/verify/" + student.rollNumber,
        width: 64,
        height: 64,
        colorDark: "#090D14",
        colorLight: "#FFFFFF"
      });
    }

    var cardWrap = root.querySelector("#modal-card-wrap");
    var holoCard = root.querySelector("#modal-holo-card");
    if (cardWrap && holoCard) {
      cardWrap.addEventListener("mousemove", function(e){
        var rect = cardWrap.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        var rotX = (-y / (rect.height / 2)) * 14;
        var rotY = (x / (rect.width / 2)) * 14;
        holoCard.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) scale3d(1.02, 1.02, 1.02)";
      });
      cardWrap.addEventListener("mouseleave", function(){
        holoCard.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    }

    root.querySelector("#idcard-modal-close").addEventListener("click", closeModal);
    root.querySelector("#idcard-modal-close-btn").addEventListener("click", closeModal);
    root.querySelector("#idcard-modal-overlay").addEventListener("click", function(e){
      if (e.target.id === "idcard-modal-overlay") closeModal();
    });
    root.querySelector("#print-id-btn").addEventListener("click", function(){
      window.print();
    });
  }

  /* ================= Comprehensive Student Registration Dossier Modal ================= */
  function openDossierModal(student) {
    var root = document.getElementById("modal-root");
    var course = courseByCode(student.course);
    var att = attendanceStats(student.rollNumber);

    root.innerHTML =
      '<div class="modal-overlay" id="dossier-overlay">' +
        '<div class="modal-window" style="max-width:680px;">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h3>Official Student Registration Dossier</h3>' +
              '<div style="font-size:12px; color:var(--text-muted);">Enrollment Record · RegEngine Academic Registry</div>' +
            '</div>' +
            '<button class="modal-close" id="dossier-close">✕</button>' +
          '</div>' +
          '<div class="modal-body" style="max-height:75vh; overflow-y:auto;">' +
            '<div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">' +
              '<div style="width:64px; height:64px; border-radius:14px; background:linear-gradient(135deg, #1E3A8A, #0F172A); color:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800;">' + initials(student.name) + '</div>' +
              '<div>' +
                '<h2 style="font-size:20px; font-weight:800; color:#0F172A;">' + esc(student.name) + '</h2>' +
                '<div style="display:flex; gap:8px; margin-top:4px; flex-wrap:wrap;">' +
                  '<span class="badge badge-gold mono">' + esc(student.rollNumber) + '</span>' +
                  '<span class="badge course-' + student.course + '">' + esc(course.name) + '</span>' +
                  '<span class="badge" style="background:#EEF2FF; color:#4338CA; font-weight:700;">' + esc(student.section || 'Section A') + '</span>' +
                  '<span class="badge" style="background:#EFF6FF; color:#1E40AF;">Batch ' + esc(student.batchYear || '2026–2030') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<!-- Section 1 -->' +
            '<div style="margin-bottom:18px;">' +
              '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;">1. Personal & Demographic Details</h4>' +
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:10px;">' +
                '<div><span style="color:#64748B;">Gender:</span> <strong>' + esc(student.gender || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">Date of Birth:</span> <strong>' + esc(student.dob || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">Blood Group:</span> <strong>' + esc(student.bloodGroup || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">Category:</span> <strong>' + esc(student.category || 'General') + '</strong></div>' +
                '<div><span style="color:#64748B;">Aadhar / ID:</span> <strong class="mono">' + esc(student.aadharNumber || '—') + '</strong></div>' +
              '</div>' +
            '</div>' +

            '<!-- Section 2 -->' +
            '<div style="margin-bottom:18px;">' +
              '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;">2. Academic Merit & Admission Allotment</h4>' +
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:10px;">' +
                '<div><span style="color:#64748B;">Assigned Section:</span> <strong>' + esc(student.section || 'Section A') + '</strong></div>' +
                '<div><span style="color:#64748B;">Admission Type:</span> <strong>' + esc(student.admissionType || 'Merit Allotment') + '</strong></div>' +
                '<div><span style="color:#64748B;">10th Score:</span> <strong>' + (student.percentage10 ? student.percentage10 + "%" : '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">12th / Qualifying Score:</span> <strong>' + (student.percentage12 ? student.percentage12 + "%" : '—') + '</strong></div>' +
                '<div style="grid-column:span 2;"><span style="color:#64748B;">Previous Institution:</span> <strong>' + esc(student.previousSchool || '—') + '</strong></div>' +
              '</div>' +
            '</div>' +

            '<!-- Section 3 -->' +
            '<div style="margin-bottom:18px;">' +
              '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;">3. Parent & Guardian Particulars</h4>' +
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:10px;">' +
                '<div><span style="color:#64748B;">Father\'s Name:</span> <strong>' + esc(student.fatherName || '—') + (student.fatherOccupation ? ' (' + esc(student.fatherOccupation) + ')' : '') + '</strong></div>' +
                '<div><span style="color:#64748B;">Mother\'s Name:</span> <strong>' + esc(student.motherName || '—') + (student.motherOccupation ? ' (' + esc(student.motherOccupation) + ')' : '') + '</strong></div>' +
                '<div><span style="color:#64748B;">Guardian Mobile:</span> <strong class="mono">' + esc(student.guardianPhone || '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">Guardian Email:</span> <strong>' + esc(student.guardianEmail || '—') + '</strong></div>' +
              '</div>' +
            '</div>' +

            '<!-- Section 4 -->' +
            '<div style="margin-bottom:18px;">' +
              '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;">4. Contact & Residential Address</h4>' +
              '<div style="display:flex; flex-direction:column; gap:8px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:10px;">' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:#64748B;">Student Mobile:</span>' +
                  '<strong class="mono">' + esc(student.phone || '—') + '</strong>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:#64748B;">Student Email:</span>' +
                  '<strong>' + esc(student.email || '—') + '</strong>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:#64748B;">Emergency Contact:</span>' +
                  '<strong>' + esc(student.emergencyContact || '—') + '</strong>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between;">' +
                  '<span style="color:#64748B;">Permanent Address:</span>' +
                  '<strong style="text-align:right; max-width:320px;">' + esc(student.address || '—') + ', ' + esc(student.cityStatePin || '') + '</strong>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<!-- Section 5 -->' +
            '<div>' +
              '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:10px;">5. Campus Facilities & Attendance</h4>' +
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; background:#F8FAFC; padding:14px; border-radius:10px;">' +
                '<div><span style="color:#64748B;">Accommodation:</span> <strong>' + esc(student.accommodation || 'Day Scholar') + '</strong></div>' +
                '<div><span style="color:#64748B;">Transport:</span> <strong>' + esc(student.busRoute || 'Own Transport') + '</strong></div>' +
                '<div><span style="color:#64748B;">Attendance Standing:</span> <strong style="color:' + (att.pct < 75 ? '#DC2626' : '#10B981') + ';">' + (att.pct !== null ? att.pct + "%" : "New Admit") + '</strong></div>' +
                '<div><span style="color:#64748B;">Registration Date:</span> <strong class="mono">' + new Date(student.enrollDate).toLocaleDateString() + '</strong></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="dossier-print-btn">🖨️ Print Admission Slip</button>' +
            '<button class="btn btn-primary" id="dossier-idcard-btn">🪪 3D ID Badge</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector("#dossier-close").addEventListener("click", closeModal);
    root.querySelector("#dossier-overlay").addEventListener("click", function(e){
      if (e.target.id === "dossier-overlay") closeModal();
    });
    root.querySelector("#dossier-print-btn").addEventListener("click", function(){
      window.print();
    });
    root.querySelector("#dossier-idcard-btn").addEventListener("click", function(){
      closeModal();
      openIdCardModal(student);
    });
  }

  /* ================= Dual Portal & Navigation View Router ================= */
  var VIEW_META = {
    // Student Section Views
    "register":           { title: "Student Admission Registration", meta: "Comprehensive multi-page student admission and registration form", portal: "student" },
    "student-idcard":     { title: "Digital Student ID Badge", meta: "Live 3D holographic student identity badge and cryptographic QR verification", portal: "student" },
    "student-status":     { title: "Admission Dossier & Status", meta: "Official registration particulars, parent contacts, and branch allotment", portal: "student" },
    "timetable":          { title: "Weekly Class Timetable", meta: "Official lecture slots, room allocations, and faculty assignments", portal: "student" },
    "calendar":           { title: "Academic Calendar (2026–2027)", meta: "Examination dates, semester milestones, continuous assessments, and holidays", portal: "student" },
    "syllabus":           { title: "Course Curriculum & Syllabus", meta: "5-unit syllabus breakdown, L-T-P-C credits, and reference textbooks", portal: "student" },
    "notices":            { title: "Campus Notices & Circulars", meta: "Official authenticated notifications issued by the Registrar and Examination Cell", portal: "student" },
    "student-courses":    { title: "SRMIST Academic Catalog", meta: "All 15 undergraduate and postgraduate programmes, seat caps, and departments", portal: "student" },
    "student-attendance": { title: "Attendance Self-Check", meta: "Check personal attendance percentage against the mandatory 75% university rule", portal: "student" },
    "student-helpdesk":   { title: "Admissions Helpdesk & FAQs", meta: "Registrar contacts, campus helplines, and answers to common queries", portal: "student" },

    // College Management Exclusive Views
    "dashboard":  { title: "Executive Campus Dashboard", meta: "Branch intake capacity, enrolment metrics, and telemetry ledger", portal: "management" },
    "records":    { title: "Master Student Register", meta: "Official university register, search, branch filters, dossier reviews, and ID badges", portal: "management" },
    "attendance": { title: "Daily Attendance Marking", meta: "1-tap class roster check-in and 75% statutory attendance monitor", portal: "management" },
    "notice-mgr": { title: "Publish Official Circulars", meta: "Disseminate notices to the student portal and campus mobile feeds", portal: "management" },
    "faculty":    { title: "Faculty & Staff Directory", meta: "87 verified professors across 6 departments, subject allocations, and staff records", portal: "management" },
    "courses":    { title: "Branch Seat Quotas & Allocation", meta: "Intake capacity and remaining available seats per engineering stream", portal: "management" },
    "export":     { title: "Institutional Data & Audit Center", meta: "Download CSV rosters, attendance ledgers, and raw JSON database backups", portal: "management" }
  };

  function updateAuthTopbar() {
    var container = document.getElementById("auth-status-container");
    if (!container) return;

    if (state.portalMode === "management" && state.authFaculty) {
      container.innerHTML =
        '<div class="auth-user-tag ' + (state.authFaculty.role === "admin" ? 'admin-tag' : '') + '">' +
          '<span style="font-size:14px;">👨‍🏫</span>' +
          '<div>' +
            '<div style="font-weight:700; font-size:12px; line-height:1.2;">' + esc(state.authFaculty.name) + '</div>' +
            '<div style="font-size:10px; color:#64748B;">' + esc(state.authFaculty.dept || "College Management") + '</div>' +
          '</div>' +
          '<button class="auth-logout-btn" id="topbar-logout-btn" title="Sign out of Faculty Portal">Logout ✕</button>' +
        '</div>';

      var logoutBtn = container.querySelector("#topbar-logout-btn");
      if (logoutBtn) logoutBtn.addEventListener("click", logoutFaculty);
    } else {
      container.innerHTML =
        '<div style="display:flex; align-items:center; gap:10px;">' +
          '<div style="width:34px; height:34px; border-radius:50%; background:#1E3A8A; color:#FFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px;" id="topbar-avatar">STU</div>' +
          '<div style="font-size:12px; line-height:1.2;">' +
            '<div style="font-weight:700;" id="topbar-user-title">Student Portal</div>' +
            '<div style="color:var(--text-dim); font-size:10.5px;" id="topbar-user-sub">Public Admissions Desk</div>' +
          '</div>' +
        '</div>';
    }
  }

  function openFacultyAuthModal(onSuccess, onCancel) {
    var root = document.getElementById("modal-root");
    root.innerHTML =
      '<div class="modal-overlay" id="fac-auth-overlay">' +
        '<div class="modal-window faculty-login-modal" style="background:#FFFFFF;">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h3 style="font-size:18px; font-weight:800; color:#0F172A;">SRMIST Faculty & Management Single Sign-On</h3>' +
              '<div style="font-size:12px; color:#64748B;">Campus management tools are exclusively restricted to professors and administration</div>' +
            '</div>' +
            '<button class="modal-close" id="fac-auth-close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div style="font-size:12px; font-weight:700; color:#1E3A8A; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">1-Click Quick Professor Sign-In</div>' +
            '<div class="quick-prof-grid">' +
              '<button type="button" class="prof-login-card" data-prof-name="Dr. Anjali Sharma" data-prof-dept="Computer Science & Engineering" data-prof-role="Faculty">' +
                '<div class="prof-avatar-badge">AS</div>' +
                '<div>' +
                  '<div class="prof-login-name">Dr. Anjali Sharma</div>' +
                  '<div class="prof-login-dept">CSE · Adv. Prog. Practice</div>' +
                '</div>' +
              '</button>' +

              '<button type="button" class="prof-login-card" data-prof-name="Prof. (Dr.) R. P. Mahapatra" data-prof-dept="Dean, Faculty of Engineering" data-prof-role="Dean">' +
                '<div class="prof-avatar-badge">RM</div>' +
                '<div>' +
                  '<div class="prof-login-name">Prof. (Dr.) R.P. Mahapatra</div>' +
                  '<div class="prof-login-dept">Dean & Professor · CSE</div>' +
                '</div>' +
              '</button>' +

              '<button type="button" class="prof-login-card" data-prof-name="Dr. Avneesh Vashistha" data-prof-dept="Computer Science & Engineering" data-prof-role="HOD">' +
                '<div class="prof-avatar-badge">AV</div>' +
                '<div>' +
                  '<div class="prof-login-name">Dr. Avneesh Vashistha</div>' +
                  '<div class="prof-login-dept">HOD · Computer Science</div>' +
                '</div>' +
              '</button>' +

              '<button type="button" class="prof-login-card" data-prof-name="Dr. Rupali Singh" data-prof-dept="Electronics & Communication" data-prof-role="HOD">' +
                '<div class="prof-avatar-badge">RS</div>' +
                '<div>' +
                  '<div class="prof-login-name">Dr. Rupali Singh</div>' +
                  '<div class="prof-login-dept">HOD · Electronics (ECE)</div>' +
                '</div>' +
              '</button>' +

              '<button type="button" class="prof-login-card" data-prof-name="Dr. Lalit Kishore Arora" data-prof-dept="Computer Applications (BCA/MCA)" data-prof-role="HOD">' +
                '<div class="prof-avatar-badge">LA</div>' +
                '<div>' +
                  '<div class="prof-login-name">Dr. Lalit Kishore Arora</div>' +
                  '<div class="prof-login-dept">HOD · Computer Apps</div>' +
                '</div>' +
              '</button>' +

              '<button type="button" class="prof-login-card" data-prof-name="Registrar Admin Office" data-prof-dept="Office of the Registrar" data-prof-role="admin">' +
                '<div class="prof-avatar-badge" style="background:#0F172A; color:#F59E0B;">REG</div>' +
                '<div>' +
                  '<div class="prof-login-name">Registrar Admin Desk</div>' +
                  '<div class="prof-login-dept">All Branches · PIN: SRM2026</div>' +
                '</div>' +
              '</button>' +
            '</div>' +

            '<div style="text-align:center; position:relative; margin:18px 0;">' +
              '<span style="background:#FFFFFF; padding:0 12px; color:#94A3B8; font-size:12px; position:relative; z-index:2;">OR ENTER PASSCODE</span>' +
              '<div style="position:absolute; top:50%; left:0; width:100%; height:1px; background:var(--border-subtle); z-index:1;"></div>' +
            '</div>' +

            '<form id="custom-auth-form">' +
              '<div class="field" style="margin-bottom:14px;">' +
                '<label>Staff Email or Access PIN</label>' +
                '<input type="password" id="auth-pin-input" placeholder="Enter Staff PIN (e.g. SRM2026 or admin123)" class="mono" required>' +
              '</div>' +
              '<button type="submit" class="btn btn-primary btn-block" style="background:#1E3A8A; border-color:#1E3A8A; font-weight:700;">' +
                '<span>Authenticate & Enter Management Portal</span>' +
              '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';

    function handleAuthSuccess(user) {
      state.authFaculty = user;
      localStorage.setItem("regengine_auth_faculty", JSON.stringify(user));
      closeModal();
      showToast("Authenticated as " + user.name);
      playSuccessChime();
      updateAuthTopbar();
      if (onSuccess) onSuccess(user);
    }

    root.querySelectorAll(".prof-login-card").forEach(function(card){
      card.addEventListener("click", function(){
        var user = {
          name: card.getAttribute("data-prof-name"),
          dept: card.getAttribute("data-prof-dept"),
          role: card.getAttribute("data-prof-role")
        };
        handleAuthSuccess(user);
      });
    });

    var customForm = root.querySelector("#custom-auth-form");
    if (customForm) {
      customForm.addEventListener("submit", function(e){
        e.preventDefault();
        var pin = (root.querySelector("#auth-pin-input").value || "").trim();
        if (pin.toLowerCase() === "srm2026" || pin.toLowerCase() === "admin123" || pin === "1234" || pin.length >= 3) {
          handleAuthSuccess({
            name: "Dr. Anjali Sharma",
            dept: "Computer Science & Engineering",
            role: "Faculty"
          });
        } else {
          showToast("Invalid access PIN. Try: SRM2026", "error");
        }
      });
    }

    function cancelAuth() {
      closeModal();
      if (onCancel) onCancel();
    }

    root.querySelector("#fac-auth-close").addEventListener("click", cancelAuth);
    root.querySelector("#fac-auth-overlay").addEventListener("click", function(e){
      if (e.target.id === "fac-auth-overlay") cancelAuth();
    });
  }

  function logoutFaculty() {
    state.authFaculty = null;
    localStorage.removeItem("regengine_auth_faculty");
    updateAuthTopbar();
    setPortalMode("student", "register");
    showToast("Signed out from Faculty Management.");
  }

  function setPortalMode(mode, targetView) {
    if (mode === "management" && !state.authFaculty) {
      openFacultyAuthModal(function(){
        setPortalMode("management", targetView);
      }, function(){
        // Stay in student mode if cancelled
        setPortalMode("student");
      });
      return;
    }

    state.portalMode = mode;
    var segStu = document.getElementById("seg-btn-student");
    var segMgmt = document.getElementById("seg-btn-management");
    var navStu = document.getElementById("app-nav-student");
    var navMgmt = document.getElementById("app-nav-management");

    if (segStu) segStu.classList.toggle("active", mode === "student");
    if (segMgmt) {
      segMgmt.classList.toggle("active", mode === "management");
      segMgmt.classList.toggle("mgmt-active", mode === "management");
    }

    if (navStu) navStu.style.display = mode === "student" ? "flex" : "none";
    if (navMgmt) navMgmt.style.display = mode === "management" ? "flex" : "none";

    updateAuthTopbar();

    var defaultView = mode === "student" ? "register" : "dashboard";
    switchView(targetView || defaultView);
  }

  function switchView(viewName) {
    var meta = VIEW_META[viewName] || { title: "RegEngine Portal", meta: "SRMIST Delhi-NCR Ghaziabad", portal: "student" };

    // If trying to access a management view without auth
    if (meta.portal === "management" && !state.authFaculty) {
      openFacultyAuthModal(function(){
        setPortalMode("management", viewName);
      });
      return;
    }

    // Auto adjust portal mode UI if needed
    if (meta.portal !== state.portalMode) {
      state.portalMode = meta.portal;
      var segStu = document.getElementById("seg-btn-student");
      var segMgmt = document.getElementById("seg-btn-management");
      var navStu = document.getElementById("app-nav-student");
      var navMgmt = document.getElementById("app-nav-management");
      if (segStu) segStu.classList.toggle("active", meta.portal === "student");
      if (segMgmt) {
        segMgmt.classList.toggle("active", meta.portal === "management");
        segMgmt.classList.toggle("mgmt-active", meta.portal === "management");
      }
      if (navStu) navStu.style.display = meta.portal === "student" ? "flex" : "none";
      if (navMgmt) navMgmt.style.display = meta.portal === "management" ? "flex" : "none";
      updateAuthTopbar();
    }

    document.querySelectorAll(".view-pane").forEach(function(el){ el.classList.remove("active"); });
    var targetPane = document.getElementById("view-" + viewName);
    if (targetPane) targetPane.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(function(el){
      el.classList.toggle("active", el.getAttribute("data-view") === viewName);
    });

    var titleEl = document.getElementById("view-title");
    var metaEl = document.getElementById("view-meta");
    if (titleEl) titleEl.textContent = meta.title;
    if (metaEl) metaEl.textContent = meta.meta;

    playTone(500, "sine", 0.05);

    // Trigger renderers
    if (viewName === "register") initRegistrationForm();
    if (viewName === "student-idcard") renderStudentIdCardView();
    if (viewName === "student-status") renderStudentStatusView();
    if (viewName === "timetable") renderTimetable();
    if (viewName === "calendar") renderCalendar();
    if (viewName === "syllabus") renderCurriculum();
    if (viewName === "notices") renderNotices();
    if (viewName === "student-courses") renderStudentCoursesView();
    if (viewName === "student-attendance") renderStudentAttendanceView();
    if (viewName === "records") renderRecords();
    if (viewName === "dashboard") renderDashboard();
    if (viewName === "attendance") renderAttendance();
    if (viewName === "notice-mgr") initNoticePublisher();
    if (viewName === "faculty") renderFaculty();
    if (viewName === "courses") renderCourses();
  }

  // Segmented Mode Switcher Listeners
  var segBtnStudent = document.getElementById("seg-btn-student");
  if (segBtnStudent) {
    segBtnStudent.addEventListener("click", function(){
      setPortalMode("student", "register");
    });
  }

  var segBtnMgmt = document.getElementById("seg-btn-management");
  if (segBtnMgmt) {
    segBtnMgmt.addEventListener("click", function(){
      setPortalMode("management", "dashboard");
    });
  }

  var appNavStu = document.getElementById("app-nav-student");
  if (appNavStu) {
    appNavStu.addEventListener("click", function(e){
      var btn = e.target.closest(".nav-item");
      if (!btn) return;
      switchView(btn.getAttribute("data-view"));
    });
  }

  var appNavMgmt = document.getElementById("app-nav-management");
  if (appNavMgmt) {
    appNavMgmt.addEventListener("click", function(e){
      var btn = e.target.closest(".nav-item");
      if (!btn) return;
      switchView(btn.getAttribute("data-view"));
    });
  }

  document.querySelectorAll("[data-quick]").forEach(function(el){
    el.addEventListener("click", function(){
      switchView(el.getAttribute("data-quick"));
    });
  });

  /* ================= STUDENT SECTION VIEW RENDERERS ================= */

  // 1. Student 3D ID Badge View
  function renderStudentIdCardView(optStudent) {
    var mount = document.getElementById("student-idcard-mount");
    if (!mount) return;

    var student = optStudent;
    if (!student && state.students.length > 0) {
      // Find Aadi Saxena or default to first student
      student = state.students.find(function(s){ return s.name.indexOf("Aadi") > -1; }) || state.students[0];
    }

    if (!student) {
      mount.innerHTML =
        '<div class="empty-banner">' +
          '<div class="icon">🪪</div>' +
          '<h3>No Enrolled Student Records Yet</h3>' +
          '<p>Complete your online admission registration first to mint your 3D digital holographic student badge.</p>' +
          '<button class="btn btn-primary" onclick="switchView(\'register\')" style="background:#1E3A8A; border-color:#1E3A8A;">Go to Admission Registration →</button>' +
        '</div>';
      return;
    }

    var course = courseByCode(student.course);
    var att = attendanceStats(student.rollNumber);
    var attText = att.pct !== null ? att.pct + "% ATTENDANCE" : "NEW ADMIT";

    mount.innerHTML =
      '<div style="display:flex; flex-direction:column; align-items:center; gap:24px;">' +
        '<div class="idcard-perspective-wrap" id="page-card-wrap">' +
          '<div class="idcard-3d" id="page-holo-card" style="background:linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%);">' +
            '<div class="idcard-holo-sheen"></div>' +
            '<div class="idcard-top-stripe"></div>' +
            '<div class="idcard-head">' +
              '<div class="idcard-inst-brand">' +
                '<div class="idcard-seal">R</div>' +
                '<div>' +
                  '<div class="idcard-inst-name">SRMIST Delhi-NCR Ghaziabad</div>' +
                  '<div class="idcard-inst-sub">Student Identity Card · RegEngine</div>' +
                '</div>' +
              '</div>' +
              '<span class="badge badge-gold">VERIFIED</span>' +
            '</div>' +
            '<div class="idcard-body">' +
              '<div class="idcard-profile-row">' +
                '<div class="idcard-avatar" style="border-color:#F59E0B;">' + initials(student.name) + '</div>' +
                '<div>' +
                  '<div class="idcard-name-title">' + esc(student.name) + '</div>' +
                  '<div class="idcard-roll-badge">' + esc(student.rollNumber) + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="idcard-grid">' +
                '<div class="idcard-grid-full"><div class="k">Branch & Section</div><div class="v">' + esc(course.name) + ' (' + esc(student.section || "Section A") + ')</div></div>' +
                '<div><div class="k">Batch / Year</div><div class="v">' + esc(student.batchYear || "2026–2030") + '</div></div>' +
                '<div><div class="k">Blood Group</div><div class="v">' + esc(student.bloodGroup || "O+") + '</div></div>' +
                '<div class="idcard-grid-full"><div class="k">Emergency Contact</div><div class="v mono">' + esc(student.emergencyContact || student.phone || "—") + '</div></div>' +
              '</div>' +
              '<div class="idcard-qr-section">' +
                '<div class="idcard-qr-box" id="page-qr-mount"></div>' +
                '<div class="idcard-meta-right">' +
                  '<div style="font-size:10px; color:#94A3B8;">ACADEMIC STANDING</div>' +
                  '<div class="idcard-att-badge">' + attText + '</div>' +
                  '<div class="idcard-sig">Registrar Office ✍️</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">' +
          '<button class="btn btn-primary" id="page-print-id-btn" style="background:#1E3A8A; border-color:#1E3A8A;">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
            '<span>Print Official ID Badge</span>' +
          '</button>' +
          '<button class="btn btn-ghost" id="view-my-dossier-btn">' +
            '<span>📄 View Full Admission Dossier</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    var qrMount = mount.querySelector("#page-qr-mount");
    if (qrMount && window.QRCode) {
      new window.QRCode(qrMount, {
        text: "https://regengine.srmup.in/verify/" + student.rollNumber,
        width: 64,
        height: 64,
        colorDark: "#090D14",
        colorLight: "#FFFFFF"
      });
    }

    var cardWrap = mount.querySelector("#page-card-wrap");
    var holoCard = mount.querySelector("#page-holo-card");
    if (cardWrap && holoCard) {
      cardWrap.addEventListener("mousemove", function(e){
        var rect = cardWrap.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        var rotX = (-y / (rect.height / 2)) * 14;
        var rotY = (x / (rect.width / 2)) * 14;
        holoCard.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) scale3d(1.02, 1.02, 1.02)";
      });
      cardWrap.addEventListener("mouseleave", function(){
        holoCard.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    }

    mount.querySelector("#page-print-id-btn").addEventListener("click", function(){
      window.print();
    });

    mount.querySelector("#view-my-dossier-btn").addEventListener("click", function(){
      switchView("student-status");
      renderStudentStatusView(student);
    });
  }

  // Hook up search on ID Card View
  var idcardSearchInput = document.getElementById("idcard-search-input");
  var idcardFindBtn = document.getElementById("idcard-find-btn");
  if (idcardFindBtn && idcardSearchInput) {
    idcardFindBtn.addEventListener("click", function(){
      var q = (idcardSearchInput.value || "").trim().toLowerCase();
      if (!q) return;
      var match = state.students.find(function(s){
        return s.rollNumber.toLowerCase() === q || s.name.toLowerCase().indexOf(q) > -1;
      });
      if (match) {
        renderStudentIdCardView(match);
        showToast("Loaded ID Badge for " + match.name);
      } else {
        showToast("No enrolled student matching '" + q + "'", "error");
      }
    });
  }

  var quickAadiIdBtn = document.getElementById("quick-aadi-idcard-btn");
  if (quickAadiIdBtn) {
    quickAadiIdBtn.addEventListener("click", function(){
      var aadi = state.students.find(function(s){ return s.name.indexOf("Aadi") > -1; });
      if (aadi) {
        renderStudentIdCardView(aadi);
        showToast("Loaded Reference Student Badge: Aadi Saxena");
      } else {
        showToast("Please register Aadi Saxena using the registration form first.", "error");
      }
    });
  }

  // 2. Student Status & Dossier View
  function renderStudentStatusView(optStudent) {
    var mount = document.getElementById("student-status-mount");
    if (!mount) return;

    var student = optStudent;
    if (!student && state.students.length > 0) {
      student = state.students.find(function(s){ return s.name.indexOf("Aadi") > -1; }) || state.students[0];
    }

    if (!student) {
      mount.innerHTML =
        '<div class="empty-banner">' +
          '<div class="icon">📋</div>' +
          '<h3>No Enrolled Student Records Found</h3>' +
          '<p>Submit an admission registration to view and verify your institutional student dossier.</p>' +
          '<button class="btn btn-primary" onclick="switchView(\'register\')" style="background:#1E3A8A; border-color:#1E3A8A;">Start Admission Registration →</button>' +
        '</div>';
      return;
    }

    var course = courseByCode(student.course);
    var att = attendanceStats(student.rollNumber);

    mount.innerHTML =
      '<div class="verified-dossier-card">' +
        '<div class="verified-dossier-header">' +
          '<div style="display:flex; align-items:center; gap:16px;">' +
            '<div style="width:54px; height:54px; border-radius:12px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:#F59E0B;">' + initials(student.name) + '</div>' +
            '<div>' +
              '<h3 style="font-size:20px; font-weight:800; color:#FFFFFF; margin:0;">' + esc(student.name) + '</h3>' +
              '<div style="font-size:12.5px; color:#93C5FD; margin-top:2px;">Roll No: <span class="mono">' + esc(student.rollNumber) + '</span> · ' + esc(course.name) + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="badge badge-emerald" style="font-weight:800; padding:6px 14px;">CONFIRMED ADMIT</span>' +
        '</div>' +

        '<div class="verified-dossier-body">' +
          '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:12px;">1. Personal & Academic Profile</h4>' +
          '<div class="dossier-info-grid" style="margin-bottom:20px;">' +
            '<div class="dossier-info-item"><div class="k">Assigned Class Section</div><div class="v"><span class="badge" style="background:#EEF2FF; color:#4338CA; font-weight:700;">' + esc(student.section || 'Section A') + '</span></div></div>' +
            '<div class="dossier-info-item"><div class="k">Admission Quota</div><div class="v">' + esc(student.admissionType || 'Merit Allotment') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Gender / DOB</div><div class="v">' + esc(student.gender || '—') + ' · ' + esc(student.dob || '—') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Category & Blood Group</div><div class="v">' + esc(student.category || 'General') + ' · ' + esc(student.bloodGroup || 'O+') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Qualifying Marks (10th / 12th)</div><div class="v mono">' + (student.percentage10 || '—') + '% / ' + (student.percentage12 || '—') + '%</div></div>' +
          '</div>' +

          '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:12px;">2. Parent & Guardian Particulars</h4>' +
          '<div class="dossier-info-grid" style="margin-bottom:20px;">' +
            '<div class="dossier-info-item"><div class="k">Father\'s Name & Occupation</div><div class="v">' + esc(student.fatherName || '—') + (student.fatherOccupation ? ' (' + esc(student.fatherOccupation) + ')' : '') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Mother\'s Name & Occupation</div><div class="v">' + esc(student.motherName || '—') + (student.motherOccupation ? ' (' + esc(student.motherOccupation) + ')' : '') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Guardian Mobile Phone</div><div class="v mono">' + esc(student.guardianPhone || '—') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Emergency Contact</div><div class="v">' + esc(student.emergencyContact || '—') + '</div></div>' +
          '</div>' +

          '<h4 style="font-size:13.5px; font-weight:700; color:#1E3A8A; text-transform:uppercase; margin-bottom:12px;">3. Residential Address & Campus Allotment</h4>' +
          '<div class="dossier-info-grid" style="margin-bottom:24px;">' +
            '<div class="dossier-info-item"><div class="k">Residential Address</div><div class="v">' + esc(student.address || '—') + ', ' + esc(student.cityStatePin || '') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Hostel Accommodation</div><div class="v">' + esc(student.accommodation || 'Day Scholar') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Campus Bus Route</div><div class="v">' + esc(student.busRoute || 'None / Own Transport') + '</div></div>' +
            '<div class="dossier-info-item"><div class="k">Attendance Standing</div><div class="v" style="color:' + (att.pct < 75 ? '#DC2626' : '#10B981') + ';">' + (att.pct !== null ? att.pct + "% Recorded" : "New Admit") + '</div></div>' +
          '</div>' +

          '<div style="display:flex; justify-content:space-between; align-items:center; pt-4; border-top:1px solid var(--border-subtle);">' +
            '<button class="btn btn-ghost" onclick="switchView(\'student-idcard\')">🪪 View 3D ID Badge</button>' +
            '<button class="btn btn-primary" onclick="window.print()" style="background:#1E3A8A; border-color:#1E3A8A;">🖨️ Print Official Admission Confirmation Slip</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var statusSearchInput = document.getElementById("status-search-input");
  var statusFindBtn = document.getElementById("status-find-btn");
  if (statusFindBtn && statusSearchInput) {
    statusFindBtn.addEventListener("click", function(){
      var q = (statusSearchInput.value || "").trim().toLowerCase();
      if (!q) return;
      var match = state.students.find(function(s){
        return s.rollNumber.toLowerCase() === q || s.name.toLowerCase().indexOf(q) > -1;
      });
      if (match) {
        renderStudentStatusView(match);
        showToast("Loaded Admission Dossier for " + match.name);
      } else {
        showToast("No student found with Roll/Name: " + q, "error");
      }
    });
  }

  // 3. Student Academic Catalog View
  function renderStudentCoursesView() {
    var mount = document.getElementById("student-courses-grid-mount");
    if (!mount) return;

    mount.innerHTML = COURSES.map(function(c){
      var enrolled = state.students.filter(function(s){ return s.course === c.code; }).length;
      var pct = Math.min(100, Math.round((enrolled / c.capacity) * 100));

      return '<div class="card" style="padding:22px; background:#FFFFFF; display:flex; flex-direction:column; justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">' +
            '<span class="badge" style="background:#EFF6FF; color:#1E40AF; font-weight:700;">' + esc(c.code) + '</span>' +
            '<span class="badge badge-emerald">' + (c.capacity - enrolled) + ' Seats Left</span>' +
          '</div>' +
          '<h3 style="font-size:16px; font-weight:800; color:#0F172A; margin-bottom:6px; line-height:1.3;">' + esc(c.name) + '</h3>' +
          '<div style="font-size:12px; color:#64748B; margin-bottom:16px;">' + esc(c.dept) + '</div>' +
          
          '<div style="margin-bottom:14px;">' +
            '<div style="display:flex; justify-content:space-between; font-size:11.5px; color:#64748B; margin-bottom:4px;">' +
              '<span>Admitted ' + enrolled + ' / ' + c.capacity + '</span>' +
              '<span class="mono">' + pct + '% filled</span>' +
            '</div>' +
            '<div style="height:6px; background:#F1F5F9; border-radius:3px; overflow:hidden;">' +
              '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg, #1E3A8A, #3B82F6);"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<button class="btn btn-sm btn-ghost" onclick="switchView(\'register\')" style="width:100%; margin-top:12px; font-weight:700;">' +
          'Apply for this Programme →' +
        '</button>' +
      '</div>';
    }).join("");
  }

  // 4. Student Attendance Self-Check View
  function renderStudentAttendanceView(optStudent) {
    var mount = document.getElementById("student-att-result-mount");
    if (!mount) return;

    var student = optStudent;
    if (!student && state.students.length > 0) {
      student = state.students.find(function(s){ return s.name.indexOf("Aadi") > -1; }) || state.students[0];
    }

    if (!student) {
      mount.innerHTML =
        '<div class="empty-banner">' +
          '<div class="icon">📊</div>' +
          '<h3>No Attendance Records Found</h3>' +
          '<p>Enter your student roll number to check your current attendance percentage and eligibility.</p>' +
        '</div>';
      return;
    }

    var att = attendanceStats(student.rollNumber);
    var pct = att.pct !== null ? att.pct : 100;
    var isEligible = pct >= 75;

    var course = courseByCode(student.course);
    var studentSection = student.section || "Section A";

    // Gather date sessions for this student
    var sessionLogs = [];
    state.attendance.forEach(function(session){
      var rec = (session.records || []).find(function(r){ return r.rollNumber === student.rollNumber; });
      if (rec) {
        sessionLogs.push({
          date: session.date,
          course: session.course,
          section: session.section || "Section A",
          present: rec.present
        });
      }
    });

    var logRows = sessionLogs.length === 0
      ? '<tr><td colspan="4" style="text-align:center; color:#64748B; padding:16px;">No dated attendance sessions marked for this cohort yet.</td></tr>'
      : sessionLogs.map(function(l){
          return '<tr>' +
            '<td class="mono" style="font-weight:700; color:#1E3A8A;">' + esc(l.date) + '</td>' +
            '<td><span class="badge" style="background:#EEF2FF; color:#4338CA; font-weight:700; font-size:11px;">' + esc(l.section) + '</span></td>' +
            '<td>' + esc(course.name) + '</td>' +
            '<td>' + (l.present ? '<span class="badge badge-emerald">✓ Present</span>' : '<span class="badge badge-rose">✗ Absent</span>') + '</td>' +
          '</tr>';
        }).join("");

    mount.innerHTML =
      '<div class="card" style="padding:28px; background:#FFFFFF;">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle); flex-wrap:wrap;">' +
          '<div style="display:flex; align-items:center; gap:16px;">' +
            '<div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg, #1E3A8A, #0F172A); color:#F59E0B; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">' + initials(student.name) + '</div>' +
            '<div>' +
              '<h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0;">' + esc(student.name) + '</h3>' +
              '<div style="font-size:12.5px; color:#64748B; margin-top:2px;">Roll Number: <span class="mono" style="font-weight:700;">' + esc(student.rollNumber) + '</span> · ' + esc(course.name) + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; gap:8px;">' +
            '<span class="badge" style="background:#EEF2FF; color:#4338CA; font-weight:800; font-size:12px; padding:6px 12px;">' + esc(studentSection) + '</span>' +
            '<span class="badge ' + (isEligible ? 'badge-emerald' : 'badge-rose') + '" style="font-weight:800; padding:6px 12px;">' + (isEligible ? 'ELIGIBLE' : 'SHORTAGE') + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="student-att-meter" style="margin-bottom:24px;">' +
          '<div class="att-gauge-circle" style="--att-pct:' + pct + '%;">' +
            '<div class="att-gauge-inner">' +
              '<span>' + pct + '%</span>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:18px; font-weight:800; color:' + (isEligible ? '#059669' : '#DC2626') + ';">' +
              (isEligible ? '✅ Good Standing — Eligible for Examinations' : '⚠️ Statutory Defaulter Warning (< 75%)') +
            '</div>' +
            '<p style="font-size:13px; color:#64748B; margin-top:4px; line-height:1.5;">' +
              'You have attended <strong>' + att.present + '</strong> out of <strong>' + att.total + '</strong> recorded classes in ' + esc(studentSection) + '. ' +
              (isEligible ? 'Your attendance fulfills SRMIST university requirements for final exam hall ticket issuance.' : 'You must attend remaining lectures to clear the 75% statutory requirement.') +
            '</p>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle);">' +
          '<h4 style="font-size:14px; font-weight:800; color:#0F172A; margin-bottom:12px;">Recent Class Attendance Log (' + esc(studentSection) + ')</h4>' +
          '<table class="data-table" style="font-size:13px;">' +
            '<thead><tr><th>Date</th><th>Section</th><th>Subject / Programme</th><th>Attendance Status</th></tr></thead>' +
            '<tbody>' + logRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
  }

  var attCheckInput = document.getElementById("att-check-input");
  var attCheckBtn = document.getElementById("att-check-btn");
  if (attCheckBtn && attCheckInput) {
    attCheckBtn.addEventListener("click", function(){
      var q = (attCheckInput.value || "").trim().toLowerCase();
      if (!q) return;
      var match = state.students.find(function(s){
        return s.rollNumber.toLowerCase() === q || s.name.toLowerCase().indexOf(q) > -1;
      });
      if (match) {
        renderStudentAttendanceView(match);
        showToast("Attendance loaded for " + match.name);
      } else {
        showToast("No student record found with Roll Number: " + q, "error");
      }
    });
  }

  /* ================= MULTI-STEP REGISTRATION CONTROLLER ================= */
  var currentRegStep = 1;

  function initRegistrationForm() {
    var courseSelect = document.getElementById("reg-course");
    if (courseSelect) {
      courseSelect.innerHTML = COURSES.map(function(c){
        return '<option value="' + c.code + '">' + esc(c.name) + ' (' + c.capacity + ' seats max)</option>';
      }).join("");
    }
  }

  function goToRegStep(stepNum) {
    currentRegStep = stepNum;
    document.querySelectorAll(".step-tab").forEach(function(tab){
      var s = parseInt(tab.getAttribute("data-step"), 10);
      tab.classList.toggle("active", s === stepNum);
    });
    document.querySelectorAll(".form-step-page").forEach(function(page, idx){
      page.classList.toggle("active", (idx + 1) === stepNum);
    });
    playTone(550, "sine", 0.05);
  }

  document.querySelectorAll(".step-tab").forEach(function(tab){
    tab.addEventListener("click", function(){
      var s = parseInt(tab.getAttribute("data-step"), 10);
      goToRegStep(s);
    });
  });

  document.querySelectorAll("[data-nav-step]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var s = parseInt(btn.getAttribute("data-nav-step"), 10);
      goToRegStep(s);
    });
  });

  // Autofill Demo Student
  var autofillBtn = document.getElementById("autofill-btn");
  if (autofillBtn) {
    autofillBtn.addEventListener("click", function(){
      var demoStudents = [
        {
          name: "Aadi Saxena", gender: "Male", dob: "2006-10-11", blood: "O+", cat: "General",
          aadhar: "5482 9102 3841", roll: "RA2611003010001", batch: "2026–2030", c: "CSE-CORE", section: "Section A",
          admtype: "National Entrance (JEE Main)", p10: "95.4", p12: "96.8", school: "Delhi Public School, Ghaziabad",
          father: "Anupam Saxena", fathocc: "Senior Director of Technology", mother: "Meera Saxena", mothocc: "Professor & Academician",
          gphone: "+91 98450 12345", gemail: "anupam.saxena@gmail.com", phone: "+91 98765 43210", email: "aadi.saxena@regengine.edu",
          emerg: "Anupam Saxena (Father) - +91 98450 12345", address: "Tower 4, Flat 702, Raj Nagar Extension",
          city: "Ghaziabad, Uttar Pradesh - 201017", accom: "Day Scholar", bus: "College Bus Route 1 (City Center)"
        },
        {
          name: "Riya Verma", gender: "Female", dob: "2006-08-22", blood: "A+", cat: "General",
          aadhar: "8721 3491 8023", roll: "RA2611003010042", batch: "2026–2030", c: "CSE-AIML", section: "Section B",
          admtype: "State Merit Entrance", p10: "96.0", p12: "97.5", school: "St. Thomas School, Indirapuram",
          father: "Rajesh Verma", fathocc: "Executive Director", mother: "Sunita Verma", mothocc: "Chartered Accountant",
          gphone: "+91 99880 54321", gemail: "rajesh.verma@gmail.com", phone: "+91 99123 45678", email: "riya.verma@regengine.edu",
          emerg: "Rajesh Verma (Father) - +91 99880 54321", address: "B-12, Sector 14, Vasundhara",
          city: "Ghaziabad, Uttar Pradesh - 201012", accom: "Campus Hostel (AC Room)", bus: "None / Own Vehicle"
        }
      ];

      var pick = demoStudents[Math.floor(Math.random() * demoStudents.length)];
      var randNum = Math.floor(100 + Math.random() * 899);
      var rollCode = pick.c.replace("-", "").slice(0, 4);

      document.getElementById("reg-name").value = pick.name;
      document.getElementById("reg-gender").value = pick.gender;
      document.getElementById("reg-dob").value = pick.dob;
      document.getElementById("reg-blood").value = pick.blood;
      document.getElementById("reg-category").value = pick.cat;
      document.getElementById("reg-aadhar").value = pick.aadhar;

      document.getElementById("reg-roll").value = "26" + rollCode.slice(0, 2) + randNum;
      if (document.getElementById("reg-section")) document.getElementById("reg-section").value = pick.section || "Section A";
      document.getElementById("reg-batch").value = pick.batch;
      document.getElementById("reg-course").value = pick.c;
      document.getElementById("reg-admtype").value = pick.admtype;
      document.getElementById("reg-pct10").value = pick.p10;
      document.getElementById("reg-pct12").value = pick.p12;
      document.getElementById("reg-prevschool").value = pick.school;

      document.getElementById("reg-father").value = pick.father;
      document.getElementById("reg-fathocc").value = pick.fathocc;
      document.getElementById("reg-mother").value = pick.mother;
      document.getElementById("reg-mothocc").value = pick.mothocc;
      document.getElementById("reg-guardphone").value = pick.gphone;
      document.getElementById("reg-guardemail").value = pick.gemail;

      document.getElementById("reg-phone").value = pick.phone;
      document.getElementById("reg-email").value = pick.email;
      document.getElementById("reg-emergency").value = pick.emerg;
      document.getElementById("reg-address").value = pick.address;
      document.getElementById("reg-citystatepin").value = pick.city;

      document.getElementById("reg-accommodation").value = pick.accom;
      document.getElementById("reg-bus").value = pick.bus;

      goToRegStep(1);
      showToast("Autofilled student details.");
      playTone(700, "sine", 0.08);
    });
  }

  // Submit Full Registration
  var fullRegForm = document.getElementById("full-registration-form");
  if (fullRegForm) {
    fullRegForm.onsubmit = function(e){
      e.preventDefault();

      var payload = {
        name: document.getElementById("reg-name").value.trim(),
        gender: document.getElementById("reg-gender").value,
        dob: document.getElementById("reg-dob").value,
        bloodGroup: document.getElementById("reg-blood").value,
        category: document.getElementById("reg-category").value,
        aadharNumber: document.getElementById("reg-aadhar").value.trim(),

        rollNumber: document.getElementById("reg-roll").value.trim(),
        section: (document.getElementById("reg-section") && document.getElementById("reg-section").value) || "Section A",
        batchYear: document.getElementById("reg-batch").value,
        course: document.getElementById("reg-course").value,
        admissionType: document.getElementById("reg-admtype").value,
        percentage10: document.getElementById("reg-pct10").value,
        percentage12: document.getElementById("reg-pct12").value,
        previousSchool: document.getElementById("reg-prevschool").value.trim(),

        fatherName: document.getElementById("reg-father").value.trim(),
        fatherOccupation: document.getElementById("reg-fathocc").value.trim(),
        motherName: document.getElementById("reg-mother").value.trim(),
        motherOccupation: document.getElementById("reg-mothocc").value.trim(),
        guardianPhone: document.getElementById("reg-guardphone").value.trim(),
        guardianEmail: document.getElementById("reg-guardemail").value.trim(),

        phone: document.getElementById("reg-phone").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        emergencyContact: document.getElementById("reg-emergency").value.trim(),
        address: document.getElementById("reg-address").value.trim(),
        cityStatePin: document.getElementById("reg-citystatepin").value.trim(),

        accommodation: document.getElementById("reg-accommodation").value,
        busRoute: document.getElementById("reg-bus").value
      };

      apiPost("/students", payload).then(function(student){
        triggerConfetti();
        showToast("Student " + student.name + " registered successfully!");
        fullRegForm.reset();
        goToRegStep(1);
        return refreshAll();
      }).then(function(){
        switchView("records");
      }).catch(function(err){
        showToast(err.message, "error");
      });
    };
  }

  /* ================= STUDENT RECORDS CONTROLLER ================= */
  var recSearchInput = document.getElementById("rec-search-input");
  var recCourseFilter = document.getElementById("rec-course-filter");

  if (recSearchInput) recSearchInput.addEventListener("input", function(){ state.pagination.page = 1; renderRecordsTable(); });
  if (recCourseFilter) recCourseFilter.addEventListener("change", function(){ state.pagination.page = 1; renderRecordsTable(); });

  function renderRecords() {
    if (recCourseFilter) {
      recCourseFilter.innerHTML = '<option value="">All Branches</option>' + COURSES.map(function(c){
        return '<option value="' + c.code + '">' + esc(c.name) + '</option>';
      }).join("");
    }
    renderRecordsTable();
  }

  function renderRecordsTable() {
    var host = document.getElementById("records-table-container");
    if (!host) return;

    var q = (recSearchInput && recSearchInput.value.trim().toLowerCase()) || "";
    var courseVal = (recCourseFilter && recCourseFilter.value) || "";

    var list = state.students.filter(function(s){
      var matchQ = !q || s.name.toLowerCase().indexOf(q) > -1 || s.rollNumber.toLowerCase().indexOf(q) > -1 || (s.phone && s.phone.indexOf(q) > -1);
      var matchC = !courseVal || s.course === courseVal;
      return matchQ && matchC;
    });

    if (!list.length) {
      host.innerHTML = '<div class="empty-banner">' +
        '<div class="icon">🎓</div>' +
        '<h3>No Student Records Found</h3>' +
        '<p>The student registry is currently empty. Click below to start admitting students.</p>' +
        '<button class="btn btn-primary" data-quick="register" style="background:#1E3A8A; border-color:#1E3A8A;">' +
          '<span>+ Register First Student</span>' +
        '</button>' +
      '</div>';
      host.querySelector("[data-quick]").addEventListener("click", function(){ switchView("register"); });
      return;
    }

    // Pagination
    var totalPages = Math.ceil(list.length / state.pagination.pageSize) || 1;
    if (state.pagination.page > totalPages) state.pagination.page = totalPages;
    var startIdx = (state.pagination.page - 1) * state.pagination.pageSize;
    var pageList = list.slice(startIdx, startIdx + state.pagination.pageSize);

    var rows = pageList.map(function(s){
      var att = attendanceStats(s.rollNumber);
      var course = courseByCode(s.course);
      var attBadge = att.pct === null 
        ? '<span class="badge" style="background:#F1F5F9; color:#64748B;">New Admit</span>'
        : att.pct < 75 
        ? '<span class="badge badge-rose">⚠️ ' + att.pct + '%</span>'
        : '<span class="badge badge-emerald">✓ ' + att.pct + '%</span>';

      return '<tr data-id="' + s.id + '">' +
        '<td><strong class="mono" style="color:#1E3A8A;">' + esc(s.rollNumber) + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:700; color:#0F172A;">' + esc(s.name) + '</div>' +
          '<div style="font-size:11px; color:#64748B;">' + (s.gender ? s.gender + ' · ' : '') + (s.category || 'General') + ' · <span class="badge" style="background:#EEF2FF; color:#4338CA; font-weight:700; font-size:10px; padding:1px 6px;">' + esc(s.section || 'Section A') + '</span></div>' +
        '</td>' +
        '<td><span class="badge course-' + s.course + '">' + esc(course.name) + '</span></td>' +
        '<td><span class="mono" style="font-size:12px;">' + esc(s.phone || '—') + '</span></td>' +
        '<td>' + (s.percentage12 ? '<strong class="mono">' + s.percentage12 + '%</strong>' : '—') + '</td>' +
        '<td>' + attBadge + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-sm btn-ghost" data-act="dossier" style="margin-right:6px;">👤 Dossier</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="idcard" style="margin-right:6px;">🪪 ID Badge</button>' +
          '<button class="btn btn-sm btn-danger" data-act="delete">🗑️</button>' +
        '</td>' +
      '</tr>';
    }).join("");

    host.innerHTML = '<table class="data-table">' +
      '<thead><tr>' +
        '<th>Registration No.</th>' +
        '<th>Student Name</th>' +
        '<th>Branch</th>' +
        '<th>Mobile</th>' +
        '<th>12th Merit</th>' +
        '<th>Attendance</th>' +
        '<th style="text-align:right;">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '<div class="pagination-bar">' +
      '<div>Showing ' + (startIdx + 1) + ' to ' + Math.min(startIdx + state.pagination.pageSize, list.length) + ' of ' + list.length + ' students</div>' +
      '<div style="display:flex; gap:8px;">' +
        '<button class="btn btn-sm btn-ghost" id="prev-page-btn" ' + (state.pagination.page === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '') + '>← Previous</button>' +
        '<span style="padding:6px 12px; font-weight:700;">Page ' + state.pagination.page + ' of ' + totalPages + '</span>' +
        '<button class="btn btn-sm btn-ghost" id="next-page-btn" ' + (state.pagination.page >= totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '') + '>Next →</button>' +
      '</div>' +
    '</div>';

    // Pagination Listeners
    var prevBtn = host.querySelector("#prev-page-btn");
    var nextBtn = host.querySelector("#next-page-btn");
    if (prevBtn && state.pagination.page > 1) {
      prevBtn.addEventListener("click", function(){
        state.pagination.page--;
        renderRecordsTable();
      });
    }
    if (nextBtn && state.pagination.page < totalPages) {
      nextBtn.addEventListener("click", function(){
        state.pagination.page++;
        renderRecordsTable();
      });
    }

    // Row Actions
    host.querySelectorAll("tbody tr").forEach(function(tr){
      var id = tr.getAttribute("data-id");
      var student = state.students.find(function(x){ return x.id === id; });
      if (!student) return;

      var dosBtn = tr.querySelector('[data-act="dossier"]');
      var idBtn = tr.querySelector('[data-act="idcard"]');
      var delBtn = tr.querySelector('[data-act="delete"]');

      if (dosBtn) dosBtn.addEventListener("click", function(){ openDossierModal(student); });
      if (idBtn) idBtn.addEventListener("click", function(){ openIdCardModal(student); });
      if (delBtn) delBtn.addEventListener("click", function(){
        openConfirm("Remove Student Record?", "Are you sure you want to remove " + student.name + " (" + student.rollNumber + ") from the university register?", function(){
          apiDelete("/students/" + student.id).then(function(){
            showToast("Student " + student.name + " removed.");
            return refreshAll();
          }).then(function(){
            renderRecordsTable();
            renderDashboard();
          }).catch(function(err){ showToast(err.message, "error"); });
        });
      });
    });
  }

  /* ================= DASHBOARD CONTROLLER ================= */
  function renderDashboard() {
    var kpiRow = document.getElementById("kpi-row");
    var d = state.dashboard;
    if (!d || !kpiRow) return;

    var avgAtt = d.avgAttendance !== null ? d.avgAttendance + "%" : "—";
    var totalCap = state.courses.reduce(function(acc, c){ return acc + (c.capacity || 0); }, 0) || 350;
    var totalEnrolled = d.totalStudents || 0;
    var capPct = Math.round((totalEnrolled / totalCap) * 100);

    kpiRow.innerHTML =
      kpiCard("Total Enrolled Students", totalEnrolled, "Active on university registrar", "gold", "🎓") +
      kpiCard("Faculty Members", d.totalFaculty, d.totalFaculty + " teaching staff registered", "emerald", "👨‍🏫") +
      kpiCard("Average Attendance", avgAtt, d.attendanceSessionsMarked ? d.attendanceSessionsMarked + " sessions recorded" : "No sessions yet", "cyan", "📋") +
      kpiCard("Total Seat Occupancy", capPct + "%", totalEnrolled + " of " + totalCap + " seats filled", "purple", "🏛️");

    var distMount = document.getElementById("dashboard-distribution-bars");
    if (distMount) {
      if (!d.distribution || !d.distribution.length || d.totalStudents === 0) {
        distMount.innerHTML = '<div style="padding:24px; text-align:center; color:#64748B;">No students enrolled yet. All branches have 100% seat availability.</div>';
      } else {
        var maxN = Math.max.apply(null, d.distribution.map(function(x){ return x.count; }).concat([1]));
        distMount.innerHTML = d.distribution.map(function(row){
          var pct = Math.round((row.count / maxN) * 100);
          return '<div style="margin-bottom:14px;">' +
            '<div style="display:flex; justify-content:space-between; font-size:13.5px; font-weight:600; margin-bottom:6px;">' +
              '<span>' + esc(row.name) + '</span>' +
              '<span class="mono" style="color:#1E3A8A;">' + row.count + ' Students</span>' +
            '</div>' +
            '<div style="height:8px; background:#F1F5F9; border-radius:4px; overflow:hidden; border:1px solid var(--border-subtle);">' +
              '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg, #1E3A8A, #3B82F6); border-radius:4px;"></div>' +
            '</div>' +
          '</div>';
        }).join("");
      }
    }

    var actMount = document.getElementById("dashboard-activity-feed");
    if (actMount) {
      if (!d.activity || !d.activity.length) {
        actMount.innerHTML = '<div style="padding:24px; text-align:center; color:#64748B;">No activity logged yet.</div>';
      } else {
        actMount.innerHTML = d.activity.slice(0, 6).map(function(a){
          return '<div style="display:flex; align-items:flex-start; gap:10px; padding:9px 12px; background:#F8FAFC; border-radius:8px; border:1px solid var(--border-subtle); font-size:12.5px;">' +
            '<div style="width:7px; height:7px; border-radius:50%; background:#10B981; margin-top:5px; flex-shrink:0;"></div>' +
            '<div style="flex:1;">' +
              '<div style="font-weight:600; color:#0F172A;">' + esc(a.text) + '</div>' +
              '<div class="mono" style="font-size:11px; color:#64748B; margin-top:2px;">' + fmtTime(a.time) + '</div>' +
            '</div>' +
          '</div>';
        }).join("");
      }
    }
  }

  function kpiCard(label, val, sub, colorClass, icon) {
    return '<div class="card kpi-card ' + colorClass + '" style="background:#FFFFFF;">' +
      '<div class="kpi-header">' +
        '<div class="kpi-label">' + esc(label) + '</div>' +
        '<div class="kpi-icon">' + icon + '</div>' +
      '</div>' +
      '<div class="kpi-value">' + esc(String(val)) + '</div>' +
      '<div class="kpi-meta">' +
        '<span style="color:#10B981; font-weight:700;">●</span>' +
        '<span>' + esc(sub) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ================= ATTENDANCE SUITE CONTROLLER ================= */
  var attState = {
    course: "CSE-CORE",
    section: "Section A",
    date: new Date().toISOString().slice(0, 10),
    draft: {}
  };

  function renderAttendance() {
    var progSelect = document.getElementById("att-prog-select");
    var sectionSelect = document.getElementById("att-section-select");
    var dateInput = document.getElementById("att-date-input");

    if (progSelect) {
      progSelect.innerHTML = COURSES.map(function(c){
        return '<option value="' + c.code + '" ' + (c.code === attState.course ? 'selected' : '') + '>' + esc(c.name) + '</option>';
      }).join("");
      progSelect.onchange = function(e){
        attState.course = e.target.value;
        attState.draft = {};
        paintAttendanceRoster();
      };
    }

    if (sectionSelect) {
      sectionSelect.value = attState.section || "Section A";
      sectionSelect.onchange = function(e){
        attState.section = e.target.value;
        attState.draft = {};
        paintAttendanceRoster();
      };
    }

    if (dateInput) {
      dateInput.value = attState.date;
      dateInput.max = new Date().toISOString().slice(0, 10);
      dateInput.onchange = function(e){
        attState.date = e.target.value;
        attState.draft = {};
        paintAttendanceRoster();
      };
    }

    paintAttendanceRoster();
    paintDefaultersWatchlist();
  }

  function paintAttendanceRoster() {
    var host = document.getElementById("att-roster-mount");
    if (!host) return;

    var roster = state.students.filter(function(s){
      var matchC = s.course === attState.course;
      var matchSec = !attState.section || attState.section === "ALL" || (s.section || "Section A") === attState.section;
      return matchC && matchSec;
    });

    var existingSession = state.attendance.find(function(s){
      var matchC = s.course === attState.course;
      var matchSec = !attState.section || attState.section === "ALL" || (s.section || "Section A") === attState.section;
      return matchC && matchSec && s.date === attState.date;
    });

    var secLabel = attState.section && attState.section !== "ALL" ? " (" + attState.section + ")" : " (All Sections)";

    if (!roster.length) {
      host.innerHTML = '<div class="empty-banner" style="padding:32px;">' +
        '<div class="icon">📋</div>' +
        '<h3>No Students Enrolled in this Cohort' + esc(secLabel) + '</h3>' +
        '<p>Register students into this branch & section to take dated class attendance.</p>' +
      '</div>';
      var summaryBadge = document.getElementById("att-summary-badge");
      if (summaryBadge) {
        summaryBadge.textContent = "0 Students";
        summaryBadge.className = "badge";
      }
      return;
    }

    roster.forEach(function(s){
      if (!attState.draft.hasOwnProperty(s.rollNumber)) {
        if (existingSession) {
          var rec = (existingSession.records || []).find(function(r){ return r.rollNumber === s.rollNumber; });
          attState.draft[s.rollNumber] = rec ? rec.present : true;
        } else {
          attState.draft[s.rollNumber] = true;
        }
      }
    });

    var presentCount = roster.filter(function(s){ return attState.draft[s.rollNumber]; }).length;
    var pct = Math.round((presentCount / roster.length) * 100);
    var summaryBadge = document.getElementById("att-summary-badge");
    if (summaryBadge) {
      summaryBadge.textContent = pct + "% Present (" + presentCount + "/" + roster.length + ")";
      summaryBadge.className = "badge " + (pct >= 75 ? "badge-emerald" : "badge-rose");
    }

    var rows = roster.map(function(s){
      var isPresent = !!attState.draft[s.rollNumber];
      return '<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#F8FAFC; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:8px;">' +
        '<div>' +
          '<div style="font-weight:700; font-size:13.5px; color:#0F172A;">' + esc(s.name) + ' <span class="badge" style="background:#EEF2FF; color:#4338CA; font-size:10.5px; padding:1px 6px; font-weight:700;">' + esc(s.section || "Section A") + '</span></div>' +
          '<div class="mono" style="font-size:11.5px; color:#64748B;">' + esc(s.rollNumber) + '</div>' +
        '</div>' +
        '<div style="display:flex; gap:6px;">' +
          '<button class="btn btn-sm ' + (isPresent ? 'btn-emerald' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="1">✓ Present</button>' +
          '<button class="btn btn-sm ' + (!isPresent ? 'btn-danger' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="0">✗ Absent</button>' +
        '</div>' +
      '</div>';
    }).join("");

    var sessionStatusTag = existingSession 
      ? '<span style="font-size:11px; color:#059669; font-weight:700; background:#ECFDF5; padding:3px 8px; border-radius:4px;">● Saved on Server</span>'
      : '<span style="font-size:11px; color:#D97706; font-weight:700; background:#FFFBEB; padding:3px 8px; border-radius:4px;">● Ready to Mark</span>';

    host.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
          '<span style="font-size:12.5px; font-weight:700; color:#64748B; text-transform:uppercase;">Class Roster' + esc(secLabel) + ' · ' + roster.length + ' Students</span>' +
          sessionStatusTag +
        '</div>' +
        '<div style="display:flex; gap:8px;">' +
          '<button class="btn btn-sm btn-ghost" id="att-all-present">All Present</button>' +
          '<button class="btn btn-sm btn-ghost" id="att-all-absent">All Absent</button>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:360px; overflow-y:auto; padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">' +
        '<div style="font-size:12px; color:#64748B;">Date: <strong class="mono">' + esc(attState.date) + '</strong> · Section: <strong>' + esc(attState.section || "Section A") + '</strong></div>' +
        '<button class="btn btn-primary btn-lg" id="save-attendance-btn" style="background:#1E3A8A; border-color:#1E3A8A;">' +
          '<span>💾 Save Attendance for ' + esc(attState.section || "Section A") + '</span>' +
        '</button>' +
      '</div>';

    host.querySelectorAll("[data-roll]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var roll = btn.getAttribute("data-roll");
        var val = btn.getAttribute("data-val") === "1";
        attState.draft[roll] = val;
        paintAttendanceRoster();
        playTone(val ? 650 : 350, "sine", 0.06);
      });
    });

    var allPres = host.querySelector("#att-all-present");
    var allAbs = host.querySelector("#att-all-absent");
    if (allPres) {
      allPres.addEventListener("click", function(){
        roster.forEach(function(s){ attState.draft[s.rollNumber] = true; });
        paintAttendanceRoster();
      });
    }
    if (allAbs) {
      allAbs.addEventListener("click", function(){
        roster.forEach(function(s){ attState.draft[s.rollNumber] = false; });
        paintAttendanceRoster();
      });
    }

    var saveBtn = host.querySelector("#save-attendance-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", function(){
        var records = roster.map(function(s){
          return { rollNumber: s.rollNumber, present: !!attState.draft[s.rollNumber] };
        });

        apiPost("/attendance", {
          course: attState.course,
          section: attState.section || "Section A",
          date: attState.date,
          records: records
        }).then(function(){
          if (pct === 100) triggerConfetti();
          showToast("Attendance saved for " + (attState.section || "Section A") + " — " + presentCount + " of " + records.length + " present.");
          return refreshAll();
        }).then(function(){
          renderDashboard();
          paintDefaultersWatchlist();
        }).catch(function(err){ showToast(err.message, "error"); });
      });
    }
  }

  function paintDefaultersWatchlist() {
    var host = document.getElementById("att-standing-list");
    if (!host) return;

    if (!state.students.length) {
      host.innerHTML = '<div style="padding:24px; text-align:center; color:#64748B;">No students on record.</div>';
      return;
    }

    var rows = state.students.map(function(s){
      return { s: s, att: attendanceStats(s.rollNumber) };
    }).sort(function(a, b){
      var pa = a.att.pct === null ? 999 : a.att.pct;
      var pb = b.att.pct === null ? 999 : b.att.pct;
      return pa - pb;
    });

    host.innerHTML = rows.map(function(item){
      var pct = item.att.pct;
      var isDefaulter = pct !== null && pct < 75;
      return '<div style="display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:#F8FAFC; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:8px;">' +
        '<div>' +
          '<div style="font-weight:700; font-size:13px; color:#0F172A;">' + esc(item.s.name) + '</div>' +
          '<div class="mono" style="font-size:11px; color:#64748B;">' + esc(item.s.rollNumber) + ' · ' + esc(item.s.course) + '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
          (pct === null ? '<span class="badge" style="background:#E2E8F0; color:#475569;">No Data</span>'
           : isDefaulter ? '<span class="badge badge-rose">⚠️ ' + pct + '%</span>'
           : '<span class="badge badge-emerald">✓ ' + pct + '%</span>') +
        '</div>' +
      '</div>';
    }).join("");
  }

  /* ================= FACULTY HUB CONTROLLER ================= */
  var facSearchInput = document.getElementById("fac-search-input");
  if (facSearchInput) facSearchInput.addEventListener("input", renderFaculty);

  function renderFaculty() {
    var host = document.getElementById("faculty-cards-grid");
    if (!host) return;

    var q = (facSearchInput && facSearchInput.value.trim().toLowerCase()) || "";
    var list = state.faculty.filter(function(f){
      return !q || f.name.toLowerCase().indexOf(q) > -1 || f.department.toLowerCase().indexOf(q) > -1 || f.subject.toLowerCase().indexOf(q) > -1;
    });

    if (!list.length) {
      host.innerHTML = '<div class="empty-banner" style="grid-column:1/-1;">' +
        '<div class="icon">👨‍🏫</div>' +
        '<h3>No Faculty Registered Yet</h3>' +
        '<p>Add professors and department staff to the faculty directory.</p>' +
        '<button class="btn btn-primary" id="empty-add-fac-btn" style="background:#1E3A8A; border-color:#1E3A8A;">' +
          '<span>+ Add First Faculty Member</span>' +
        '</button>' +
      '</div>';
      var btn = host.querySelector("#empty-add-fac-btn");
      if (btn) btn.addEventListener("click", openAddFacultyModal);
      return;
    }

    host.innerHTML = list.map(function(f){
      var course = courseByCode(f.course);
      return '<div class="card" style="padding:22px; background:#FFFFFF; display:flex; flex-direction:column; justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex; align-items:center; gap:14px; margin-bottom:14px;">' +
            '<div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg, #1E3A8A, #0F172A); color:#F59E0B; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:18px;">' + initials(f.name) + '</div>' +
            '<div>' +
              '<div style="font-weight:700; font-size:16px; color:#0F172A;">' + esc(f.name) + '</div>' +
              '<div style="font-size:12px; color:#1E40AF; font-weight:700;">' + esc(f.designation) + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex; flex-direction:column; gap:8px; font-size:12.5px; color:#475569; margin-bottom:16px;">' +
            '<div>🏢 <strong>Dept:</strong> ' + esc(f.department) + ' (' + esc(f.experience) + ' yrs exp)</div>' +
            '<div>📖 <strong>Subject:</strong> ' + esc(f.subject) + '</div>' +
            '<div>🎓 <span class="badge course-' + f.course + '">' + esc(course.name) + '</span></div>' +
            '<div class="mono" style="font-size:11.5px; color:#64748B;">✉️ ' + esc(f.email) + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border-subtle);">' +
          '<a href="mailto:' + esc(f.email) + '" class="btn btn-sm btn-ghost">Contact</a>' +
          '<button class="btn btn-sm btn-danger" data-delfac="' + f.id + '">Remove</button>' +
        '</div>' +
      '</div>';
    }).join("");

    host.querySelectorAll("[data-delfac]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-delfac");
        var faculty = state.faculty.find(function(x){ return x.id === id; });
        if (!faculty) return;
        openConfirm("Remove Faculty Member?", "Are you sure you want to remove " + faculty.name + " from the teaching staff directory?", function(){
          apiDelete("/faculty/" + faculty.id).then(function(){
            showToast(faculty.name + " removed.");
            return refreshAll();
          }).then(function(){
            renderFaculty();
            renderDashboard();
          }).catch(function(err){ showToast(err.message, "error"); });
        });
      });
    });
  }

  function openAddFacultyModal() {
    var root = document.getElementById("modal-root");
    var courseOptions = COURSES.map(function(c){
      return '<option value="' + c.code + '">' + esc(c.name) + '</option>';
    }).join("");

    root.innerHTML =
      '<div class="modal-overlay" id="add-fac-overlay">' +
        '<div class="modal-window" style="max-width:520px; background:#FFFFFF;">' +
          '<div class="modal-header">' +
            '<h3>Register Faculty Member</h3>' +
            '<button class="modal-close" id="add-fac-close">✕</button>' +
          '</div>' +
          '<form id="new-fac-form">' +
            '<div class="modal-body">' +
              '<div class="field-row">' +
                '<div class="field"><label>Full Name *</label><input type="text" id="mf-name" placeholder="e.g. Dr. Priya Nair" required></div>' +
                '<div class="field"><label>Designation *</label><select id="mf-desig" required>' +
                  '<option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Lecturer</option>' +
                '</select></div>' +
              '</div>' +
              '<div class="field-row">' +
                '<div class="field"><label>Department *</label><input type="text" id="mf-dept" placeholder="e.g. Computer Science" required></div>' +
                '<div class="field"><label>Subject Taught *</label><input type="text" id="mf-subject" placeholder="e.g. Data Structures" required></div>' +
              '</div>' +
              '<div class="field-row">' +
                '<div class="field"><label>Assigned Branch *</label><select id="mf-course" required>' + courseOptions + '</select></div>' +
                '<div class="field"><label>Years of Experience *</label><input type="number" min="0" id="mf-exp" placeholder="e.g. 8" required></div>' +
              '</div>' +
              '<div class="field-row">' +
                '<div class="field"><label>Email *</label><input type="email" id="mf-email" placeholder="e.g. priya.nair@regengine.edu" required></div>' +
                '<div class="field"><label>Phone *</label><input type="tel" id="mf-phone" placeholder="e.g. 9876543210" required></div>' +
              '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button type="button" class="btn btn-ghost" id="add-fac-cancel">Cancel</button>' +
              '<button type="submit" class="btn btn-primary" style="background:#1E3A8A; border-color:#1E3A8A;">Add Faculty Member</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    root.querySelector("#add-fac-close").addEventListener("click", closeModal);
    root.querySelector("#add-fac-cancel").addEventListener("click", closeModal);
    root.querySelector("#add-fac-overlay").addEventListener("click", function(e){
      if (e.target.id === "add-fac-overlay") closeModal();
    });

    root.querySelector("#new-fac-form").onsubmit = function(e){
      e.preventDefault();
      var payload = {
        name: document.getElementById("mf-name").value.trim(),
        designation: document.getElementById("mf-desig").value,
        department: document.getElementById("mf-dept").value.trim(),
        subject: document.getElementById("mf-subject").value.trim(),
        course: document.getElementById("mf-course").value,
        experience: document.getElementById("mf-exp").value,
        email: document.getElementById("mf-email").value.trim(),
        phone: document.getElementById("mf-phone").value.trim()
      };

      apiPost("/faculty", payload).then(function(fac){
        closeModal();
        showToast(fac.name + " registered to faculty.");
        return refreshAll();
      }).then(function(){
        renderFaculty();
        renderDashboard();
      }).catch(function(err){ showToast(err.message, "error"); });
    };
  }

  var openAddFacBtn = document.getElementById("open-add-fac-btn");
  if (openAddFacBtn) openAddFacBtn.addEventListener("click", openAddFacultyModal);

  /* ================= PROGRAMMES & CAPACITY CONTROLLER ================= */
  function renderCourses() {
    var host = document.getElementById("courses-grid-mount");
    if (!host) return;

    apiGet("/courses").then(function(courses){
      host.innerHTML = courses.map(function(c){
        var pct = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
        var isFull = pct >= 100;
        return '<div class="card" style="padding:24px; background:#FFFFFF; display:flex; flex-direction:column; justify-content:space-between;">' +
          '<div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
              '<span class="mono" style="font-size:12px; color:#1E3A8A; font-weight:700;">' + esc(c.code) + '</span>' +
              '<span class="badge ' + (isFull ? 'badge-rose' : 'badge-emerald') + '">' + (isFull ? 'CAPACITY FULL' : 'SEATS OPEN') + '</span>' +
            '</div>' +
            '<h3 style="font-size:17px; font-weight:800; color:#0F172A; margin-bottom:14px;">' + esc(c.name) + '</h3>' +

            '<div style="margin-bottom:14px;">' +
              '<div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">' +
                '<span>Seat Occupancy</span>' +
                '<strong class="mono">' + c.enrolled + ' / ' + c.capacity + ' (' + pct + '%)</strong>' +
              '</div>' +
              '<div style="height:8px; background:#F1F5F9; border-radius:4px; overflow:hidden; border:1px solid var(--border-subtle);">' +
                '<div style="height:100%; width:' + pct + '%; background:' + (isFull ? '#DC2626' : 'linear-gradient(90deg, #1E3A8A, #3B82F6)') + '; border-radius:4px;"></div>' +
              '</div>' +
            '</div>' +

            '<div style="padding-top:12px; border-top:1px solid var(--border-subtle);">' +
              '<div style="font-size:11.5px; font-weight:700; color:#64748B; text-transform:uppercase; margin-bottom:6px;">Allocated Teaching Staff</div>' +
              '<div style="font-size:12.5px; color:#334155; line-height:1.6;">' +
                (c.faculty && c.faculty.length ? c.faculty.map(function(f){ return '👨‍🏫 ' + esc(f.name) + ' (' + esc(f.designation) + ')'; }).join("<br>") : '<span style="color:#94A3B8;">No faculty allocated yet</span>') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:20px; padding-top:14px; border-top:1px solid var(--border-subtle);">' +
            '<button class="btn btn-sm btn-ghost" data-viewstream="' + c.code + '">View Branch Roster</button>' +
          '</div>' +
        '</div>';
      }).join("");

      host.querySelectorAll("[data-viewstream]").forEach(function(btn){
        btn.addEventListener("click", function(){
          var code = btn.getAttribute("data-viewstream");
          switchView("records");
          if (recCourseFilter) {
            recCourseFilter.value = code;
            renderRecordsTable();
          }
        });
      });
    }).catch(function(err){ showToast(err.message, "error"); });
  }

  /* ================= DATA CENTER & EXPORTS ================= */
  function downloadCsv(filename, content) {
    var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    playSuccessChime();
  }

  function generateStudentsCsv() {
    var headers = [
      "RollNumber", "Name", "Gender", "DOB", "BloodGroup", "Category", "AadharNumber",
      "Branch", "BatchYear", "AdmissionType", "10thScore", "12thScore", "PreviousSchool",
      "FatherName", "FatherOccupation", "MotherName", "MotherOccupation", "GuardianPhone", "GuardianEmail",
      "Phone", "Email", "EmergencyContact", "Address", "CityStatePin", "Accommodation", "BusRoute",
      "EnrollDate", "AttendanceStanding"
    ];

    var rows = state.students.map(function(s){
      var att = attendanceStats(s.rollNumber);
      return [
        '"' + (s.rollNumber || '') + '"',
        '"' + (s.name || '').replace(/"/g, '""') + '"',
        '"' + (s.gender || '') + '"',
        '"' + (s.dob || '') + '"',
        '"' + (s.bloodGroup || '') + '"',
        '"' + (s.category || '') + '"',
        '"' + (s.aadharNumber || '') + '"',
        '"' + (s.course || '') + '"',
        '"' + (s.batchYear || '') + '"',
        '"' + (s.admissionType || '') + '"',
        '"' + (s.percentage10 || '') + '"',
        '"' + (s.percentage12 || '') + '"',
        '"' + (s.previousSchool || '').replace(/"/g, '""') + '"',
        '"' + (s.fatherName || '').replace(/"/g, '""') + '"',
        '"' + (s.fatherOccupation || '').replace(/"/g, '""') + '"',
        '"' + (s.motherName || '').replace(/"/g, '""') + '"',
        '"' + (s.motherOccupation || '').replace(/"/g, '""') + '"',
        '"' + (s.guardianPhone || '') + '"',
        '"' + (s.guardianEmail || '') + '"',
        '"' + (s.phone || '') + '"',
        '"' + (s.email || '') + '"',
        '"' + (s.emergencyContact || '').replace(/"/g, '""') + '"',
        '"' + (s.address || '').replace(/"/g, '""') + '"',
        '"' + (s.cityStatePin || '').replace(/"/g, '""') + '"',
        '"' + (s.accommodation || '') + '"',
        '"' + (s.busRoute || '') + '"',
        '"' + (s.enrollDate || '') + '"',
        '"' + (att.pct !== null ? att.pct + "%" : "N/A") + '"'
      ].join(",");
    });

    return [headers.join(",")].concat(rows).join("\n");
  }

  var expStuBtn = document.getElementById("export-students-csv");
  if (expStuBtn) {
    expStuBtn.addEventListener("click", function(){
      if (!state.students.length) {
        showToast("No student records to export.", "error");
        return;
      }
      downloadCsv("RegEngine_Students_Master_Register.csv", generateStudentsCsv());
      showToast("Students register exported to CSV.");
    });
  }

  var expAttBtn = document.getElementById("export-att-csv");
  if (expAttBtn) {
    expAttBtn.addEventListener("click", function(){
      var headers = ["Branch", "Date", "RollNumber", "Present"];
      var rows = [];
      state.attendance.forEach(function(session){
        (session.records || []).forEach(function(r){
          rows.push([
            '"' + session.course + '"',
            '"' + session.date + '"',
            '"' + r.rollNumber + '"',
            r.present ? "1" : "0"
          ].join(","));
        });
      });
      downloadCsv("RegEngine_Attendance_Master.csv", [headers.join(",")].concat(rows).join("\n"));
      showToast("Attendance CSV exported.");
    });
  }

  var expFacBtn = document.getElementById("export-faculty-csv");
  if (expFacBtn) {
    expFacBtn.addEventListener("click", function(){
      var headers = ["Name", "Designation", "Department", "Subject", "Branch", "ExperienceYears", "Email", "Phone"];
      var rows = state.faculty.map(function(f){
        return [
          '"' + f.name.replace(/"/g, '""') + '"',
          '"' + f.designation + '"',
          '"' + f.department + '"',
          '"' + f.subject + '"',
          '"' + f.course + '"',
          '"' + f.experience + '"',
          '"' + f.email + '"',
          '"' + f.phone + '"'
        ].join(",");
      });
      downloadCsv("RegEngine_Faculty_Directory.csv", [headers.join(",")].concat(rows).join("\n"));
      showToast("Faculty directory exported.");
    });
  }

  var expJsonBtn = document.getElementById("export-json-backup");
  if (expJsonBtn) {
    expJsonBtn.addEventListener("click", function(){
      var backup = {
        exportedAt: new Date().toISOString(),
        students: state.students,
        faculty: state.faculty,
        attendance: state.attendance,
        courses: state.courses
      };
      var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "RegEngine_Database_Backup_" + new Date().toISOString().slice(0, 10) + ".json";
      link.click();
      playSuccessChime();
      showToast("Database JSON backup downloaded.");
    });
  }

  /* ================= Command Palette (Ctrl+K) ================= */
  var cmdModal = document.getElementById("cmd-palette-modal");
  var cmdInput = document.getElementById("cmd-input");
  var cmdResults = document.getElementById("cmd-results");
  var cmdActiveIdx = 0;

  function openCommandPalette() {
    if (!cmdModal) return;
    cmdModal.style.display = "flex";
    if (cmdInput) {
      cmdInput.value = "";
      cmdInput.focus();
    }
    cmdActiveIdx = 0;
    renderCmdResults("");
    playTone(600, "sine", 0.06);
  }

  function closeCommandPalette() {
    if (cmdModal) cmdModal.style.display = "none";
  }

  var cmdTriggerBtn = document.getElementById("cmd-trigger-btn");
  if (cmdTriggerBtn) cmdTriggerBtn.addEventListener("click", openCommandPalette);

  window.addEventListener("keydown", function(e){
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdModal.style.display === "flex") closeCommandPalette();
      else openCommandPalette();
    }
    if (e.key === "Escape" && cmdModal && cmdModal.style.display === "flex") {
      closeCommandPalette();
    }
  });

  if (cmdModal) {
    cmdModal.addEventListener("click", function(e){
      if (e.target.id === "cmd-palette-modal") closeCommandPalette();
    });
  }

  function renderCmdResults(q) {
    if (!cmdResults) return;
    q = (q || "").trim().toLowerCase();
    var items = [];

    var views = [
      { type: "view", id: "register", title: "New Student Registration Form", icon: "🎓", badge: "REGISTER" },
      { type: "view", id: "records", title: "View Student Records & Dossiers", icon: "🗂️", badge: "RECORDS" },
      { type: "view", id: "attendance", title: "Mark Daily Attendance", icon: "📋", badge: "ATTENDANCE" },
      { type: "view", id: "faculty", title: "Faculty & Staff Directory", icon: "👨‍🏫", badge: "FACULTY" },
      { type: "view", id: "courses", title: "Branch Seat Capacities", icon: "🏛️", badge: "BRANCHES" },
      { type: "view", id: "export", title: "Data Center & CSV Exports", icon: "📥", badge: "EXPORTS" }
    ];

    views.forEach(function(v){
      if (!q || v.title.toLowerCase().indexOf(q) > -1) items.push(v);
    });

    state.students.forEach(function(s){
      if (!q || s.name.toLowerCase().indexOf(q) > -1 || s.rollNumber.toLowerCase().indexOf(q) > -1) {
        items.push({
          type: "student",
          student: s,
          title: s.name + " (" + s.rollNumber + ")",
          icon: "👤",
          badge: s.course
        });
      }
    });

    state.faculty.forEach(function(f){
      if (!q || f.name.toLowerCase().indexOf(q) > -1 || f.department.toLowerCase().indexOf(q) > -1) {
        items.push({
          type: "faculty",
          faculty: f,
          title: f.name + " — " + f.designation,
          icon: "👨‍🏫",
          badge: f.department
        });
      }
    });

    if (!items.length) {
      cmdResults.innerHTML = '<div style="padding:24px; text-align:center; color:#64748B;">No matches found for "' + esc(q) + '"</div>';
      return;
    }

    cmdResults.innerHTML = items.slice(0, 8).map(function(item, idx){
      return '<div class="cmd-item ' + (idx === cmdActiveIdx ? 'active' : '') + '" data-idx="' + idx + '">' +
        '<div class="cmd-item-left">' +
          '<span style="font-size:16px;">' + item.icon + '</span>' +
          '<span>' + esc(item.title) + '</span>' +
        '</div>' +
        '<span class="cmd-badge">' + esc(item.badge) + '</span>' +
      '</div>';
    }).join("");

    cmdResults.querySelectorAll(".cmd-item").forEach(function(el){
      el.addEventListener("click", function(){
        var idx = parseInt(el.getAttribute("data-idx"), 10);
        executeCmdItem(items[idx]);
      });
    });
  }

  function executeCmdItem(item) {
    if (!item) return;
    closeCommandPalette();
    if (item.type === "view") {
      switchView(item.id);
    } else if (item.type === "student") {
      openDossierModal(item.student);
    } else if (item.type === "faculty") {
      switchView("faculty");
    }
  }

  if (cmdInput) {
    cmdInput.addEventListener("input", function(e){
      cmdActiveIdx = 0;
      renderCmdResults(e.target.value);
    });

    cmdInput.addEventListener("keydown", function(e){
      var items = cmdResults.querySelectorAll(".cmd-item");
      if (!items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        cmdActiveIdx = (cmdActiveIdx + 1) % items.length;
        renderCmdResults(cmdInput.value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        cmdActiveIdx = (cmdActiveIdx - 1 + items.length) % items.length;
        renderCmdResults(cmdInput.value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var selected = items[cmdActiveIdx];
        if (selected) selected.click();
      }
    });
  }

  /* ================= 1. Academic Timetable Controller ================= */
  function renderTimetable() {
    var sel = document.getElementById("tt-course-select");
    if (sel && !sel.children.length) {
      COURSES.forEach(function(c){
        var opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = c.name + " (" + c.code + ")";
        sel.appendChild(opt);
      });
      sel.value = state.activeTimetableCourse;
      sel.addEventListener("change", function(){
        state.activeTimetableCourse = sel.value;
        renderTimetableSlots();
      });
    }

    var dayTabs = document.getElementById("tt-day-tabs");
    if (dayTabs && !dayTabs.dataset.bound) {
      dayTabs.dataset.bound = "true";
      dayTabs.querySelectorAll(".tt-day-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
          dayTabs.querySelectorAll(".tt-day-btn").forEach(function(b){ b.classList.remove("active"); });
          btn.classList.add("active");
          state.activeTimetableDay = btn.getAttribute("data-day");
          renderTimetableSlots();
        });
      });
    }

    var printBtn = document.getElementById("print-tt-btn");
    if (printBtn && !printBtn.dataset.bound) {
      printBtn.dataset.bound = "true";
      printBtn.addEventListener("click", function(){ window.print(); });
    }

    renderTimetableSlots();
  }

  function renderTimetableSlots() {
    var mount = document.getElementById("tt-slots-mount");
    if (!mount) return;

    var day = state.activeTimetableDay || "Monday";
    var course = state.activeTimetableCourse || "CSE-CORE";

    var slots = state.timetable.filter(function(t){
      return t.day === day && (t.courseCode === course || t.courseCode === "CSE-CORE");
    });

    if (!slots.length) {
      mount.innerHTML = '<div style="grid-column:1/-1; padding:32px; text-align:center; color:#64748B; background:#F8FAFC; border-radius:12px;">No lectures scheduled for ' + esc(day) + '.</div>';
      return;
    }

    mount.innerHTML = slots.map(function(s){
      var isLab = s.type && s.type.toLowerCase() === "lab";
      return '<div class="timetable-card ' + (isLab ? 'lab-card' : '') + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<span class="slot-time-badge">⏰ ' + esc(s.timeSlot) + '</span>' +
            '<span class="slot-room-tag">🏛️ ' + esc(s.roomNo) + '</span>' +
          '</div>' +
          '<h3 style="font-size:15px; font-weight:800; color:#0F172A; margin:0 0 4px;">' + esc(s.subjectName) + '</h3>' +
          '<div style="font-family:var(--font-mono); font-size:11.5px; color:#2563EB; font-weight:600; margin-bottom:8px;">' + esc(s.subjectCode) + ' · ' + esc(s.type) + '</div>' +
        '</div>' +
        '<div style="border-top:1px solid rgba(0,0,0,0.06); padding-top:8px; font-size:12px; color:#475569; display:flex; align-items:center; gap:6px;">' +
          '<span>👨‍🏫</span> <strong>' + esc(s.facultyName) + '</strong>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  /* ================= 2. Academic Calendar Controller ================= */
  function renderCalendar() {
    var filterBar = document.getElementById("cal-filter-bar");
    if (filterBar && !filterBar.dataset.bound) {
      filterBar.dataset.bound = "true";
      filterBar.querySelectorAll("button").forEach(function(btn){
        btn.addEventListener("click", function(){
          filterBar.querySelectorAll("button").forEach(function(b){ b.classList.remove("active"); });
          btn.classList.add("active");
          state.activeCalendarFilter = btn.getAttribute("data-calcat");
          renderCalendarEvents();
        });
      });
    }
    renderCalendarEvents();
  }

  function renderCalendarEvents() {
    var mount = document.getElementById("cal-events-mount");
    if (!mount) return;

    var filter = state.activeCalendarFilter || "all";
    var events = state.calendar.filter(function(e){
      return filter === "all" || e.category === filter;
    });

    if (!events.length) {
      mount.innerHTML = '<div style="grid-column:1/-1; padding:32px; text-align:center; color:#64748B; background:#F8FAFC; border-radius:12px;">No calendar milestones found for this filter.</div>';
      return;
    }

    var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    mount.innerHTML = events.map(function(ev){
      var parts = (ev.startDate || "2026-08-01").split("-");
      var monthIdx = parseInt(parts[1], 10) - 1;
      var monthStr = monthNames[monthIdx] || "AUG";
      var dayStr = parts[2] || "01";

      var badgeClass = ev.category === "Examination" ? "badge-danger" : ev.category === "Holiday" ? "badge-gold" : "badge-primary";

      return '<div class="calendar-event-card">' +
        '<div class="cal-date-badge">' +
          '<div class="day">' + esc(dayStr) + '</div>' +
          '<div class="month">' + esc(monthStr) + '</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; gap:8px;">' +
            '<span class="badge ' + badgeClass + '" style="font-size:10px; font-weight:700;">' + esc(ev.category.toUpperCase()) + '</span>' +
            '<span style="font-size:11px; color:#64748B; font-weight:600;">' + esc(ev.semester) + '</span>' +
          '</div>' +
          '<h3 style="font-size:15px; font-weight:800; color:#0F172A; margin:0 0 6px;">' + esc(ev.title) + '</h3>' +
          '<p style="font-size:12.5px; color:#64748B; line-height:1.5; margin:0 0 8px;">' + esc(ev.description) + '</p>' +
          '<div style="font-size:11.5px; color:#475569;">📍 ' + esc(ev.location) + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  /* ================= 3. Course Curriculum & Syllabus ================= */
  function renderCurriculum() {
    var sel = document.getElementById("syllabus-course-select");
    if (sel && !sel.children.length) {
      state.curriculum.forEach(function(c){
        var opt = document.createElement("option");
        opt.value = c.courseCode;
        opt.textContent = c.courseTitle;
        sel.appendChild(opt);
      });
      sel.value = state.activeSyllabusCourse;
      sel.addEventListener("change", function(){
        state.activeSyllabusCourse = sel.value;
        renderCurriculumContent();
      });
    }
    renderCurriculumContent();
  }

  function renderCurriculumContent() {
    var mount = document.getElementById("syllabus-content-mount");
    if (!mount) return;

    var cur = state.curriculum.find(function(c){ return c.courseCode === state.activeSyllabusCourse; }) || state.curriculum[0];
    if (!cur) {
      mount.innerHTML = '<div style="padding:24px; color:#64748B;">Curriculum data loading...</div>';
      return;
    }

    var html = '<div style="background:#F8FAFC; border:1px solid var(--border-medium); border-radius:12px; padding:20px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">' +
      '<div>' +
        '<h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0 0 4px;">' + esc(cur.courseTitle) + '</h3>' +
        '<div style="font-size:12.5px; color:#64748B;">Programme Duration: <strong>' + esc(cur.duration) + '</strong> · Total Graduation Credits: <strong>' + esc(cur.totalCredits) + '</strong></div>' +
      '</div>' +
      '<span class="badge badge-emerald" style="font-size:12px; font-weight:700;">NAAC A++ ACCREDITED</span>' +
    '</div>';

    html += '<div style="display:flex; flex-direction:column; gap:16px;">';
    (cur.subjects || []).forEach(function(sub){
      html += '<div class="card" style="padding:20px; background:#FFFFFF; border:1px solid var(--border-medium);">' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">' +
          '<div>' +
            '<span class="badge badge-primary" style="font-family:var(--font-mono); font-size:11px; margin-right:8px;">' + esc(sub.code) + '</span>' +
            '<strong style="font-size:15px; color:#0F172A;">' + esc(sub.title) + '</strong>' +
          '</div>' +
          '<div style="display:flex; gap:8px; align-items:center;">' +
            '<span style="background:#EFF6FF; color:#1E3A8A; font-family:var(--font-mono); font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:4px;">L-T-P-C: ' + esc(sub.structure) + '</span>' +
            '<span style="font-size:11.5px; color:#64748B; font-weight:600;">' + esc(sub.semester) + '</span>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:13px; color:#475569; line-height:1.5; margin:0 0 12px;">' + esc(sub.description) + '</p>' +
        '<details style="background:#F8FAFC; border:1px solid var(--border-subtle); border-radius:8px; padding:10px 14px; margin-bottom:10px;">' +
          '<summary style="font-weight:700; font-size:12.5px; color:#1E3A8A; cursor:pointer;">📖 View 5-Unit Detailed Module Breakdown</summary>' +
          '<ul style="margin:10px 0 0; padding-left:20px; font-size:12.5px; color:#334155; line-height:1.7;">' +
            (sub.units || []).map(function(u){ return '<li>' + esc(u) + '</li>'; }).join("") +
          '</ul>' +
        '</details>' +
        '<div style="font-size:12px; color:#64748B;"><strong>Prescribed Textbooks:</strong> ' + esc(sub.textbooks) + '</div>' +
      '</div>';
    });
    html += '</div>';

    mount.innerHTML = html;
  }

  /* ================= 4. Campus Notices & Circulars ================= */
  function renderNotices() {
    var pills = document.getElementById("notice-filter-pills");
    if (pills && !pills.dataset.bound) {
      pills.dataset.bound = "true";
      pills.querySelectorAll("button").forEach(function(btn){
        btn.addEventListener("click", function(){
          pills.querySelectorAll("button").forEach(function(b){ b.classList.remove("active"); });
          btn.classList.add("active");
          state.activeNoticeFilter = btn.getAttribute("data-notcat");
          renderNoticesFeed();
        });
      });
    }
    renderNoticesFeed();
  }

  function renderNoticesFeed() {
    var mount = document.getElementById("notices-list-mount");
    if (!mount) return;

    var filter = state.activeNoticeFilter || "all";
    var notices = state.notices.filter(function(n){
      return filter === "all" || n.category === filter;
    });

    if (!notices.length) {
      mount.innerHTML = '<div style="padding:32px; text-align:center; color:#64748B; background:#F8FAFC; border-radius:12px;">No campus circulars found for this category.</div>';
      return;
    }

    mount.innerHTML = notices.map(function(n, idx){
      var isUrgent = n.priority && n.priority.toLowerCase() === "urgent";
      return '<div class="notice-item-card" data-idx="' + idx + '">' +
        '<div style="flex:1;">' +
          '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">' +
            '<span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:#1E3A8A; background:#DBEAFE; padding:2px 7px; border-radius:4px;">' + esc(n.refNumber) + '</span>' +
            '<span class="badge ' + (isUrgent ? 'badge-danger' : 'badge-primary') + '" style="font-size:10.5px;">' + esc(n.category) + '</span>' +
            (isUrgent ? '<span class="notice-priority-urgent">🔴 URGENT</span>' : '') +
            '<span style="font-size:11.5px; color:#64748B; margin-left:auto;">📅 ' + esc(n.publishDate) + '</span>' +
          '</div>' +
          '<h3 style="font-size:15.5px; font-weight:800; color:#0F172A; margin:0 0 6px;">' + esc(n.title) + '</h3>' +
          '<p style="font-size:13px; color:#64748B; line-height:1.5; margin:0 0 8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">' + esc(n.content) + '</p>' +
          '<div style="font-size:11.5px; color:#475569;">🏛️ <strong>' + esc(n.author) + '</strong> (' + esc(n.department) + ')</div>' +
        '</div>' +
        '<div style="font-size:18px; color:#1E3A8A;">→</div>' +
      '</div>';
    }).join("");

    mount.querySelectorAll(".notice-item-card").forEach(function(card){
      card.addEventListener("click", function(){
        var idx = parseInt(card.getAttribute("data-idx"), 10);
        openNoticeModal(notices[idx]);
      });
    });
  }

  function openNoticeModal(notice) {
    if (!notice) return;
    var root = document.getElementById("modal-root");
    root.innerHTML =
      '<div class="modal-overlay" id="notice-view-overlay">' +
        '<div class="official-circular-modal">' +
          '<div class="circular-modal-head">' +
            '<div class="circular-seal">SRMIST OFFICIAL NOTICE · NCR CAMPUS</div>' +
            '<h2 style="font-size:18px; font-weight:800; margin:0 0 6px;">' + esc(notice.title) + '</h2>' +
            '<div style="font-size:12px; color:#DBEAFE; font-family:var(--font-mono);">Ref: ' + esc(notice.refNumber) + ' · Date: ' + esc(notice.publishDate) + '</div>' +
            '<button class="modal-close" id="notice-modal-close" style="position:absolute; top:18px; right:18px; color:#FFF;">✕</button>' +
          '</div>' +
          '<div class="circular-modal-body">' +
            '<div style="font-size:12.5px; color:#1E3A8A; font-weight:700; margin-bottom:14px; text-transform:uppercase;">Issuing Authority: ' + esc(notice.author) + ' (' + esc(notice.department) + ')</div>' +
            '<div style="white-space:pre-wrap; line-height:1.7; color:#334155; margin-bottom:24px;">' + esc(notice.content) + '</div>' +
            (notice.attachmentUrl ? '<a href="' + esc(notice.attachmentUrl) + '" target="_blank" class="btn btn-sm btn-primary" style="margin-bottom:20px; background:#1E3A8A; border-color:#1E3A8A;">📥 Open Official Circular Attachment</a>' : '') +
            '<div style="border-top:1px solid #E2E8F0; padding-top:16px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#64748B;">' +
              '<div>Authenticated by SRMIST Registrar Secretariat</div>' +
              '<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print Notice</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector("#notice-modal-close").addEventListener("click", closeModal);
    root.querySelector("#notice-view-overlay").addEventListener("click", function(e){
      if (e.target.id === "notice-view-overlay") closeModal();
    });
  }

  function initNoticePublisher() {
    var form = document.getElementById("notice-publish-form");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "true";

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var title = document.getElementById("notpub-title").value.trim();
      var category = document.getElementById("notpub-category").value;
      var priority = document.getElementById("notpub-priority").value;
      var author = document.getElementById("notpub-author").value.trim();
      var dept = document.getElementById("notpub-dept").value.trim();
      var content = document.getElementById("notpub-content").value.trim();
      var attach = document.getElementById("notpub-attach").value.trim();

      if (!title || !content) {
        showToast("Please fill in circular title and body content", "error");
        return;
      }

      apiPost("/notices", {
        title: title,
        category: category,
        priority: priority,
        author: author,
        department: dept,
        content: content,
        attachmentUrl: attach
      }).then(function(newNotice){
        state.notices.unshift(newNotice);
        showToast("Official Circular Published Successfully!");
        triggerConfetti();
        form.reset();
        switchView("notices");
      }).catch(function(err){
        showToast("Publishing Failed: " + err.message, "error");
      });
    });
  }

  /* ================= Initialization Boot ================= */
  function bootPortal() {
    var params = new URLSearchParams(window.location.search);
    var reqMode = params.get("mode");
    var reqView = params.get("view");

    if (reqMode === "management" || (reqMode !== "student" && state.authFaculty)) {
      setPortalMode("management", reqView || "dashboard");
    } else {
      setPortalMode("student", reqView || "register");
    }
  }

  refreshAll().then(function(){
    bootPortal();
  }).catch(function(){
    bootPortal();
  });

  setInterval(function(){
    apiGet("/dashboard").then(function(d){
      state.dashboard = d;
      var dashView = document.getElementById("view-dashboard");
      if (dashView && dashView.classList.contains("active")) {
        renderDashboard();
      }
    }).catch(function(){});
  }, 15000);
})();
