const { getCollection, setCollection, logActivity, seedFaculty } = require("../_lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(404).json({ error: "No such faculty route." });
  try {
    const id = req.query.id;
    const faculty = await getCollection("faculty", seedFaculty);
    const target = faculty.find(function (f) { return f.id === id; });
    if (!target) return res.status(404).json({ error: "Faculty member not found." });

    const remaining = faculty.filter(function (f) { return f.id !== id; });
    await setCollection("faculty", remaining);
    await logActivity(target.name + " was removed from the faculty directory.");
    return res.status(200).json({ removed: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error." });
  }
};
