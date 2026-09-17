const { getCollection, setCollection, newId, logActivity, seedStudents } = require("../_lib/store");
const { byCode } = require("../_lib/courses");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const students = await getCollection("students", seedStudents);
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

      const students = await getCollection("students", seedStudents);

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
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        phone: body.phone || null,
        address: body.address || null,
        percentage12: body.percentage12 != null ? String(body.percentage12) : null,
        course: course,
        enrollDate: new Date().toISOString()
      };

      students.push(student);
      await setCollection("students", students);
      await logActivity(name + " (" + roll + ") enrolled in " + courseDef.name + ".");
      return res.status(201).json(student);
    }

    return res.status(404).json({ error: "No such student route." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
