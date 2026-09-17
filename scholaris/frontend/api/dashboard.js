const { getCollection, seedStudents, seedFaculty, seedActivity } = require("./_lib/store");
const { COURSES } = require("./_lib/courses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(404).json({ error: "No such dashboard route." });
  try {
    const students = await getCollection("students", seedStudents);
    const faculty = await getCollection("faculty", seedFaculty);
    const sessions = await getCollection("attendance", function () { return []; });
    const activity = await getCollection("activity", seedActivity);

    let totalMarked = 0, totalPresent = 0;
    sessions.forEach(function (s) {
      s.records.forEach(function (r) { totalMarked++; if (r.present) totalPresent++; });
    });
    const avgAttendance = totalMarked === 0 ? null : Math.round((totalPresent * 100) / totalMarked);

    const distribution = COURSES.map(function (c) {
      return { code: c.code, name: c.name, count: students.filter(function (s) { return s.course === c.code; }).length };
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
      activity: activity.slice(0, 25)
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
