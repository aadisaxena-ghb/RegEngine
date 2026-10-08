const {
  getCollection,
  setCollection,
  newId,
  logActivity,
  seedStudents,
  seedFaculty,
  seedNotices,
  seedCalendar,
  seedTimetable,
  seedAttendance,
  seedActivity
} = require("./_lib/store");
const { COURSES, byCode } = require("./_lib/courses");
const { CURRICULUM } = require("./_lib/curriculum");

module.exports = async function handler(req, res) {
  // Enable CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const rawUrl = req.url || "/";
    const pathname = rawUrl.split("?")[0].replace(/^\/api\/?/, "/");
    const segments = pathname.split("/").filter(Boolean);
    const resource = segments[0] || "";
    const id = segments[1] || req.query.id || null;

    // 1. Dashboard
    if (resource === "dashboard") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      const students = await getCollection("students", seedStudents);
      const faculty = await getCollection("faculty", seedFaculty);
      const sessions = await getCollection("attendance", seedAttendance);
      const activity = await getCollection("activity", seedActivity);

      let totalMarked = 0, totalPresent = 0;
      sessions.forEach(function (s) {
        (s.records || []).forEach(function (r) {
          totalMarked++;
          if (r.present) totalPresent++;
        });
      });
      const avgAttendance = totalMarked === 0 ? null : Math.round((totalPresent * 100) / totalMarked);

      const distribution = COURSES.map(function (c) {
        return {
          code: c.code,
          name: c.name,
          count: students.filter(function (s) { return s.course === c.code; }).length
        };
      });

      const deptCount = new Set(faculty.map(function (f) { return f.department; })).size;

      return res.status(200).json({
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalCourses: COURSES.length,
        departmentCount: deptCount,
        avgAttendance: avgAttendance,
        attendanceSessionsMarked: totalMarked,
        distribution: distribution,
        activity: activity.slice(0, 30)
      });
    }

    // 2. Courses
    if (resource === "courses") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      const students = await getCollection("students", seedStudents);
      const faculty = await getCollection("faculty", seedFaculty);

      const out = COURSES.map(function (c) {
        const enrolled = students.filter(function (s) { return s.course === c.code; }).length;
        const facultyForCourse = faculty
          .filter(function (f) { return f.course === c.code; })
          .map(function (f) { return { name: f.name, designation: f.designation }; });
        return {
          code: c.code,
          name: c.name,
          department: c.department,
          capacity: c.capacity,
          enrolled: enrolled,
          faculty: facultyForCourse
        };
      });
      return res.status(200).json(out);
    }

    // 3. Students
    if (resource === "students") {
      const students = await getCollection("students", seedStudents);

      if (req.method === "GET") {
        if (id) {
          const s = students.find(function (item) { return item.id === id || item.rollNumber === id; });
          if (!s) return res.status(404).json({ error: "Student not found" });
          return res.status(200).json(s);
        }
        return res.status(200).json(students);
      }

      if (req.method === "POST") {
        const body = req.body || {};
        const roll = String(body.rollNumber || "").trim();
        const name = String(body.name || "").trim();
        const course = body.course;

        if (!roll) return res.status(400).json({ error: "Missing required field: rollNumber" });
        if (!name) return res.status(400).json({ error: "Missing required field: name" });

        const courseDef = byCode(course);
        if (!courseDef) return res.status(400).json({ error: "Unknown course code: " + course });

        const duplicate = students.some(function (s) { return s.rollNumber.toLowerCase() === roll.toLowerCase(); });
        if (duplicate) return res.status(400).json({ error: "A student with roll number " + roll + " is already registered." });

        const enrolledInCourse = students.filter(function (s) { return s.course === course; }).length;
        if (enrolledInCourse >= courseDef.capacity) {
          return res.status(400).json({ error: courseDef.name + " has reached its capacity of " + courseDef.capacity + " seats." });
        }

        const student = {
          id: newId("stu"),
          rollNumber: roll,
          name: name,
          gender: body.gender || "Not Specified",
          dob: body.dob || "",
          bloodGroup: body.bloodGroup || "",
          category: body.category || "General",
          aadharNumber: body.aadharNumber || "",
          section: body.section || "Section A",
          batchYear: body.batchYear || "2026–2030",
          admissionType: body.admissionType || "Institutional Merit",
          percentage10: body.percentage10 != null ? String(body.percentage10) : "",
          percentage12: body.percentage12 != null ? String(body.percentage12) : "",
          previousSchool: body.previousSchool || "",
          fatherName: body.fatherName || null,
          fatherOccupation: body.fatherOccupation || "",
          motherName: body.motherName || null,
          motherOccupation: body.motherOccupation || "",
          guardianPhone: body.guardianPhone || "",
          guardianEmail: body.guardianEmail || "",
          phone: body.phone || null,
          email: body.email || (roll.toLowerCase() + "@regengine.edu"),
          emergencyContact: body.emergencyContact || "",
          address: body.address || null,
          cityStatePin: body.cityStatePin || "",
          accommodation: body.accommodation || "Day Scholar",
          busRoute: body.busRoute || "Self Commute",
          course: course,
          enrollDate: new Date().toISOString()
        };

        students.push(student);
        await setCollection("students", students);
        await logActivity(name + " (" + roll + ") enrolled in " + courseDef.name + ".");
        return res.status(201).json(student);
      }

      if (req.method === "DELETE") {
        if (!id) return res.status(400).json({ error: "Missing student ID for deletion" });
        const target = students.find(function (s) { return s.id === id || s.rollNumber === id; });
        if (!target) return res.status(404).json({ error: "Student not found." });

        const remaining = students.filter(function (s) { return s.id !== target.id; });
        await setCollection("students", remaining);
        await logActivity(target.name + " (" + target.rollNumber + ") was removed from the register.");
        return res.status(200).json({ removed: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // 4. Faculty
    if (resource === "faculty") {
      const faculty = await getCollection("faculty", seedFaculty);

      if (req.method === "GET") {
        if (id) {
          const f = faculty.find(function (item) { return item.id === id; });
          if (!f) return res.status(404).json({ error: "Faculty member not found" });
          return res.status(200).json(f);
        }
        return res.status(200).json(faculty);
      }

      if (req.method === "POST") {
        const body = req.body || {};
        const name = String(body.name || "").trim();
        const course = body.course;

        if (!name) return res.status(400).json({ error: "Missing required field: name" });
        const courseDef = byCode(course);
        if (!courseDef) return res.status(400).json({ error: "Unknown course code: " + course });

        const f = {
          id: newId("fac"),
          name: name,
          designation: String(body.designation || "Assistant Professor").trim(),
          department: String(body.department || courseDef.department).trim(),
          subject: String(body.subject || courseDef.name).trim(),
          qualification: String(body.qualification || "Ph.D.").trim(),
          course: course,
          experience: body.experience != null ? Number(body.experience) : 5,
          email: String(body.email || "").trim(),
          phone: String(body.phone || "").trim(),
          officeRoom: body.officeRoom || "Staff Room",
          joinDate: body.joinDate || new Date().toISOString().slice(0, 10)
        };

        faculty.push(f);
        await setCollection("faculty", faculty);
        await logActivity(name + " joined as " + f.designation + " for " + courseDef.name + ".");
        return res.status(201).json(f);
      }

      if (req.method === "DELETE") {
        if (!id) return res.status(400).json({ error: "Missing faculty ID for deletion" });
        const target = faculty.find(function (f) { return f.id === id; });
        if (!target) return res.status(404).json({ error: "Faculty member not found." });

        const remaining = faculty.filter(function (f) { return f.id !== id; });
        await setCollection("faculty", remaining);
        await logActivity(target.name + " was removed from the faculty directory.");
        return res.status(200).json({ removed: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // 5. Attendance
    if (resource === "attendance") {
      if (req.method === "GET") {
        const sessions = await getCollection("attendance", seedAttendance);
        return res.status(200).json(sessions);
      }

      if (req.method === "POST") {
        const body = req.body || {};
        const course = body.course;
        const section = body.section || "Section A";
        const date = body.date;

        if (!course) return res.status(400).json({ error: "Missing course." });
        if (!date) return res.status(400).json({ error: "Missing date." });

        const courseDef = byCode(course);
        if (!courseDef) return res.status(400).json({ error: "Unknown course code: " + course });
        if (!Array.isArray(body.records)) return res.status(400).json({ error: "Missing attendance records." });

        const records = body.records.map(function (r) {
          return { rollNumber: String(r.rollNumber), present: !!r.present };
        });
        const presentCount = records.filter(function (r) { return r.present; }).length;

        const sessions = await getCollection("attendance", seedAttendance);
        const idx = sessions.findIndex(function (s) {
          return s.course === course && (s.section || "Section A") === section && s.date === date;
        });
        const session = {
          id: idx >= 0 ? sessions[idx].id : newId("att"),
          course: course,
          section: section,
          date: date,
          records: records
        };
        if (idx >= 0) sessions[idx] = session; else sessions.push(session);

        await setCollection("attendance", sessions);
        await logActivity("Attendance recorded for " + courseDef.name + " (" + section + ") on " + date + " (" + presentCount + "/" + records.length + " present).");
        return res.status(200).json(session);
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // 6. Notices
    if (resource === "notices") {
      const notices = await getCollection("notices", seedNotices);

      if (req.method === "GET") {
        return res.status(200).json(notices);
      }

      if (req.method === "POST") {
        const body = req.body || {};
        const title = String(body.title || "").trim();
        if (!title) return res.status(400).json({ error: "Notice title is required" });

        const id = newId("not");
        const refNumber = body.refNumber || ("REG/CIR/2026/" + Math.floor(Math.random() * 900 + 100));
        const category = body.category || "Academic";
        const priority = body.priority || "Normal";
        const publishDate = body.publishDate || new Date().toISOString().slice(0, 10);
        const author = body.author || "Registrar Secretariat";
        const department = body.department || "Academic Affairs";
        const content = body.content || "";
        const attachmentUrl = body.attachmentUrl || "";

        const newNotice = {
          id: id,
          refNumber: refNumber,
          title: title,
          category: category,
          priority: priority,
          publishDate: publishDate,
          author: author,
          department: department,
          content: content,
          attachmentUrl: attachmentUrl
        };

        notices.unshift(newNotice);
        await setCollection("notices", notices);
        await logActivity("Official Circular Published: [" + refNumber + "] " + title);
        return res.status(201).json(newNotice);
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // 7. Calendar
    if (resource === "calendar") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      const events = await getCollection("calendar", seedCalendar);
      return res.status(200).json(events);
    }

    // 8. Timetable
    if (resource === "timetable") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      const timetable = await getCollection("timetable", seedTimetable);
      return res.status(200).json(timetable);
    }

    // 9. Curriculum
    if (resource === "curriculum") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      return res.status(200).json(CURRICULUM);
    }

    return res.status(404).json({ error: "Endpoint not found: " + resource });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
