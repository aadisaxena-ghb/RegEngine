const { getCollection, setCollection, newId, logActivity, seedFaculty } = require("../_lib/store");
const { byCode } = require("../_lib/courses");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const faculty = await getCollection("faculty", seedFaculty);
      return res.status(200).json(faculty);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = String(body.name || "").trim();
      const course = body.course;

      if (!name) return res.status(400).json({ error: "Missing required field: name" });
      const courseDef = byCode(course);
      if (!courseDef) return res.status(400).json({ error: "Unknown course code: " + course });

      const required = ["designation", "department", "subject", "email", "phone"];
      for (const key of required) {
        if (!body[key] || !String(body[key]).trim()) {
          return res.status(400).json({ error: "Missing required field: " + key });
        }
      }

      const f = {
        id: newId("fac"),
        name: name,
        designation: String(body.designation).trim(),
        department: String(body.department).trim(),
        subject: String(body.subject).trim(),
        course: course,
        experience: body.experience != null ? String(body.experience) : null,
        email: String(body.email).trim(),
        phone: String(body.phone).trim()
      };

      const faculty = await getCollection("faculty", seedFaculty);
      faculty.push(f);
      await setCollection("faculty", faculty);
      await logActivity(name + " joined as " + f.designation + " for " + courseDef.name + ".");
      return res.status(201).json(f);
    }

    return res.status(404).json({ error: "No such faculty route." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
