const { getCollection, setCollection, logActivity, seedStudents } = require("../_lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(404).json({ error: "No such student route." });
  try {
    const id = req.query.id;
    const students = await getCollection("students", seedStudents);
    const target = students.find(function (s) { return s.id === id; });
    if (!target) return res.status(404).json({ error: "Student not found." });

    const remaining = students.filter(function (s) { return s.id !== id; });
    await setCollection("students", remaining);
    await logActivity(target.name + " (" + target.rollNumber + ") was removed from the register.");
    return res.status(200).json({ removed: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
