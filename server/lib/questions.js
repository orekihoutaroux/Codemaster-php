const fs = require('fs');
const path = require('path');

// Every question the game asks lives in the "questions" collection in MongoDB.
// This file is the only place that reads or writes it.
const SEED_FILE = path.join(__dirname, '..', 'data', 'questions_seed.json');

const QUESTION_FIELDS = ['id', 'cat', 'diff', 'type', 'q', 'choices', 'answer', 'explain'];

function readSeedQuestions() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
  if (!Array.isArray(seed) || !seed.length) throw new Error('questions_seed.json is empty or not an array');
  return seed;
}

// Keeps only the fields a question is allowed to have, so stray keys from an
// older record can never clash with the bookkeeping fields set below.
function pickQuestionFields(question) {
  const picked = {};
  QUESTION_FIELDS.forEach((key) => { if (question[key] !== undefined) picked[key] = question[key]; });
  return picked;
}

// Called on every boot: stores the starter bank in MongoDB the first time it
// meets an empty database, so the game never runs on the browser's offline
// copy. Questions already stored are left exactly as they are.
async function ensureQuestionsSeeded(db) {
  const seed = readSeedQuestions();
  const now = new Date();
  const result = await db.collection('questions').bulkWrite(seed.map((question) => ({
    updateOne: {
      filter: { id: question.id },
      update: {
        $setOnInsert: {
          ...pickQuestionFields(question),
          source: 'seed',
          isCustom: false,
          edited: false,
          createdAt: now,
          updatedAt: now
        }
      },
      upsert: true
    }
  })));

  const stored = await db.collection('questions').countDocuments({});
  if (result.upsertedCount) {
    console.log(`[db] Stored ${result.upsertedCount} starter question(s) in MongoDB.`);
  }
  console.log(`[db] Question bank: ${stored} question(s) in the "questions" collection.`);
  return { inserted: result.upsertedCount, stored };
}

// Older versions kept admin changes in a separate "question_edits" collection,
// where RESET EDITS could lose them. Fold any leftovers into "questions" so
// there is a single source of truth, then drop the old records.
async function migrateQuestionEditsIntoQuestions(db) {
  const edits = await db.collection('question_edits').find({}, { projection: { _id: 0 } }).toArray();
  if (!edits.length) return 0;

  const now = new Date();
  const storedIds = await db.collection('questions').distinct('id');
  await db.collection('questions').bulkWrite(edits.map((question) => {
    const wasStored = storedIds.includes(question.id);
    return {
      updateOne: {
        filter: { id: question.id },
        update: {
          $set: {
            ...pickQuestionFields(question),
            // An edit to a question that is not in the bank was an added one.
            source: wasStored ? 'seed' : 'admin',
            isCustom: !wasStored,
            edited: wasStored,
            updatedAt: question.updatedAt || now
          },
          $setOnInsert: { createdAt: question.createdAt || now }
        },
        upsert: true
      }
    };
  }));
  await db.collection('question_edits').deleteMany({ id: { $in: edits.map((question) => question.id) } });
  console.log(`[db] Moved ${edits.length} question edit(s) from "question_edits" into "questions".`);
  return edits.length;
}

// The question bank, straight from MongoDB (without deleted questions).
async function getStoredQuestions(db) {
  return db.collection('questions')
    .find({ deleted: { $ne: true } }, { projection: { _id: 0 } })
    .sort({ id: 1 })
    .toArray();
}

// The id for the next new question: one past every id ever used, deleted
// questions included, so a new question never takes a deleted one's id.
async function getNextQuestionId(db) {
  const top = await db.collection('questions')
    .find({}, { projection: { _id: 0, id: 1 } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();
  return ((top[0] && Number(top[0].id)) || 0) + 1;
}

// Deletes a question. A question an admin added is removed for good. A starter
// question is only marked deleted: the starter bank is stored again on every
// boot (ensureQuestionsSeeded), so removing it would bring it back, and RESET
// BUILT-IN EDITS can restore it. The last question of a difficulty is kept,
// because the game needs at least one of each.
async function deleteQuestion(db, id) {
  const questions = db.collection('questions');
  const existing = await questions.findOne({ id, deleted: { $ne: true } });
  if (!existing) return { error: 'That question no longer exists.', status: 404 };
  const sameDifficulty = await questions.countDocuments({ diff: existing.diff, deleted: { $ne: true } });
  if (sameDifficulty <= 1) {
    return { error: `This is the last ${existing.diff} question. The game needs at least one, so add another before deleting it.`, status: 400 };
  }
  const isCustom = existing.source === 'admin' || existing.isCustom === true;
  if (isCustom) {
    await questions.deleteOne({ id });
  } else {
    const now = new Date();
    await questions.updateOne({ id }, { $set: { deleted: true, deletedAt: now, updatedAt: now } });
  }
  const remaining = await questions.countDocuments({ deleted: { $ne: true } });
  return { deleted: id, builtIn: !isCustom, remaining };
}

// Writes one question to MongoDB. A question that is not in the bank yet is
// created as a custom question; an existing one is updated in place and keeps
// whether it came from the starter bank or was added by an admin.
async function saveQuestion(db, fields) {
  const questions = db.collection('questions');
  const existing = await questions.findOne({ id: fields.id });
  const now = new Date();

  if (!existing) {
    const question = {
      ...pickQuestionFields(fields),
      source: 'admin',
      isCustom: true,
      edited: false,
      createdAt: now,
      updatedAt: now
    };
    await questions.updateOne({ id: fields.id }, { $set: question }, { upsert: true });
    return { question, persistence: 'created' };
  }

  const isCustom = existing.source === 'admin' || existing.isCustom === true;
  const question = {
    ...pickQuestionFields(fields),
    source: isCustom ? 'admin' : 'seed',
    isCustom,
    edited: !isCustom,
    updatedAt: now
  };
  await questions.updateOne({ id: fields.id }, { $set: question, $unset: { deleted: '', deletedAt: '' } });
  return {
    question: { ...question, createdAt: existing.createdAt || now },
    persistence: isCustom ? 'updated_custom' : 'updated_builtin'
  };
}

// Puts every starter question back to its original wording, and brings back
// starter questions that were deleted. Questions an admin added stay untouched.
async function restoreBuiltInQuestions(db) {
  const seed = readSeedQuestions();
  const now = new Date();
  await db.collection('questions').bulkWrite(seed.map((question) => ({
    updateOne: {
      filter: { id: question.id },
      update: {
        $set: {
          ...pickQuestionFields(question),
          source: 'seed',
          isCustom: false,
          edited: false,
          updatedAt: now
        },
        $unset: { deleted: '', deletedAt: '' },
        $setOnInsert: { createdAt: now }
      },
      upsert: true
    }
  })));
  const customKept = await db.collection('questions').countDocuments({
    $or: [{ isCustom: true }, { source: 'admin' }]
  });
  return { restored: seed.length, customKept };
}

module.exports = {
  readSeedQuestions,
  ensureQuestionsSeeded,
  migrateQuestionEditsIntoQuestions,
  getStoredQuestions,
  getNextQuestionId,
  deleteQuestion,
  saveQuestion,
  restoreBuiltInQuestions
};
