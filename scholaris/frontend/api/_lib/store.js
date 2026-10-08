const crypto = require("crypto");
let Redis = null;
try {
  Redis = require("@upstash/redis").Redis;
} catch (e) {
  // @upstash/redis optional
}

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function getRedisClient() {
  if (!URL || !TOKEN || !Redis) return null;
  if (!redis) {
    try {
      redis = new Redis({ url: URL, token: TOKEN });
    } catch (e) {
      console.warn("Failed to initialize Redis client, falling back to in-memory store:", e.message);
      redis = null;
    }
  }
  return redis;
}

// In-memory fallback store when Redis is not connected
global._inMemoryStore = global._inMemoryStore || {};

function newId(prefix) {
  return prefix + "-" + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10));
}

function loadDataFile(filename, fallback) {
  try {
    return JSON.parse(JSON.stringify(require("./data/" + filename)));
  } catch (e) {
    return fallback ? fallback() : [];
  }
}

function seedStudents() {
  return loadDataFile("students.json", function () {
    return [
      { id: newId("stu"), rollNumber: "RA2511003030018", name: "Aadi Saxena", section: "Section A", course: "CSE-CORE", enrollDate: new Date().toISOString() }
    ];
  });
}

function seedFaculty() {
  return loadDataFile("faculty.json", function () {
    return [
      { id: newId("fac"), name: "Dr. Arthur Vance", designation: "Associate Professor", department: "Computer Science & Engineering", subject: "Advanced Programming Practice", course: "CSE-CORE", experience: 12, email: "arthur.vance@regengine.edu", phone: "+91 98101 23456" }
    ];
  });
}

function seedNotices() {
  return loadDataFile("notices.json", function () {
    return [];
  });
}

function seedCalendar() {
  return loadDataFile("calendar.json", function () {
    return [];
  });
}

function seedTimetable() {
  return loadDataFile("timetable.json", function () {
    return [];
  });
}

function seedAttendance() {
  return loadDataFile("attendance.json", function () {
    return [];
  });
}

function seedActivity() {
  return loadDataFile("activity.json", function () {
    return [{ id: newId("log"), text: "Registrar server initialised with sample records.", time: new Date().toISOString() }];
  });
}

// Returns the stored collection, seeding it on first access.
async function getCollection(key, seedFn) {
  const r = getRedisClient();
  if (r) {
    try {
      const existing = await r.get(key);
      if (existing !== null && existing !== undefined) return existing;
      const seeded = seedFn ? seedFn() : [];
      await r.set(key, seeded);
      return seeded;
    } catch (err) {
      console.warn("Redis get error for " + key + ", falling back to memory:", err.message);
    }
  }

  if (global._inMemoryStore[key] === undefined) {
    global._inMemoryStore[key] = seedFn ? seedFn() : [];
  }
  return global._inMemoryStore[key];
}

async function setCollection(key, value) {
  const r = getRedisClient();
  if (r) {
    try {
      await r.set(key, value);
    } catch (err) {
      console.warn("Redis set error for " + key + ", saving to memory only:", err.message);
    }
  }
  global._inMemoryStore[key] = value;
  return value;
}

async function logActivity(text) {
  const current = await getCollection("activity", seedActivity);
  current.unshift({ id: newId("log"), text: text, time: new Date().toISOString() });
  while (current.length > 30) current.pop();
  await setCollection("activity", current);
}

module.exports = {
  newId: newId,
  getCollection: getCollection,
  setCollection: setCollection,
  logActivity: logActivity,
  seedStudents: seedStudents,
  seedFaculty: seedFaculty,
  seedNotices: seedNotices,
  seedCalendar: seedCalendar,
  seedTimetable: seedTimetable,
  seedAttendance: seedAttendance,
  seedActivity: seedActivity
};
