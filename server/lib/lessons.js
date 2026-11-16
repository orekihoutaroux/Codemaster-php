const fs = require('fs');
const path = require('path');

// The lessons shown in STUDY MATERIALS live in the "lessons" collection.
// Built-in lessons come from data/lessons_seed.json; admins can edit them and
// add their own. This file is the only place that reads or writes lessons.
const SEED_FILE = path.join(__dirname, '..', 'data', 'lessons_seed.json');
const LESSON_FIELDS = ['id', 'order', 'tab', 'title', 'intro', 'body', 'remember'];
const LIMITS = { tab: 18, title: 80, intro: 600, body: 30000, rememberItem: 240, rememberCount: 8 };

function readSeedLessons() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  if (!Array.isArray(seed) || !seed.length) throw new Error('lessons_seed.json is empty or not an array');
  return seed;
}

function pickLessonFields(lesson) {
  const picked = {};
  LESSON_FIELDS.forEach((key) => { if (lesson[key] !== undefined) picked[key] = lesson[key]; });
  return picked;
}

// A lesson id becomes part of the page (id="learn-<id>"), so keep it simple.
function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
}

// Checks and cleans what the admin form sent. Returns { lesson } or { error }.
function validateLesson(input) {
  const body = input || {};
  const lesson = {
    tab: String(body.tab || '').trim().toUpperCase(),
    title: String(body.title || '').trim(),
    intro: String(body.intro || '').trim(),
    body: String(body.body || '').replace(/\r\n/g, '\n').trim(),
    remember: (Array.isArray(body.remember) ? body.remember : String(body.remember || '').split('\n'))
      .map((line) => String(line).trim()).filter(Boolean)
  };
  const order = Number(body.order);
  if (Number.isFinite(order) && order > 0) lesson.order = Math.round(order);
  if (!lesson.title) return { error: 'A lesson needs a title.' };
  if (!lesson.tab) lesson.tab = lesson.title.toUpperCase().slice(0, LIMITS.tab);
  if (lesson.tab.length > LIMITS.tab) return { error: `The tab label can be at most ${LIMITS.tab} characters.` };
  if (lesson.title.length > LIMITS.title) return { error: `The title can be at most ${LIMITS.title} characters.` };
  if (lesson.intro.length > LIMITS.intro) return { error: `The introduction can be at most ${LIMITS.intro} characters.` };
  if (!lesson.body) return { error: 'The lesson content is empty.' };
  if (lesson.body.length > LIMITS.body) return { error: 'The lesson content is too long.' };
  if (lesson.remember.length > LIMITS.rememberCount) return { error: `Use at most ${LIMITS.rememberCount} "Remember" points.` };
  if (lesson.remember.some((line) => line.length > LIMITS.rememberItem)) return { error: 'Each "Remember" point must be a single short line.' };
  return { lesson };
}

// Called on every boot: adds any built-in lesson that is not stored yet.
// Lessons already stored (including edited ones) are left exactly as they are.
async function ensureLessonsSeeded(db) {
  const seed = readSeedLessons();
  const now = new Date();
  const result = await db.collection('lessons').bulkWrite(seed.map((lesson) => ({
    updateOne: {
      filter: { id: lesson.id },
      update: { $setOnInsert: { ...pickLessonFields(lesson), source: 'seed', edited: false, createdAt: now, updatedAt: now } },
      upsert: true
    }
  })));
  if (result.upsertedCount) console.log(`[db] Stored ${result.upsertedCount} built-in lesson(s) in MongoDB.`);
  return result.upsertedCount;
}

// Keeps positions 1, 2, 3 ... with no gaps or ties. If movedId is given, that
// lesson is placed at position "wanted" and the others shift around it.
async function renumberLessons(db, movedId, wanted) {
  const collection = db.collection('lessons');
  const all = await collection.find({}).sort({ order: 1, createdAt: 1 }).toArray();
  let list = all;
  if (movedId) {
    const moved = all.find((lesson) => lesson.id === movedId);
    list = all.filter((lesson) => lesson.id !== movedId);
    if (moved) {
      const index = Math.max(0, Math.min(list.length, (Number(wanted) || list.length + 1) - 1));
      list.splice(index, 0, moved);
    }
  }
  const changes = list
    .map((lesson, i) => ({ id: lesson.id, order: i + 1, old: lesson.order }))
    .filter((item) => item.order !== item.old);
  if (changes.length) {
    await collection.bulkWrite(changes.map((item) => ({ updateOne: { filter: { id: item.id }, update: { $set: { order: item.order } } } })));
  }
}

async function listLessons(db) {
  return db.collection('lessons')
    .find({}, { projection: { _id: 0 } })
    .sort({ order: 1, createdAt: 1 })
    .toArray();
}

// Create (no id) or update (existing id) one lesson.
async function saveLesson(db, input, id, adminUsername) {
  const { lesson, error } = validateLesson(input);
  if (error) return { error };
  const now = new Date();
  const collection = db.collection('lessons');
  if (id) {
    const existing = await collection.findOne({ id });
    if (!existing) return { error: 'That lesson no longer exists.', status: 404 };
    const wanted = lesson.order || existing.order;
    delete lesson.order;
    await collection.updateOne({ id }, { $set: { ...lesson, edited: existing.source === 'seed', updatedAt: now, updatedBy: adminUsername || null } });
    await renumberLessons(db, id, wanted);
    return { lesson: await collection.findOne({ id }, { projection: { _id: 0 } }), created: false };
  }
  let base = slugify(lesson.title) || 'lesson';
  let newId = base;
  for (let n = 2; await collection.findOne({ id: newId }); n += 1) newId = `${base}-${n}`;
  const wanted = lesson.order;
  const count = await collection.countDocuments({});
  lesson.order = count + 1;
  await collection.insertOne({ id: newId, ...lesson, source: 'admin', edited: false, createdAt: now, updatedAt: now, updatedBy: adminUsername || null });
  await renumberLessons(db, newId, wanted || count + 1);
  return { lesson: await collection.findOne({ id: newId }, { projection: { _id: 0 } }), created: true };
}

async function deleteLesson(db, id) {
  const collection = db.collection('lessons');
  if ((await collection.countDocuments({})) <= 1) return { error: 'Keep at least one lesson.', status: 400 };
  const result = await collection.deleteOne({ id });
  if (!result.deletedCount) return { error: 'That lesson no longer exists.', status: 404 };
  await renumberLessons(db);
  return { deleted: id };
}

// Puts every built-in lesson back to its original text (re-adding any that
// were deleted). Lessons added by admins are kept.
async function restoreBuiltInLessons(db) {
  const seed = readSeedLessons();
  const now = new Date();
  await db.collection('lessons').bulkWrite(seed.map((lesson) => ({
    updateOne: {
      filter: { id: lesson.id },
      update: {
        $set: { ...pickLessonFields(lesson), source: 'seed', edited: false, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      upsert: true
    }
  })));
  // Built-in lessons go back to their original places; added lessons follow.
  const custom = await db.collection('lessons').find({ source: 'admin' }).sort({ order: 1, createdAt: 1 }).toArray();
  if (custom.length) {
    await db.collection('lessons').bulkWrite(custom.map((lesson, i) => ({ updateOne: { filter: { id: lesson.id }, update: { $set: { order: seed.length + i + 1 } } } })));
  }
  await renumberLessons(db);
  return { restored: seed.length, total: await db.collection('lessons').countDocuments({}) };
}

module.exports = { ensureLessonsSeeded, listLessons, saveLesson, deleteLesson, restoreBuiltInLessons, validateLesson };
