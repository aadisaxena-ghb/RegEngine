/**
 * RegEngine — Campus Registration & Student Information System
 * Comprehensive frontend application controller with multi-page registration wizard,
 * paginated student dossiers, cryptographic ID badges, attendance monitor, and exports.
 */
(function(){
  "use strict";

  var API = window.SCHOLARIS_API_BASE || "/api";

  /* ================= Academic Disciplines Catalog ================= */
  var COURSES = [
    { code: "CSE-CORE", name: "B.Tech Computer Science & Engineering (Core)", capacity: 120 },
    { code: "CSE-AIML", name: "B.Tech CSE (AI & Machine Learning)", capacity: 80 },
    { code: "CSE-DS",   name: "B.Tech CSE (Data Science & Analytics)", capacity: 60 },
    { code: "ECE",      name: "B.Tech Electronics & Communication Engineering", capacity: 90 }
  ];

  function courseByCode(c) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].code === c) return COURSES[i];
    }
    return { code: c, name: c, capacity: 100 };
  }

  /* ================= Application State ================= */
  var state = {
    students: [],
    faculty: [],
    attendance: [],
    courses: [],
    dashboard: null,
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
      apiGet("/dashboard")
    ]).then(function(results){
      state.students = results[0] || [];
      state.faculty = results[1] || [];
      state.attendance = results[2] || [];
      state.courses = results[3] || [];
      state.dashboard = results[4] || null;

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
                    '<div><div class="k">Branch</div><div class="v">' + esc(course.name) + '</div></div>' +
                    '<div><div class="k">Batch / Year</div><div class="v">' + esc(student.batchYear || "2026–2030") + '</div></div>' +
                    '<div><div class="k">Blood Group</div><div class="v">' + esc(student.bloodGroup || "O+") + '</div></div>' +
                    '<div><div class="k">Emergency Phone</div><div class="v mono">' + esc(student.emergencyContact || student.phone || "—") + '</div></div>' +
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
                '<div><span style="color:#64748B;">Admission Type:</span> <strong>' + esc(student.admissionType || 'Merit Allotment') + '</strong></div>' +
                '<div><span style="color:#64748B;">10th Score:</span> <strong>' + (student.percentage10 ? student.percentage10 + "%" : '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">12th / Qualifying Score:</span> <strong>' + (student.percentage12 ? student.percentage12 + "%" : '—') + '</strong></div>' +
                '<div><span style="color:#64748B;">Previous Institution:</span> <strong>' + esc(student.previousSchool || '—') + '</strong></div>' +
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

  /* ================= Navigation View Router ================= */
  var VIEW_META = {
    register:   { title: "Student Registration", meta: "Comprehensive multi-page student admission and registration form" },
    records:    { title: "Student Records & Dossiers", meta: "Official university register, search, branch filters, and ID badges" },
    dashboard:  { title: "Executive Dashboard", meta: "Branch intake capacity, enrolment metrics, and telemetry ledger" },
    attendance: { title: "Daily Cohort Attendance", meta: "1-tap class roster check-in and 75% statutory attendance monitor" },
    faculty:    { title: "Faculty & Staff Directory", meta: "Teaching staff allocations, professorships, and department directory" },
    courses:    { title: "Branch Seat Quotas", meta: "Intake capacity and remaining available seats per engineering stream" },
    export:     { title: "Data Center & Reports", meta: "Download CSV rosters, attendance ledgers, and raw JSON database backups" }
  };

  function switchView(viewName) {
    document.querySelectorAll(".view-pane").forEach(function(el){ el.classList.remove("active"); });
    var targetPane = document.getElementById("view-" + viewName);
    if (targetPane) targetPane.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(function(el){
      el.classList.toggle("active", el.getAttribute("data-view") === viewName);
    });

    var titleEl = document.getElementById("view-title");
    var metaEl = document.getElementById("view-meta");
    if (titleEl && VIEW_META[viewName]) titleEl.textContent = VIEW_META[viewName].title;
    if (metaEl && VIEW_META[viewName]) metaEl.textContent = VIEW_META[viewName].meta;

    playTone(500, "sine", 0.05);

    if (viewName === "register") initRegistrationForm();
    if (viewName === "records") renderRecords();
    if (viewName === "dashboard") renderDashboard();
    if (viewName === "attendance") renderAttendance();
    if (viewName === "faculty") renderFaculty();
    if (viewName === "courses") renderCourses();
  }

  document.getElementById("app-nav").addEventListener("click", function(e){
    var btn = e.target.closest(".nav-item");
    if (!btn) return;
    switchView(btn.getAttribute("data-view"));
  });

  document.querySelectorAll("[data-quick]").forEach(function(el){
    el.addEventListener("click", function(){
      switchView(el.getAttribute("data-quick"));
    });
  });

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
          name: "Aadi Kulkarni", gender: "Male", dob: "2006-04-14", blood: "O+", cat: "General",
          aadhar: "5482 9102 3841", roll: "26CS101", batch: "2026–2030", c: "CSE-CORE",
          admtype: "State Merit (KCET/MHT-CET)", p10: "94.2", p12: "96.5", school: "National Public School, Bengaluru",
          father: "Suresh Kulkarni", fathocc: "Lead Solutions Architect", mother: "Meera Kulkarni", mothocc: "Professor of Chemistry",
          gphone: "98450 12345", gemail: "suresh.k@gmail.com", phone: "98765 43210", email: "aadi.kulkarni@regengine.edu",
          emerg: "Suresh Kulkarni (Father) - 98450 12345", address: "Flat 402, Oakwood Enclave, Outer Ring Road",
          city: "Bengaluru, Karnataka - 560064", accom: "Day Scholar", bus: "College Bus Route 1 (City Center)"
        },
        {
          name: "Sneha Sundaram", gender: "Female", dob: "2006-08-22", blood: "A+", cat: "OBC",
          aadhar: "8721 3491 8023", roll: "26AI204", batch: "2026–2030", c: "CSE-AIML",
          admtype: "National Entrance (JEE Main)", p10: "96.0", p12: "97.8", school: "Delhi Public School, R.K. Puram",
          father: "Venkatesh Sundaram", fathocc: "Senior VP Engineering", mother: "Geetha Sundaram", mothocc: "Chartered Accountant",
          gphone: "99880 54321", gemail: "venkat.s@gmail.com", phone: "99123 45678", email: "sneha.s@regengine.edu",
          emerg: "Venkatesh S (Father) - 99880 54321", address: "Plot 18, 5th Main, Indiranagar",
          city: "Bengaluru, Karnataka - 560038", accom: "Campus Hostel (AC Room)", bus: "None / Own Vehicle"
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
          '<div style="font-size:11px; color:#64748B;">' + (s.gender ? s.gender + ' · ' : '') + (s.category || 'General') + '</div>' +
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
    date: new Date().toISOString().slice(0, 10),
    draft: {}
  };

  function renderAttendance() {
    var progSelect = document.getElementById("att-prog-select");
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

    var roster = state.students.filter(function(s){ return s.course === attState.course; });
    var existingSession = state.attendance.find(function(s){ return s.course === attState.course && s.date === attState.date; });

    if (!roster.length) {
      host.innerHTML = '<div class="empty-banner" style="padding:32px;">' +
        '<div class="icon">📋</div>' +
        '<h3>No Students Enrolled in this Branch</h3>' +
        '<p>Register students into this branch to take daily attendance.</p>' +
      '</div>';
      return;
    }

    roster.forEach(function(s){
      if (!attState.draft.hasOwnProperty(s.rollNumber)) {
        if (existingSession) {
          var rec = existingSession.records.find(function(r){ return r.rollNumber === s.rollNumber; });
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
          '<div style="font-weight:700; font-size:13.5px; color:#0F172A;">' + esc(s.name) + '</div>' +
          '<div class="mono" style="font-size:11.5px; color:#64748B;">' + esc(s.rollNumber) + '</div>' +
        '</div>' +
        '<div style="display:flex; gap:6px;">' +
          '<button class="btn btn-sm ' + (isPresent ? 'btn-emerald' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="1">✓ Present</button>' +
          '<button class="btn btn-sm ' + (!isPresent ? 'btn-danger' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="0">✗ Absent</button>' +
        '</div>' +
      '</div>';
    }).join("");

    host.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">' +
        '<span style="font-size:12.5px; font-weight:700; color:#64748B; text-transform:uppercase;">Class Roster (' + roster.length + ' Students)</span>' +
        '<div style="display:flex; gap:8px;">' +
          '<button class="btn btn-sm btn-ghost" id="att-all-present">All Present</button>' +
          '<button class="btn btn-sm btn-ghost" id="att-all-absent">All Absent</button>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:360px; overflow-y:auto; padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:18px; display:flex; justify-content:flex-end;">' +
        '<button class="btn btn-primary btn-lg" id="save-attendance-btn" style="background:#1E3A8A; border-color:#1E3A8A;">' +
          '<span>Save Attendance Record</span>' +
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
          date: attState.date,
          records: records
        }).then(function(){
          if (pct === 100) triggerConfetti();
          showToast("Attendance saved — " + presentCount + " of " + records.length + " present.");
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

  /* ================= Initialization Boot ================= */
  refreshAll().then(function(){
    initRegistrationForm();
    renderRecords();
    renderDashboard();
    renderAttendance();
    renderFaculty();
    renderCourses();
  }).catch(function(){
    initRegistrationForm();
  });

  setInterval(function(){
    apiGet("/dashboard").then(function(d){
      state.dashboard = d;
      if (document.getElementById("view-dashboard").classList.contains("active")) {
        renderDashboard();
      }
    }).catch(function(){});
  }, 15000);
})();
