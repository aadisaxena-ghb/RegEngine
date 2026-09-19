const { getCollection, setCollection, newId, logActivity } = require("../_lib/store");
const { byCode } = require("../_lib/courses");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const sessions = await getCollection("attendance", function () { return []; });
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

      const sessions = await getCollection("attendance", function () { return []; });
      const idx = sessions.findIndex(function (s) { return s.course === course && (s.section || "Section A") === section && s.date === date; });
      const session = { id: idx >= 0 ? sessions[idx].id : newId("att"), course: course, section: section, date: date, records: records };
      if (idx >= 0) sessions[idx] = session; else sessions.push(session);

      await setCollection("attendance", sessions);
      await logActivity("Attendance recorded for " + courseDef.name + " (" + section + ") on " + date + " (" + presentCount + "/" + records.length + " present).");
      return res.status(200).json(session);
    }

    return res.status(404).json({ error: "No such attendance route." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
