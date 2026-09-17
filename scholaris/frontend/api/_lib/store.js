const { Redis } = require("@upstash/redis");
const crypto = require("crypto");

// Vercel's Marketplace Redis integration (Upstash-backed) injects credentials
// under one of these two naming conventions depending on how it was
// connected. We check both rather than assuming one.
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function client() {
  if (!URL || !TOKEN) {
    throw new Error(
      "No Redis database is connected to this project. In the Vercel dashboard, go to " +
      "Storage \u2192 Connect Database \u2192 Redis (Marketplace, Upstash-backed), connect it to this " +
      "project, then redeploy."
    );
  }
  if (!redis) redis = new Redis({ url: URL, token: TOKEN });
  return redis;
}

function newId(prefix) {
  return prefix + "-" + crypto.randomUUID().slice(0, 8);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedStudents() {
  return [
    { id: newId("stu"), rollNumber: "SIT24CS041", name: "Ananya Sharma", fatherName: "Rakesh Sharma", motherName: "Meena Sharma", phone: "98110 22341", address: "Sector 12, Dwarka, New Delhi", percentage12: "91.4", course: "CSE-CORE", enrollDate: isoDaysAgo(46) },
    { id: newId("stu"), rollNumber: "SIT24CS118", name: "Vihaan Mehta", fatherName: "Sunil Mehta", motherName: "Pooja Mehta", phone: "99887 65432", address: "Kothrud, Pune", percentage12: "88.7", course: "CSE-AIML", enrollDate: isoDaysAgo(44) },
    { id: newId("stu"), rollNumber: "SIT24DS027", name: "Ishita Verma", fatherName: "Manoj Verma", motherName: "Suman Verma", phone: "97654 12098", address: "Indiranagar, Bengaluru", percentage12: "93.2", course: "CSE-DS", enrollDate: isoDaysAgo(40) },
    { id: newId("stu"), rollNumber: "SIT24EC009", name: "Arjun Nair", fatherName: "Prakash Nair", motherName: "Lakshmi Nair", phone: "90210 44556", address: "Vastrapur, Ahmedabad", percentage12: "85.9", course: "ECE", enrollDate: isoDaysAgo(38) },
    { id: newId("stu"), rollNumber: "SIT24CS204", name: "Kabir Singh", fatherName: "Harpreet Singh", motherName: "Simran Singh", phone: "93123 87765", address: "Model Town, Ludhiana", percentage12: "79.6", course: "CSE-CORE", enrollDate: isoDaysAgo(21) }
  ];
}

function seedFaculty() {
  return [
    { id: newId("fac"), name: "Dr. Rohan Kapoor", designation: "Associate Professor", department: "Computer Science", subject: "Data Structures & Algorithms", course: "CSE-CORE", experience: "11", email: "r.kapoor@scholaris.edu", phone: "98765 11223" },
    { id: newId("fac"), name: "Dr. Neha Iyer", designation: "Assistant Professor", department: "Computer Science", subject: "Machine Learning", course: "CSE-AIML", experience: "7", email: "n.iyer@scholaris.edu", phone: "98765 33445" },
    { id: newId("fac"), name: "Prof. Aditya Rao", designation: "Professor", department: "Electronics & Communication", subject: "Digital Signal Processing", course: "ECE", experience: "16", email: "a.rao@scholaris.edu", phone: "98765 55667" }
  ];
}

function seedActivity() {
  return [{ id: newId("log"), text: "Registrar server initialised with sample records.", time: new Date().toISOString() }];
}

// Returns the stored collection, seeding it on first access.
async function getCollection(key, seedFn) {
  const r = client();
  const existing = await r.get(key);
  if (existing !== null && existing !== undefined) return existing;
  const seeded = seedFn ? seedFn() : [];
  await r.set(key, seeded);
  return seeded;
}

async function setCollection(key, value) {
  await client().set(key, value);
  return value;
}

async function logActivity(text) {
  const current = await getCollection("activity", seedActivity);
  current.unshift({ id: newId("log"), text: text, time: new Date().toISOString() });
  while (current.length > 25) current.pop();
  await setCollection("activity", current);
}

module.exports = {
  newId: newId,
  getCollection: getCollection,
  setCollection: setCollection,
  logActivity: logActivity,
  seedStudents: seedStudents,
  seedFaculty: seedFaculty,
  seedActivity: seedActivity
};
