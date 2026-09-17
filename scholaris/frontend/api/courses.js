const { getCollection, seedStudents, seedFaculty } = require("./_lib/store");
const { COURSES } = require("./_lib/courses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(404).json({ error: "No such course route." });
  try {
    const students = await getCollection("students", seedStudents);
    const faculty = await getCollection("faculty", seedFaculty);

    const out = COURSES.map(function (c) {
      const enrolled = students.filter(function (s) { return s.course === c.code; }).length;
      const facultyForCourse = faculty
        .filter(function (f) { return f.course === c.code; })
        .map(function (f) { return { name: f.name, designation: f.designation }; });
      return {
        code: c.code, name: c.name, department: c.department, capacity: c.capacity,
        enrolled: enrolled, faculty: facultyForCourse
      };
    });

    return res.status(200).json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
