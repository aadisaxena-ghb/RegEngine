/**
 * Scholaris — Enterprise Academic Registrar & Student Information Platform
 * Comprehensive frontend application state engine & interactive controllers
 */
(function(){
  "use strict";

  var API = window.SCHOLARIS_API_BASE || "/api";

  /* ================= Constants & Catalog ================= */
  var COURSES = [
    { code: "CSE-CORE", name: "B.Tech CSE Core", capacity: 120 },
    { code: "CSE-AIML", name: "B.Tech CSE AIML", capacity: 80 },
    { code: "CSE-DS",   name: "B.Tech CSE Data Science", capacity: 60 },
    { code: "ECE",      name: "B.Tech ECE", capacity: 90 }
  ];

  function courseByCode(c) {
    for (var i = 0; i < COURSES.length; i++) {
      if (COURSES[i].code === c) return COURSES[i];
    }
    return { code: c, name: c, capacity: 100 };
  }

  /* ================= State Management ================= */
  var state = {
    students: [],
    faculty: [],
    attendance: [],
    courses: [],
    dashboard: null,
    selectedRows: new Set()
  };

  /* ================= Web Audio SFX Engine ================= */
  var audioCtx = null;
  var soundEnabled = localStorage.getItem("scholaris_sfx") !== "false";

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

  /* SFX & Theme UI Controls */
  var appSoundBtn = document.getElementById("app-sound-btn");
  if (appSoundBtn) {
    function updateAppSoundBtn() {
      appSoundBtn.querySelector(".audio-bars").classList.toggle("playing", soundEnabled);
      appSoundBtn.style.opacity = soundEnabled ? "1" : "0.6";
    }
    updateAppSoundBtn();
    appSoundBtn.addEventListener("click", function(){
      soundEnabled = !soundEnabled;
      localStorage.setItem("scholaris_sfx", soundEnabled ? "true" : "false");
      updateAppSoundBtn();
      if (soundEnabled) playSuccessChime();
    });
  }

  var currentTheme = localStorage.getItem("scholaris_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  var appThemeBtn = document.getElementById("app-theme-btn");
  var appSun = document.getElementById("app-theme-sun");
  var appMoon = document.getElementById("app-theme-moon");

  function updateThemeUI() {
    if (currentTheme === "light") {
      if (appSun) appSun.style.display = "block";
      if (appMoon) appMoon.style.display = "none";
    } else {
      if (appSun) appSun.style.display = "none";
      if (appMoon) appMoon.style.display = "block";
    }
  }
  updateThemeUI();

  if (appThemeBtn) {
    appThemeBtn.addEventListener("click", function(){
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", currentTheme);
      localStorage.setItem("scholaris_theme", currentTheme);
      updateThemeUI();
      playTone(580, "sine", 0.08);
    });
  }

  /* ================= API Client & Telemetry ================= */
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
          throw new Error("Server returned non-JSON response: " + raw.slice(0, 80));
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

  function setStatus(ok) {
    var dot = document.getElementById("status-dot");
    var text = document.getElementById("status-text");
    if (dot) dot.className = "dot" + (ok ? "" : " off");
    if (text) text.textContent = ok ? "Live API Connected" : "API Offline";
  }

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

      setStatus(true);
      updateBadges();
      return state;
    }).catch(function(e){
      setStatus(false);
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
    var colors = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#FDE68A"];

    for (var i = 0; i < 80; i++) {
      pieces.push({
        x: w / 2,
        y: h / 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 8 + 4,
        dx: (Math.random() - 0.5) * 14,
        dy: (Math.random() - 0.7) * 16,
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

  /* ================= Modal Helpers ================= */
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
    var attText = att.pct !== null ? att.pct + "% SAFE" : "NEW ADMIT";
    if (att.pct !== null && att.pct < 75) attText = att.pct + "% CRITICAL";

    root.innerHTML =
      '<div class="modal-overlay" id="idcard-modal-overlay">' +
        '<div class="modal-window" style="max-width:480px; background:var(--bg-surface);">' +
          '<div class="modal-header">' +
            '<h3>Cryptographic Student ID Badge</h3>' +
            '<button class="modal-close" id="idcard-modal-close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="idcard-perspective-wrap" id="modal-card-wrap">' +
              '<div class="idcard-3d" id="modal-holo-card">' +
                '<div class="idcard-holo-sheen"></div>' +
                '<div class="idcard-top-stripe"></div>' +
                '<div class="idcard-head">' +
                  '<div class="idcard-inst-brand">' +
                    '<div class="idcard-seal">S</div>' +
                    '<div>' +
                      '<div class="idcard-inst-name">Scholaris Institute</div>' +
                      '<div class="idcard-inst-sub">Verified Student Identity</div>' +
                    '</div>' +
                  '</div>' +
                  '<span class="badge badge-gold">VERIFIED</span>' +
                '</div>' +
                '<div class="idcard-body">' +
                  '<div class="idcard-profile-row">' +
                    '<div class="idcard-avatar">' + initials(student.name) + '</div>' +
                    '<div>' +
                      '<div class="idcard-name-title">' + esc(student.name) + '</div>' +
                      '<div class="idcard-roll-badge">' + esc(student.rollNumber) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="idcard-grid">' +
                    '<div><div class="k">Programme</div><div class="v">' + esc(course.name) + '</div></div>' +
                    '<div><div class="k">Father\'s Name</div><div class="v">' + esc(student.fatherName || "—") + '</div></div>' +
                    '<div><div class="k">Phone</div><div class="v mono">' + esc(student.phone || "—") + '</div></div>' +
                    '<div><div class="k">12th Percentage</div><div class="v">' + (student.percentage12 ? student.percentage12 + "%" : "—") + '</div></div>' +
                    '<div><div class="k">Mother\'s Name</div><div class="v">' + esc(student.motherName || "—") + '</div></div>' +
                    '<div><div class="k">Enrolment Date</div><div class="v">' + new Date(student.enrollDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + '</div></div>' +
                  '</div>' +
                  '<div style="margin-top:10px; background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">' +
                    '<div class="k" style="font-size:9.5px; color:#94A3B8; text-transform:uppercase;">Permanent Address</div>' +
                    '<div style="font-size:11.5px; color:#E2E8F0; margin-top:2px;">' + esc(student.address || "—") + '</div>' +
                  '</div>' +
                  '<div class="idcard-qr-section">' +
                    '<div class="idcard-qr-box" id="modal-qr-mount"></div>' +
                    '<div class="idcard-meta-right">' +
                      '<div style="font-size:10px; color:#94A3B8;">ATTENDANCE ON RECORD</div>' +
                      '<div class="idcard-att-badge">' + attText + '</div>' +
                      '<div class="idcard-sig">Registrar Signature ✍️</div>' +
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
            '<button class="btn btn-gold" id="idcard-modal-close-btn">Done</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Mount QR code
    var qrMount = root.querySelector("#modal-qr-mount");
    if (qrMount && window.QRCode) {
      new window.QRCode(qrMount, {
        text: "https://scholaris.edu/verify/" + student.rollNumber,
        width: 64,
        height: 64,
        colorDark: "#090D14",
        colorLight: "#FFFFFF"
      });
    }

    // 3D Parallax Tilt
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

  /* ================= Student Academic Dossier Modal ================= */
  function openDossierModal(student) {
    var root = document.getElementById("modal-root");
    var course = courseByCode(student.course);
    var att = attendanceStats(student.rollNumber);

    root.innerHTML =
      '<div class="modal-overlay" id="dossier-overlay">' +
        '<div class="modal-window" style="max-width:540px;">' +
          '<div class="modal-header">' +
            '<h3>Student Academic Dossier</h3>' +
            '<button class="modal-close" id="dossier-close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">' +
              '<div style="width:58px; height:58px; border-radius:12px; background:linear-gradient(135deg, var(--accent-emerald), #059669); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800;">' + initials(student.name) + '</div>' +
              '<div>' +
                '<h2 style="font-size:20px; font-weight:800;">' + esc(student.name) + '</h2>' +
                '<div style="display:flex; gap:8px; margin-top:4px;">' +
                  '<span class="badge course-' + student.course + '">' + esc(course.name) + '</span>' +
                  '<span class="badge badge-gold mono">' + esc(student.rollNumber) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">' +
              '<div class="card" style="padding:14px; background:var(--bg-surface-elevated);">' +
                '<div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Attendance Standing</div>' +
                '<div style="font-size:22px; font-weight:800; color:' + (att.pct < 75 ? 'var(--accent-rose)' : 'var(--accent-emerald)') + '; margin-top:2px;">' + (att.pct !== null ? att.pct + "%" : "No Sessions") + '</div>' +
                '<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">' + att.present + ' of ' + att.total + ' sessions attended</div>' +
              '</div>' +

              '<div class="card" style="padding:14px; background:var(--bg-surface-elevated);">' +
                '<div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">12th Merit Score</div>' +
                '<div style="font-size:22px; font-weight:800; color:var(--accent-gold); margin-top:2px;">' + (student.percentage12 ? student.percentage12 + "%" : "—") + '</div>' +
                '<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Qualifying Grade</div>' +
              '</div>' +
            '</div>' +

            '<div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">' +
              '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle);">' +
                '<span style="color:var(--text-muted);">Father\'s Name</span>' +
                '<strong>' + esc(student.fatherName || "—") + '</strong>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle);">' +
                '<span style="color:var(--text-muted);">Mother\'s Name</span>' +
                '<strong>' + esc(student.motherName || "—") + '</strong>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle);">' +
                '<span style="color:var(--text-muted);">Phone Number</span>' +
                '<strong class="mono">' + esc(student.phone || "—") + '</strong>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle);">' +
                '<span style="color:var(--text-muted);">Permanent Address</span>' +
                '<strong style="text-align:right; max-width:280px;">' + esc(student.address || "—") + '</strong>' +
              '</div>' +
              '<div style="display:flex; justify-content:space-between; padding:8px 0;">' +
                '<span style="color:var(--text-muted);">Enrolment Timestamp</span>' +
                '<span class="mono">' + new Date(student.enrollDate).toLocaleString() + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="dossier-idcard-btn">✨ Generate 3D ID Badge</button>' +
            '<button class="btn btn-primary" id="dossier-done-btn">Close</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector("#dossier-close").addEventListener("click", closeModal);
    root.querySelector("#dossier-done-btn").addEventListener("click", closeModal);
    root.querySelector("#dossier-overlay").addEventListener("click", function(e){
      if (e.target.id === "dossier-overlay") closeModal();
    });
    root.querySelector("#dossier-idcard-btn").addEventListener("click", function(){
      closeModal();
      openIdCardModal(student);
    });
  }

  /* ================= Defaulters Official Warning Notice Modal ================= */
  function openDefaulterWarningModal(student) {
    var root = document.getElementById("modal-root");
    var att = attendanceStats(student.rollNumber);
    var course = courseByCode(student.course);

    root.innerHTML =
      '<div class="modal-overlay" id="warning-overlay">' +
        '<div class="modal-window" style="max-width:540px;">' +
          '<div class="modal-header">' +
            '<h3>Institutional Attendance Warning Notice</h3>' +
            '<button class="modal-close" id="warning-close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div style="background:#FFF; color:#0F172A; padding:24px; border-radius:10px; font-family:var(--font-sans); border:1px solid #CBD5E1; line-height:1.6;">' +
              '<div style="text-align:center; border-bottom:2px solid #0F172A; padding-bottom:12px; margin-bottom:16px;">' +
                '<h2 style="font-size:18px; color:#0F172A; text-transform:uppercase; letter-spacing:0.04em;">Scholaris Institute of Technology</h2>' +
                '<div style="font-size:11px; color:#64748B; font-weight:600;">OFFICE OF THE ACADEMIC REGISTRAR • ATTENDANCE DEFAULTERS COMMITTEE</div>' +
              '</div>' +

              '<div style="font-size:12px; color:#475569; margin-bottom:14px; display:flex; justify-content:space-between;">' +
                '<span>Ref No: SIT/REG/' + student.rollNumber + '/2026</span>' +
                '<span>Date: ' + new Date().toLocaleDateString() + '</span>' +
              '</div>' +

              '<p style="font-size:13px; margin-bottom:10px;"><strong>To:</strong> ' + esc(student.name) + ' (' + esc(student.rollNumber) + ')</p>' +
              '<p style="font-size:13px; margin-bottom:10px;"><strong>Programme:</strong> ' + esc(course.name) + '</p>' +

              '<p style="font-size:13px; margin-bottom:12px;">' +
                'This official notification is issued to inform you that your recorded attendance standing has fallen to <strong style="color:#DC2626;">' + (att.pct !== null ? att.pct + "%" : "0%") + '</strong>, which is strictly below the statutory university requirement of <strong>75.0%</strong>.' +
              '</p>' +

              '<p style="font-size:13px; margin-bottom:18px;">' +
                'Failure to remedy attendance deficits before the semester examination cut-off will result in formal disbarment from university examinations as per Regulation 14-B.' +
              '</p>' +

              '<div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:14px; border-top:1px dashed #CBD5E1; font-size:12px;">' +
                '<div>' +
                  '<div>Guardian Contact: ' + esc(student.phone || "—") + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                  '<strong>Academic Registrar</strong><br>' +
                  '<span style="font-size:11px; color:#64748B;">Scholaris Secretariat</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="copy-warning-btn">📋 Copy Notice Text</button>' +
            '<button class="btn btn-gold" id="print-warning-btn">🖨️ Print Notice</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    root.querySelector("#warning-close").addEventListener("click", closeModal);
    root.querySelector("#warning-overlay").addEventListener("click", function(e){
      if (e.target.id === "warning-overlay") closeModal();
    });
    root.querySelector("#print-warning-btn").addEventListener("click", function(){
      window.print();
    });
    root.querySelector("#copy-warning-btn").addEventListener("click", function(){
      var text = "SCHOLARIS INSTITUTIONAL ATTENDANCE NOTICE\nTo: " + student.name + " (" + student.rollNumber + ")\nAttendance Standing: " + (att.pct || 0) + "%\nRequired: 75.0%\nStatus: CRITICAL DEFICIT";
      navigator.clipboard.writeText(text).then(function(){
        showToast("Warning notice copied to clipboard.");
      });
    });
  }

  /* ================= Navigation View Router ================= */
  var VIEW_META = {
    dashboard:  { title: "Executive Dashboard", meta: "Institutional telemetry, student enrolments, and attendance analytics" },
    register:   { title: "Enrolment Studio", meta: "Direct admission dispatch and cryptographic ID synthesis" },
    records:    { title: "Student Records & Dossier", meta: "Search, filter, batch export, and manage enrolled undergraduates" },
    attendance: { title: "Smart Attendance Suite", meta: "1-tap roster check-in and automated 75% threshold monitor" },
    faculty:    { title: "Faculty Directory", meta: "Professorship allocations, departments, and workload oversight" },
    courses:    { title: "Programmes & Seat Capacity", meta: "Seat occupancy meters and academic stream capacities" },
    export:     { title: "Data Center & Exports", meta: "Download CSV rosters, institutional JSON backups, and official ledgers" }
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

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "register") renderRegisterStudio();
    if (viewName === "records") renderRecords();
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

  /* ================= Global Command Palette (Ctrl+K) ================= */
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

    // Views
    var views = [
      { type: "view", id: "dashboard", title: "Go to Dashboard", icon: "📊", badge: "VIEW" },
      { type: "view", id: "register", title: "Enrol New Student", icon: "⚡", badge: "ACTION" },
      { type: "view", id: "records", title: "View Student Records", icon: "🗂️", badge: "VIEW" },
      { type: "view", id: "attendance", title: "Mark Cohort Attendance", icon: "📋", badge: "VIEW" },
      { type: "view", id: "faculty", title: "Faculty Directory", icon: "👨‍🏫", badge: "VIEW" },
      { type: "view", id: "courses", title: "Programmes & Capacities", icon: "🏛️", badge: "VIEW" },
      { type: "view", id: "export", title: "Data Center & Backups", icon: "📥", badge: "DATA" }
    ];

    views.forEach(function(v){
      if (!q || v.title.toLowerCase().indexOf(q) > -1) items.push(v);
    });

    // Students
    state.students.forEach(function(s){
      if (!q || s.name.toLowerCase().indexOf(q) > -1 || s.rollNumber.toLowerCase().indexOf(q) > -1) {
        items.push({
          type: "student",
          student: s,
          title: s.name + " (" + s.rollNumber + ")",
          icon: "🎓",
          badge: s.course
        });
      }
    });

    // Faculty
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
      cmdResults.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13.5px;">No commands or records matching "' + esc(q) + '"</div>';
      return;
    }

    var html = items.slice(0, 8).map(function(item, idx){
      return '<div class="cmd-item ' + (idx === cmdActiveIdx ? 'active' : '') + '" data-idx="' + idx + '">' +
        '<div class="cmd-item-left">' +
          '<span style="font-size:16px;">' + item.icon + '</span>' +
          '<span>' + esc(item.title) + '</span>' +
        '</div>' +
        '<span class="cmd-badge">' + esc(item.badge) + '</span>' +
      '</div>';
    }).join("");

    cmdResults.innerHTML = html;

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
      openIdCardModal(item.student);
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
      kpiCard("Faculty Members", d.totalFaculty, d.totalFaculty + " across " + d.departmentCount + " depts", "emerald", "👨‍🏫") +
      kpiCard("Average Attendance", avgAtt, d.attendanceSessionsMarked ? d.attendanceSessionsMarked + " sessions recorded" : "No sessions yet", "cyan", "📋") +
      kpiCard("Seat Utilization", capPct + "%", totalEnrolled + " of " + totalCap + " intake filled", "purple", "🏛️");

    // Enrolment stream distribution bars
    var distMount = document.getElementById("dashboard-distribution-bars");
    if (distMount) {
      var maxN = Math.max.apply(null, d.distribution.map(function(x){ return x.count; }).concat([1]));
      distMount.innerHTML = d.distribution.map(function(row){
        var pct = Math.round((row.count / maxN) * 100);
        return '<div style="margin-bottom:14px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:13.5px; font-weight:600; margin-bottom:6px;">' +
            '<span>' + esc(row.name) + '</span>' +
            '<span class="mono" style="color:var(--accent-gold);">' + row.count + ' Students (' + pct + '%)</span>' +
          '</div>' +
          '<div style="height:8px; background:var(--bg-surface-elevated); border-radius:4px; overflow:hidden; border:1px solid var(--border-subtle);">' +
            '<div style="height:100%; width:' + pct + '%; background:linear-gradient(90deg, var(--accent-gold), var(--accent-emerald)); border-radius:4px; transition:width 0.6s ease;"></div>' +
          '</div>' +
        '</div>';
      }).join("");
    }

    // Live Audit Feed
    var actMount = document.getElementById("dashboard-activity-feed");
    if (actMount) {
      if (!d.activity || !d.activity.length) {
        actMount.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted);">No activity recorded yet.</div>';
      } else {
        actMount.innerHTML = d.activity.slice(0, 7).map(function(a){
          return '<div style="display:flex; align-items:flex-start; gap:12px; padding:10px 12px; background:var(--bg-surface-elevated); border-radius:8px; border:1px solid var(--border-subtle); font-size:13px;">' +
            '<div style="width:8px; height:8px; border-radius:50%; background:var(--accent-emerald); margin-top:5px; flex-shrink:0;"></div>' +
            '<div style="flex:1;">' +
              '<div style="font-weight:600; color:var(--text-primary);">' + esc(a.text) + '</div>' +
              '<div class="mono" style="font-size:11px; color:var(--text-muted); margin-top:2px;">' + fmtTime(a.time) + '</div>' +
            '</div>' +
          '</div>';
        }).join("");
      }
    }
  }

  function kpiCard(label, val, sub, colorClass, icon) {
    return '<div class="card glass-card kpi-card ' + colorClass + '">' +
      '<div class="kpi-header">' +
        '<div class="kpi-label">' + esc(label) + '</div>' +
        '<div class="kpi-icon">' + icon + '</div>' +
      '</div>' +
      '<div class="kpi-value">' + esc(String(val)) + '</div>' +
      '<div class="kpi-meta">' +
        '<span style="color:var(--accent-emerald); font-weight:700;">●</span>' +
        '<span>' + esc(sub) + '</span>' +
      '</div>' +
    '</div>';
  }

  /* ================= ENROLMENT STUDIO CONTROLLER ================= */
  function renderRegisterStudio() {
    var courseSelect = document.getElementById("f-course");
    if (courseSelect) {
      courseSelect.innerHTML = COURSES.map(function(c){
        return '<option value="' + c.code + '">' + esc(c.name) + ' (' + c.capacity + ' seats max)</option>';
      }).join("");
    }

    // Live card preview listeners
    var fRoll = document.getElementById("f-roll");
    var fName = document.getElementById("f-name");
    var fFather = document.getElementById("f-father");
    var fPhone = document.getElementById("f-phone");
    var fPercent = document.getElementById("f-percent");
    var fCourse = document.getElementById("f-course");

    function updateCardPreview() {
      var nameVal = (fName && fName.value.trim()) || "Student Name";
      var rollVal = (fRoll && fRoll.value.trim()) || "SIT24XXXXX";
      var fatherVal = (fFather && fFather.value.trim()) || "—";
      var phoneVal = (fPhone && fPhone.value.trim()) || "—";
      var percentVal = (fPercent && fPercent.value) ? fPercent.value + "%" : "—";
      var courseVal = fCourse ? courseByCode(fCourse.value).name : "Select Programme";

      var prevName = document.getElementById("prev-name");
      var prevRoll = document.getElementById("prev-roll");
      var prevAvatar = document.getElementById("prev-avatar");
      var prevFather = document.getElementById("prev-father");
      var prevPhone = document.getElementById("prev-phone");
      var prevPercent = document.getElementById("prev-percent");
      var prevCourse = document.getElementById("prev-course");

      if (prevName) prevName.textContent = nameVal;
      if (prevRoll) prevRoll.textContent = rollVal;
      if (prevAvatar) prevAvatar.textContent = initials(nameVal);
      if (prevFather) prevFather.textContent = fatherVal;
      if (prevPhone) prevPhone.textContent = phoneVal;
      if (prevPercent) prevPercent.textContent = percentVal;
      if (prevCourse) prevCourse.textContent = courseVal;

      var qrMount = document.getElementById("preview-qr-mount");
      if (qrMount && window.QRCode) {
        qrMount.innerHTML = "";
        new window.QRCode(qrMount, {
          text: "https://scholaris.edu/verify/" + (rollVal || "DEMO"),
          width: 64,
          height: 64,
          colorDark: "#090D14",
          colorLight: "#FFFFFF"
        });
      }
    }

    [fRoll, fName, fFather, fPhone, fPercent, fCourse].forEach(function(input){
      if (input) input.addEventListener("input", updateCardPreview);
    });

    // Magic Autofill Demo Data
    var autofillBtn = document.getElementById("autofill-btn");
    if (autofillBtn) {
      autofillBtn.addEventListener("click", function(){
        var demoNames = [
          { name: "Aarav Sharma", father: "Ramesh Sharma", mother: "Sunita Sharma", pct: "95.4", c: "CSE-CORE" },
          { name: "Ananya Iyer", father: "Subramanian Iyer", mother: "Lakshmi Iyer", pct: "97.2", c: "CSE-AIML" },
          { name: "Rohan Varma", father: "Kishore Varma", mother: "Geeta Varma", pct: "91.8", c: "CSE-DS" },
          { name: "Tanvi Deshmukh", father: "Pradeep Deshmukh", mother: "Archana Deshmukh", pct: "89.6", c: "ECE" }
        ];
        var pick = demoNames[Math.floor(Math.random() * demoNames.length)];
        var randNum = Math.floor(100 + Math.random() * 900);
        var rollCode = pick.c.replace("-", "").slice(0, 4);

        if (fRoll) fRoll.value = "SIT26" + rollCode + randNum;
        if (fName) fName.value = pick.name;
        if (fFather) fFather.value = pick.father;
        var fMother = document.getElementById("f-mother");
        if (fMother) fMother.value = pick.mother;
        if (fPhone) fPhone.value = "98" + Math.floor(10000000 + Math.random() * 90000000);
        if (fPercent) fPercent.value = pick.pct;
        if (fCourse) fCourse.value = pick.c;
        var fAddress = document.getElementById("f-address");
        if (fAddress) fAddress.value = "Flat " + Math.floor(1 + Math.random() * 40) + ", University Enclave, Tech Park Road, Bengaluru";

        updateCardPreview();
        playTone(700, "sine", 0.08);
      });
    }

    // Submit handler
    var regForm = document.getElementById("register-form");
    if (regForm) {
      regForm.onsubmit = function(e){
        e.preventDefault();
        var payload = {
          rollNumber: document.getElementById("f-roll").value.trim(),
          name: document.getElementById("f-name").value.trim(),
          fatherName: document.getElementById("f-father").value.trim(),
          motherName: document.getElementById("f-mother").value.trim(),
          phone: document.getElementById("f-phone").value.trim(),
          address: document.getElementById("f-address").value.trim(),
          percentage12: document.getElementById("f-percent").value,
          course: document.getElementById("f-course").value
        };

        apiPost("/students", payload).then(function(student){
          triggerConfetti();
          showToast(student.name + " enrolled successfully!");
          regForm.reset();
          updateCardPreview();
          return refreshAll();
        }).then(function(){
          renderDashboard();
        }).catch(function(err){
          showToast(err.message, "error");
        });
      };
    }
  }

  /* ================= STUDENT RECORDS CONTROLLER ================= */
  var recSearchInput = document.getElementById("rec-search-input");
  var recCourseFilter = document.getElementById("rec-course-filter");
  var recStandingFilter = document.getElementById("rec-standing-filter");

  if (recSearchInput) recSearchInput.addEventListener("input", renderRecordsTable);
  if (recCourseFilter) recCourseFilter.addEventListener("change", renderRecordsTable);
  if (recStandingFilter) recStandingFilter.addEventListener("change", renderRecordsTable);

  function renderRecords() {
    if (recCourseFilter) {
      recCourseFilter.innerHTML = '<option value="">All Streams</option>' + COURSES.map(function(c){
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
    var standingVal = (recStandingFilter && recStandingFilter.value) || "";

    var list = state.students.filter(function(s){
      var matchQ = !q || s.name.toLowerCase().indexOf(q) > -1 || s.rollNumber.toLowerCase().indexOf(q) > -1 || (s.phone && s.phone.indexOf(q) > -1);
      var matchC = !courseVal || s.course === courseVal;
      var att = attendanceStats(s.rollNumber);
      var matchStanding = true;
      if (standingVal === "good") matchStanding = att.pct === null || att.pct >= 75;
      if (standingVal === "critical") matchStanding = att.pct !== null && att.pct < 75;
      return matchQ && matchC && matchStanding;
    });

    if (!list.length) {
      host.innerHTML = '<div style="padding:48px; text-align:center; color:var(--text-muted);">' +
        '<div style="font-size:28px; margin-bottom:10px;">🔍</div>' +
        '<div style="font-size:16px; font-weight:700;">No student records found</div>' +
        '<div style="font-size:13px; margin-top:4px;">Try modifying your search filter or enrol a new student.</div>' +
      '</div>';
      return;
    }

    var rows = list.map(function(s){
      var att = attendanceStats(s.rollNumber);
      var course = courseByCode(s.course);
      var isSelected = state.selectedRows.has(s.id);
      var attBadge = att.pct === null 
        ? '<span class="badge" style="background:var(--bg-surface-elevated); color:var(--text-muted);">No Data</span>'
        : att.pct < 75 
        ? '<span class="badge badge-rose">⚠️ ' + att.pct + '%</span>'
        : '<span class="badge badge-emerald">✓ ' + att.pct + '%</span>';

      return '<tr data-id="' + s.id + '">' +
        '<td style="width:40px;"><input type="checkbox" class="row-checkbox" data-id="' + s.id + '" ' + (isSelected ? 'checked' : '') + '></td>' +
        '<td><strong class="mono" style="color:var(--text-primary);">' + esc(s.rollNumber) + '</strong></td>' +
        '<td>' +
          '<div style="font-weight:700; color:var(--text-primary);">' + esc(s.name) + '</div>' +
          '<div style="font-size:11px; color:var(--text-muted);">' + (s.fatherName ? 'S/D of ' + esc(s.fatherName) : '') + '</div>' +
        '</td>' +
        '<td><span class="badge course-' + s.course + '">' + esc(course.name) + '</span></td>' +
        '<td><span class="mono" style="font-size:12.5px;">' + esc(s.phone || '—') + '</span></td>' +
        '<td>' + (s.percentage12 ? '<strong class="mono">' + s.percentage12 + '%</strong>' : '—') + '</td>' +
        '<td>' + attBadge + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-sm btn-ghost" data-act="idcard" style="margin-right:6px;">✨ ID Badge</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="dossier" style="margin-right:6px;">👤 Dossier</button>' +
          '<button class="btn btn-sm btn-danger" data-act="delete">🗑️</button>' +
        '</td>' +
      '</tr>';
    }).join("");

    host.innerHTML = '<table class="data-table">' +
      '<thead><tr>' +
        '<th style="width:40px;"><input type="checkbox" id="select-all-checkbox"></th>' +
        '<th>Roll Number</th>' +
        '<th>Student Name</th>' +
        '<th>Programme</th>' +
        '<th>Phone</th>' +
        '<th>Merit (12th)</th>' +
        '<th>Attendance</th>' +
        '<th style="text-align:right;">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';

    // Checkbox and Row listeners
    var selectAll = host.querySelector("#select-all-checkbox");
    if (selectAll) {
      selectAll.addEventListener("change", function(){
        list.forEach(function(s){
          if (selectAll.checked) state.selectedRows.add(s.id);
          else state.selectedRows.delete(s.id);
        });
        renderRecordsTable();
        updateBatchActionBar();
      });
    }

    host.querySelectorAll(".row-checkbox").forEach(function(cb){
      cb.addEventListener("change", function(){
        var id = cb.getAttribute("data-id");
        if (cb.checked) state.selectedRows.add(id);
        else state.selectedRows.delete(id);
        updateBatchActionBar();
      });
    });

    host.querySelectorAll("tbody tr").forEach(function(tr){
      var id = tr.getAttribute("data-id");
      var student = state.students.find(function(x){ return x.id === id; });
      if (!student) return;

      var idBtn = tr.querySelector('[data-act="idcard"]');
      var dosBtn = tr.querySelector('[data-act="dossier"]');
      var delBtn = tr.querySelector('[data-act="delete"]');

      if (idBtn) idBtn.addEventListener("click", function(){ openIdCardModal(student); });
      if (dosBtn) dosBtn.addEventListener("click", function(){ openDossierModal(student); });
      if (delBtn) delBtn.addEventListener("click", function(){
        openConfirm("Remove Student Record?", "Are you sure you want to delete " + student.name + " (" + student.rollNumber + ") from the active register?", function(){
          apiDelete("/students/" + student.id).then(function(){
            showToast(student.name + " removed from register.");
            return refreshAll();
          }).then(function(){
            renderRecordsTable();
            renderDashboard();
          }).catch(function(err){ showToast(err.message, "error"); });
        });
      });
    });

    updateBatchActionBar();
  }

  function updateBatchActionBar() {
    var bar = document.getElementById("batch-actions-bar");
    var countSpan = document.getElementById("batch-count");
    if (!bar) return;
    if (state.selectedRows.size > 0) {
      bar.style.display = "flex";
      if (countSpan) countSpan.textContent = state.selectedRows.size;
    } else {
      bar.style.display = "none";
    }
  }

  // Batch action handlers
  var batchCsvBtn = document.getElementById("batch-csv-btn");
  if (batchCsvBtn) {
    batchCsvBtn.addEventListener("click", function(){
      var selected = state.students.filter(function(s){ return state.selectedRows.has(s.id); });
      downloadCsv("Scholaris_Selected_Students.csv", generateStudentsCsv(selected));
      showToast("Exported " + selected.length + " students to CSV.");
    });
  }

  var batchDelBtn = document.getElementById("batch-delete-btn");
  if (batchDelBtn) {
    batchDelBtn.addEventListener("click", function(){
      var count = state.selectedRows.size;
      openConfirm("Batch Delete Students?", "Are you sure you want to remove " + count + " selected students from the register?", function(){
        var promises = Array.from(state.selectedRows).map(function(id){
          return apiDelete("/students/" + id);
        });
        Promise.all(promises).then(function(){
          state.selectedRows.clear();
          showToast("Batch deletion complete.");
          return refreshAll();
        }).then(function(){
          renderRecordsTable();
          renderDashboard();
        }).catch(function(err){ showToast(err.message, "error"); });
      });
    });
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
      host.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">' +
        '<div style="font-size:24px; margin-bottom:8px;">📋</div>' +
        '<div>No students currently enrolled in this stream.</div>' +
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
      return '<div style="display:flex; justify-content:space-between; align-items:center; padding:11px 14px; background:var(--bg-surface-elevated); border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:8px;">' +
        '<div>' +
          '<div style="font-weight:700; font-size:13.5px; color:var(--text-primary);">' + esc(s.name) + '</div>' +
          '<div class="mono" style="font-size:11.5px; color:var(--text-muted);">' + esc(s.rollNumber) + '</div>' +
        '</div>' +
        '<div style="display:flex; gap:6px;">' +
          '<button class="btn btn-sm ' + (isPresent ? 'btn-emerald' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="1">✓ Present</button>' +
          '<button class="btn btn-sm ' + (!isPresent ? 'btn-danger' : 'btn-ghost') + '" data-roll="' + s.rollNumber + '" data-val="0">✗ Absent</button>' +
        '</div>' +
      '</div>';
    }).join("");

    host.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">' +
        '<span style="font-size:12.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Roster (' + roster.length + ' Students)</span>' +
        '<div style="display:flex; gap:8px;">' +
          '<button class="btn btn-sm btn-ghost" id="att-all-present">All Present</button>' +
          '<button class="btn btn-sm btn-ghost" id="att-all-absent">All Absent</button>' +
        '</div>' +
      '</div>' +
      '<div style="max-height:360px; overflow-y:auto; padding-right:4px;">' + rows + '</div>' +
      '<div style="margin-top:18px; display:flex; justify-content:flex-end;">' +
        '<button class="btn btn-primary btn-lg" id="save-attendance-btn">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
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
      host.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-muted);">No enrolled students.</div>';
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
      return '<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-surface-elevated); border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:8px;">' +
        '<div>' +
          '<div style="font-weight:700; font-size:13px; color:var(--text-primary);">' + esc(item.s.name) + '</div>' +
          '<div class="mono" style="font-size:11px; color:var(--text-muted);">' + esc(item.s.rollNumber) + ' · ' + esc(item.s.course) + '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:8px;">' +
          (pct === null ? '<span class="badge" style="background:var(--bg-surface); color:var(--text-muted);">No Data</span>'
           : isDefaulter ? '<span class="badge badge-rose">⚠️ ' + pct + '%</span>'
           : '<span class="badge badge-emerald">✓ ' + pct + '%</span>') +
          (isDefaulter ? '<button class="btn btn-sm btn-danger" data-warn="' + item.s.id + '">Draft Notice</button>' : '') +
        '</div>' +
      '</div>';
    }).join("");

    host.querySelectorAll("[data-warn]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-warn");
        var student = state.students.find(function(x){ return x.id === id; });
        if (student) openDefaulterWarningModal(student);
      });
    });
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
      host.innerHTML = '<div style="grid-column:1/-1; padding:48px; text-align:center; color:var(--text-muted);">' +
        '<div style="font-size:28px; margin-bottom:8px;">👨‍🏫</div>' +
        '<div style="font-size:16px; font-weight:700;">No faculty members found</div>' +
      '</div>';
      return;
    }

    host.innerHTML = list.map(function(f){
      var course = courseByCode(f.course);
      return '<div class="card glass-card card-hover" style="padding:22px; display:flex; flex-direction:column; justify-content:space-between;">' +
        '<div>' +
          '<div style="display:flex; align-items:center; gap:14px; margin-bottom:14px;">' +
            '<div style="width:48px; height:48px; border-radius:12px; background:linear-gradient(135deg, var(--accent-gold), #D97706); color:#090D14; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:18px;">' + initials(f.name) + '</div>' +
            '<div>' +
              '<div style="font-weight:700; font-size:16px; color:var(--text-primary);">' + esc(f.name) + '</div>' +
              '<div style="font-size:12px; color:var(--accent-gold); font-weight:600;">' + esc(f.designation) + '</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex; flex-direction:column; gap:8px; font-size:12.5px; color:var(--text-secondary); margin-bottom:16px;">' +
            '<div>🏢 <strong>Dept:</strong> ' + esc(f.department) + ' (' + esc(f.experience) + ' yrs exp)</div>' +
            '<div>📖 <strong>Subject:</strong> ' + esc(f.subject) + '</div>' +
            '<div>🎓 <span class="badge course-' + f.course + '">' + esc(course.name) + '</span></div>' +
            '<div class="mono" style="font-size:11.5px; color:var(--text-muted);">✉️ ' + esc(f.email) + '</div>' +
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

  // Add faculty modal
  var openAddFacBtn = document.getElementById("open-add-fac-btn");
  if (openAddFacBtn) {
    openAddFacBtn.addEventListener("click", function(){
      var root = document.getElementById("modal-root");
      var courseOptions = COURSES.map(function(c){
        return '<option value="' + c.code + '">' + esc(c.name) + '</option>';
      }).join("");

      root.innerHTML =
        '<div class="modal-overlay" id="add-fac-overlay">' +
          '<div class="modal-window" style="max-width:520px;">' +
            '<div class="modal-header">' +
              '<h3>Register New Faculty Member</h3>' +
              '<button class="modal-close" id="add-fac-close">✕</button>' +
            '</div>' +
            '<form id="new-fac-form">' +
              '<div class="modal-body">' +
                '<div class="field-row">' +
                  '<div class="field"><label>Full Name</label><input type="text" id="mf-name" placeholder="e.g. Dr. Priya Nair" required></div>' +
                  '<div class="field"><label>Designation</label><select id="mf-desig" required>' +
                    '<option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Lecturer</option>' +
                  '</select></div>' +
                '</div>' +
                '<div class="field-row">' +
                  '<div class="field"><label>Department</label><input type="text" id="mf-dept" placeholder="e.g. Computer Science" required></div>' +
                  '<div class="field"><label>Subject Taught</label><input type="text" id="mf-subject" placeholder="e.g. Neural Networks" required></div>' +
                '</div>' +
                '<div class="field-row">' +
                  '<div class="field"><label>Assigned Programme</label><select id="mf-course" required>' + courseOptions + '</select></div>' +
                  '<div class="field"><label>Years of Experience</label><input type="number" min="0" id="mf-exp" placeholder="e.g. 8" required></div>' +
                '</div>' +
                '<div class="field-row">' +
                  '<div class="field"><label>Email Address</label><input type="email" id="mf-email" placeholder="e.g. priya.nair@scholaris.edu" required></div>' +
                  '<div class="field"><label>Phone</label><input type="tel" id="mf-phone" placeholder="e.g. 9876543210" required></div>' +
                '</div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" id="add-fac-cancel">Cancel</button>' +
                '<button type="submit" class="btn btn-primary">Add Faculty Member</button>' +
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
    });
  }

  /* ================= PROGRAMMES & CAPACITY CONTROLLER ================= */
  function renderCourses() {
    var host = document.getElementById("courses-grid-mount");
    if (!host) return;

    apiGet("/courses").then(function(courses){
      host.innerHTML = courses.map(function(c){
        var pct = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
        var isFull = pct >= 100;
        return '<div class="card glass-card" style="padding:24px; display:flex; flex-direction:column; justify-content:space-between;">' +
          '<div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
              '<span class="mono" style="font-size:12px; color:var(--accent-gold); font-weight:700;">' + esc(c.code) + '</span>' +
              '<span class="badge ' + (isFull ? 'badge-rose' : 'badge-emerald') + '">' + (isFull ? 'CAPACITY FULL' : 'SEATS AVAILABLE') + '</span>' +
            '</div>' +
            '<h3 style="font-size:18px; font-weight:800; margin-bottom:14px;">' + esc(c.name) + '</h3>' +

            '<div style="margin-bottom:14px;">' +
              '<div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">' +
                '<span>Seat Occupancy</span>' +
                '<strong class="mono">' + c.enrolled + ' / ' + c.capacity + ' (' + pct + '%)</strong>' +
              '</div>' +
              '<div style="height:8px; background:var(--bg-surface-elevated); border-radius:4px; overflow:hidden; border:1px solid var(--border-subtle);">' +
                '<div style="height:100%; width:' + pct + '%; background:' + (isFull ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-gold), var(--accent-emerald))') + '; border-radius:4px;"></div>' +
              '</div>' +
            '</div>' +

            '<div style="padding-top:12px; border-top:1px solid var(--border-subtle);">' +
              '<div style="font-size:11.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Teaching Staff Assigned</div>' +
              '<div style="font-size:12.5px; color:var(--text-secondary); line-height:1.6;">' +
                (c.faculty && c.faculty.length ? c.faculty.map(function(f){ return '👨‍🏫 ' + esc(f.name) + ' (' + esc(f.designation) + ')'; }).join("<br>") : '<span style="color:var(--text-dim);">No faculty allocated yet</span>') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:20px; padding-top:14px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between;">' +
            '<button class="btn btn-sm btn-ghost" data-viewstream="' + c.code + '">View Enrolled Roster</button>' +
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

  /* ================= DATA CENTER & EXPORT ENGINE ================= */
  function downloadCsv(filename, content) {
    var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    playSuccessChime();
  }

  function generateStudentsCsv(list) {
    var headers = ["RollNumber", "Name", "Course", "Phone", "FatherName", "MotherName", "12thPercentage", "Address", "EnrollDate", "AttendancePct"];
    var rows = (list || state.students).map(function(s){
      var att = attendanceStats(s.rollNumber);
      return [
        '"' + s.rollNumber + '"',
        '"' + (s.name || '').replace(/"/g, '""') + '"',
        '"' + (s.course || '') + '"',
        '"' + (s.phone || '') + '"',
        '"' + (s.fatherName || '').replace(/"/g, '""') + '"',
        '"' + (s.motherName || '').replace(/"/g, '""') + '"',
        '"' + (s.percentage12 || '') + '"',
        '"' + (s.address || '').replace(/"/g, '""') + '"',
        '"' + (s.enrollDate || '') + '"',
        '"' + (att.pct !== null ? att.pct + "%" : "N/A") + '"'
      ].join(",");
    });
    return [headers.join(",")].concat(rows).join("\n");
  }

  var expStuBtn = document.getElementById("export-students-csv");
  if (expStuBtn) {
    expStuBtn.addEventListener("click", function(){
      downloadCsv("Scholaris_Students_Register.csv", generateStudentsCsv());
      showToast("Students CSV downloaded.");
    });
  }

  var expAttBtn = document.getElementById("export-att-csv");
  if (expAttBtn) {
    expAttBtn.addEventListener("click", function(){
      var headers = ["Course", "Date", "RollNumber", "Present"];
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
      downloadCsv("Scholaris_Attendance_Master.csv", [headers.join(",")].concat(rows).join("\n"));
      showToast("Attendance CSV downloaded.");
    });
  }

  var expFacBtn = document.getElementById("export-faculty-csv");
  if (expFacBtn) {
    expFacBtn.addEventListener("click", function(){
      var headers = ["Name", "Designation", "Department", "Subject", "Course", "ExperienceYears", "Email", "Phone"];
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
      downloadCsv("Scholaris_Faculty_Directory.csv", [headers.join(",")].concat(rows).join("\n"));
      showToast("Faculty Directory CSV downloaded.");
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
      link.download = "Scholaris_Institutional_Backup_" + new Date().toISOString().slice(0, 10) + ".json";
      link.click();
      playSuccessChime();
      showToast("Full institutional JSON backup generated.");
    });
  }

  /* ================= Initialization Boot ================= */
  refreshAll().then(function(){
    renderDashboard();
    renderRegisterStudio();
    renderRecords();
    renderAttendance();
    renderFaculty();
    renderCourses();
  }).catch(function(){
    renderRegisterStudio();
  });

  // Background Telemetry Heartbeat
  setInterval(function(){
    apiGet("/dashboard").then(function(d){
      state.dashboard = d;
      setStatus(true);
      if (document.getElementById("view-dashboard").classList.contains("active")) {
        renderDashboard();
      }
    }).catch(function(){ setStatus(false); });
  }, 12000);
})();
