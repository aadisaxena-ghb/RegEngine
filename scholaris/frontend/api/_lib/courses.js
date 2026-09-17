const COURSES = [
  { code: "CSE-CORE", name: "B.Tech CSE Core",        department: "Computer Science",         capacity: 60 },
  { code: "CSE-AIML", name: "B.Tech CSE AIML",         department: "Computer Science",         capacity: 60 },
  { code: "CSE-DS",   name: "B.Tech CSE Data Science", department: "Computer Science",         capacity: 50 },
  { code: "ECE",      name: "B.Tech ECE",              department: "Electronics & Communication", capacity: 50 }
];

function byCode(code) {
  return COURSES.find(function (c) { return c.code === code; }) || null;
}

module.exports = { COURSES: COURSES, byCode: byCode };
