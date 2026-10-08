const COURSES = [
  { code: "CSE-CORE",  name: "B.Tech Computer Science & Engineering (Core)", capacity: 180, department: "Computer Science & Engineering" },
  { code: "CSE-AIML",  name: "B.Tech CSE (AI & Machine Learning)", capacity: 120, department: "Computer Science & Engineering" },
  { code: "CSE-DS",    name: "B.Tech CSE (Data Science)", capacity: 60, department: "Computer Science & Engineering" },
  { code: "CSE-CYBER", name: "B.Tech CSE (Cyber Security)", capacity: 60, department: "Computer Science & Engineering" },
  { code: "CSE-CLOUD", name: "B.Tech CSE (Cloud Computing)", capacity: 60, department: "Computer Science & Engineering" },
  { code: "ECE",       name: "B.Tech Electronics & Communication Engineering", capacity: 60, department: "Electronics & Communication" },
  { code: "ECE-VLSI",  name: "B.Tech Electronics (VLSI Design & Technology)", capacity: 60, department: "Electronics & Communication" },
  { code: "MECH",      name: "B.Tech Mechanical Engineering", capacity: 60, department: "Mechanical & Automobile Engineering" },
  { code: "AUTO",      name: "B.Tech Automobile Engineering", capacity: 60, department: "Mechanical & Automobile Engineering" },
  { code: "BCA",       name: "Bachelor of Computer Applications (BCA)", capacity: 60, department: "Computer Applications" },
  { code: "BCA-DS",    name: "BCA (Data Science)", capacity: 60, department: "Computer Applications" },
  { code: "MCA",       name: "Master of Computer Applications (MCA)", capacity: 60, department: "Computer Applications" },
  { code: "MCA-AI",    name: "MCA (Generative AI)", capacity: 60, department: "Computer Applications" },
  { code: "BBA",       name: "Bachelor of Business Administration (BBA)", capacity: 60, department: "Management Studies" },
  { code: "MBA",       name: "Master of Business Administration (MBA)", capacity: 60, department: "Management Studies" }
];

function byCode(c) {
  for (var i = 0; i < COURSES.length; i++) {
    if (COURSES[i].code === c) return COURSES[i];
  }
  return null;
}

module.exports = {
  COURSES: COURSES,
  byCode: byCode
};
