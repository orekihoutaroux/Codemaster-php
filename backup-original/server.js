require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const PORT = process.env.PORT || 3000;

const DEFAULT_STATE = {
  score: 0, level: 1, streak: 0, wrongStreak: 0, bestStreak: 0,
  totalCorrect: 0, totalAnswered: 0, answeredIds: [],
  hp: 100, maxHp: 100, floor: 1, gold: 0, potions: 2,
  monstersDefeated: 0, bossesDefeated: 0,
  buffDef: 0, buffGold: 0, buffCrit: 0, buffTime: 0,
  specialCharge: 0, specialShield: 0
};

const CHARACTER_MAX_HP = {
  'THE SCHOLAR': 100,
  'THE WIZARD': 90,
  'THE KNIGHT': 120,
  'THE HACKER': 95,
  'THE MENTOR': 110,
  'THE DEBUGGER': 105
};

function createDefaultState(character) {
  const maxHp = CHARACTER_MAX_HP[String(character || '').trim()] || DEFAULT_STATE.maxHp;
  return { ...DEFAULT_STATE, hp: maxHp, maxHp };
}

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_correct', icon: '</>', name: 'First Compile', description: 'Answer your first question correctly.', title: 'Code Initiate', metric: 'correctAnswers', target: 1, rank: 1 },
  { id: 'streak_5', icon: '5X', name: 'Clean Run', description: 'Reach a 5-answer streak.', title: 'Combo Coder', metric: 'bestStreak', target: 5, rank: 2 },
  { id: 'hard_answer', icon: 'H', name: 'Hard Logic', description: 'Answer a hard question correctly.', title: 'Logic Breaker', metric: 'hardAnswers', target: 1, rank: 3 },
  { id: 'monster_1', icon: '01', name: 'First Debug', description: 'Defeat your first programming monster.', title: 'Bug Hunter', metric: 'monstersDefeated', target: 1, rank: 4 },
  { id: 'monster_10', icon: '10', name: 'Bug Exterminator', description: 'Defeat 10 programming monsters.', title: 'Syntax Slayer', metric: 'monstersDefeated', target: 10, rank: 5 },
  { id: 'boss_1', icon: 'B1', name: 'Boss Breaker', description: 'Defeat your first floor boss.', title: 'Boss Breaker', metric: 'bossesDefeated', target: 1, rank: 6 },
  { id: 'correct_25', icon: '25', name: 'Study Session', description: 'Answer 25 questions correctly.', title: 'Code Scholar', metric: 'correctAnswers', target: 25, rank: 7 },
  { id: 'floor_3', icon: 'F3', name: 'Secure the Network', description: 'Reach the cybersecurity floor.', title: 'Cyber Guardian', metric: 'highestFloor', target: 3, rank: 8 },
  { id: 'level_5', icon: 'L5', name: 'Level Five', description: 'Reach character level 5.', title: 'Code Architect', metric: 'highestLevel', target: 5, rank: 9 },
  { id: 'boss_3', icon: 'B3', name: 'Dungeon Dominator', description: 'Defeat 3 floor bosses.', title: 'Dungeon Conqueror', metric: 'bossesDefeated', target: 3, rank: 10 },
  { id: 'floor_5', icon: 'F5', name: 'Through the Inferno', description: 'Reach the inferno floor.', title: 'Inferno Coder', metric: 'highestFloor', target: 5, rank: 11 },
  { id: 'correct_100', icon: '100', name: 'PHP Mastery', description: 'Answer 100 questions correctly.', title: 'PHP Master', metric: 'correctAnswers', target: 100, rank: 12 }
];

function getDefaultProgression() {
  return {
    activeTitle: 'PHP Novice',
    unlockedAchievementIds: [],
    unlockedAt: {},
    stats: {
      correctAnswers: 0,
      hardAnswers: 0,
      monstersDefeated: 0,
      bossesDefeated: 0,
      bestStreak: 0,
      highestFloor: 1,
      highestLevel: 1,
      highestScore: 0
    }
  };
}

function normalizeProgression(progression, state) {
  const defaults = getDefaultProgression();
  const stored = progression && typeof progression === 'object' ? progression : {};
  const storedStats = stored.stats && typeof stored.stats === 'object' ? stored.stats : {};
  const currentState = state && typeof state === 'object' ? state : {};
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };

  const stats = {
    correctAnswers: Math.max(number(storedStats.correctAnswers), number(currentState.totalCorrect)),
    hardAnswers: number(storedStats.hardAnswers),
    monstersDefeated: Math.max(number(storedStats.monstersDefeated), number(currentState.monstersDefeated)),
    bossesDefeated: Math.max(number(storedStats.bossesDefeated), number(currentState.bossesDefeated)),
    bestStreak: Math.max(number(storedStats.bestStreak), number(currentState.bestStreak)),
    highestFloor: Math.max(1, number(storedStats.highestFloor, 1), number(currentState.floor, 1)),
    highestLevel: Math.max(1, number(storedStats.highestLevel, 1), number(currentState.level, 1)),
    highestScore: Math.max(number(storedStats.highestScore), number(currentState.score))
  };
  const unlockedAchievementIds = Array.isArray(stored.unlockedAchievementIds)
    ? [...new Set(stored.unlockedAchievementIds.map(String))]
    : [];
  const unlockedAt = stored.unlockedAt && typeof stored.unlockedAt === 'object' ? stored.unlockedAt : {};
  const earned = ACHIEVEMENT_DEFINITIONS.filter((achievement) => stats[achievement.metric] >= achievement.target);
  earned.forEach((achievement) => {
    if (!unlockedAchievementIds.includes(achievement.id)) unlockedAchievementIds.push(achievement.id);
  });
  const highest = ACHIEVEMENT_DEFINITIONS
    .filter((achievement) => unlockedAchievementIds.includes(achievement.id))
    .sort((a, b) => b.rank - a.rank)[0];

  return {
    activeTitle: highest ? highest.title : (stored.activeTitle || defaults.activeTitle),
    unlockedAchievementIds,
    unlockedAt,
    stats,
    updatedAt: stored.updatedAt || null
  };
}

function publicAchievementDefinitions() {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({ ...achievement }));
}

const PASSWORD_MIN_LENGTH = 6;

function createPasswordRecord(password) {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString('hex');
  return { passwordSalt, passwordHash };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  if (!passwordSalt || !passwordHash) return false;
  const candidate = crypto.scryptSync(password, passwordSalt, 64);
  const stored = Buffer.from(passwordHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

async function main() {
  const db = await connectDB();
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Older versions stored brand-new admin questions in question_edits, where
  // RESET EDITS could remove them. Move those records into the permanent
  // questions collection before serving requests. Existing records are never
  // overwritten during this migration.
  async function migrateAddedQuestionsToPermanentStorage() {
    const storedIds = await db.collection('questions').distinct('id');
    const addedEdits = await db.collection('question_edits').find(
      { id: { $nin: storedIds } },
      { projection: { _id: 0 } }
    ).toArray();

    if (!addedEdits.length) return 0;

    const migratedAt = new Date();
    await db.collection('questions').bulkWrite(addedEdits.map((question) => ({
      updateOne: {
        filter: { id: question.id },
        update: {
          $setOnInsert: {
            ...question,
            isCustom: true,
            source: 'admin',
            createdAt: question.createdAt || migratedAt,
            updatedAt: question.updatedAt || migratedAt
          }
        },
        upsert: true
      }
    })));
    await db.collection('question_edits').deleteMany({ id: { $in: addedEdits.map((question) => question.id) } });
    console.log(`[db] Migrated ${addedEdits.length} added question(s) to permanent storage.`);
    return addedEdits.length;
  }

  await migrateAddedQuestionsToPermanentStorage();

  // ---------- Health ----------
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // ---------- Questions ----------
  // Returns the base question bank with any admin edits merged on top.
  async function getMergedQuestions() {
    const base = await db.collection('questions').find({}, { projection: { _id: 0 } }).toArray();
    const edits = await db.collection('question_edits').find({}, { projection: { _id: 0 } }).toArray();
    const editsById = new Map(edits.map((e) => [e.id, e]));
    const merged = base.map((q) => editsById.get(q.id) || q);
    // Legacy support: any pre-migration custom edit is still included until its
    // next server restart moves it into permanent question storage.
    const baseIds = new Set(base.map((q) => q.id));
    edits.forEach((e) => { if (!baseIds.has(e.id)) merged.push(e); });
    return merged;
  }

  app.get('/api/questions', async (req, res) => {
    try {
      res.json({ status: 'ok', questions: await getMergedQuestions() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load questions' });
    }
  });

  app.post('/api/admin/questions', async (req, res) => {
    try {
      const body = req.body || {};
      const id = parseInt(body.id, 10) || 0;
      const choices = [body.choice_0, body.choice_1, body.choice_2, body.choice_3].map((c) => String(c || '').trim());
      const answer = parseInt(body.answer, 10) || 0;
      if (id <= 0 || choices.includes('') || answer < 0 || answer > 3) {
        return res.status(400).json({ status: 'error', message: 'Invalid question data' });
      }
      const questionFields = {
        id,
        cat: String(body.cat || '').trim(),
        diff: String(body.diff || 'easy').trim(),
        type: String(body.type || 'multiple').trim(),
        q: String(body.q || '').trim(),
        choices,
        answer,
        explain: String(body.explain || '').trim()
      };
      if (!questionFields.q) {
        return res.status(400).json({ status: 'error', message: 'Question text is required' });
      }

      const questions = db.collection('questions');
      const storedQuestion = await questions.findOne({ id });
      const now = new Date();
      let question;
      let persistence;

      if (!storedQuestion) {
        question = {
          ...questionFields,
          isCustom: true,
          source: 'admin',
          createdAt: now,
          updatedAt: now
        };
        await questions.updateOne({ id }, { $setOnInsert: question }, { upsert: true });
        persistence = 'permanent';
      } else if (storedQuestion.isCustom === true || storedQuestion.source === 'admin') {
        question = {
          ...questionFields,
          isCustom: true,
          source: 'admin',
          createdAt: storedQuestion.createdAt || now,
          updatedAt: now
        };
        await questions.updateOne({ id }, { $set: question });
        persistence = 'permanent';
      } else {
        question = { ...questionFields, updatedAt: now };
        await db.collection('question_edits').updateOne({ id }, { $set: question }, { upsert: true });
        persistence = 'built_in_edit';
      }

      res.json({ status: 'ok', question, persistence });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to save question' });
    }
  });

  app.post('/api/admin/questions/reset', async (req, res) => {
    try {
      const resetResult = await db.collection('question_edits').deleteMany({});
      const preservedCustom = await db.collection('questions').countDocuments({
        $or: [{ isCustom: true }, { source: 'admin' }]
      });
      res.json({
        status: 'ok',
        resetBuiltInEdits: resetResult.deletedCount,
        preservedCustom
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset questions' });
    }
  });

  // ---------- Player save state ----------
  app.get('/api/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const doc = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, username: 1, profile: 1, state: 1, progression: 1, updatedAt: 1 } }
      );
      if (!doc) return res.json({ status: 'not_found', state: null });
      res.json({
        status: 'ok',
        username: doc.username,
        profile: doc.profile || null,
        state: doc.state,
        progression: normalizeProgression(doc.progression, doc.state),
        updatedAt: doc.updatedAt
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load player state' });
    }
  });

  app.post('/api/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      let state = req.body && req.body.state ? req.body.state : {};
      const clientSavedAt = Number(req.body && req.body.savedAt) || 0;
      const existing = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, levelResetAt: 1, progressResetAt: 1 } }
      );
      if (existing && existing.progressResetAt && clientSavedAt && clientSavedAt < new Date(existing.progressResetAt).getTime()) {
        state = { ...DEFAULT_STATE };
      } else if (existing && existing.levelResetAt && clientSavedAt && clientSavedAt < new Date(existing.levelResetAt).getTime()) {
        state = { ...state, level: 1 };
      }
      const updatedAt = new Date();
      await db.collection('players').updateOne(
        { username },
        { $set: { username, state, updatedAt } },
        { upsert: true }
      );
      res.json({ status: 'ok', updatedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to save player state' });
    }
  });

  // ---------- Permanent titles and achievements ----------
  // Progression lives outside the resettable run state so unlocked titles and
  // achievements remain on the account across reloads and new dungeon runs.
  app.get('/api/players/:username/progression', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, username: 1, state: 1, progression: 1 } }
      );
      if (!player) return res.status(404).json({ status: 'not_found', message: 'Player not found' });
      res.json({
        status: 'ok',
        progression: normalizeProgression(player.progression, player.state),
        definitions: publicAchievementDefinitions()
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load player progression' });
    }
  });

  app.post('/api/players/:username/progression/event', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const body = req.body || {};
      const event = String(body.event || '').trim();
      const metrics = body.metrics && typeof body.metrics === 'object' ? body.metrics : {};
      const allowedEvents = new Set(['progress_sync', 'correct_answer', 'monster_defeated', 'boss_defeated']);
      if (!allowedEvents.has(event)) {
        return res.status(400).json({ status: 'error', message: 'Unknown progression event' });
      }

      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, state: 1, progression: 1 } }
      );
      if (!player) return res.status(404).json({ status: 'not_found', message: 'Player not found' });

      const safeNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
      };
      const increments = {};
      const maxima = {
        'progression.stats.bestStreak': safeNumber(metrics.bestStreak),
        'progression.stats.highestFloor': Math.max(1, safeNumber(metrics.floor, 1)),
        'progression.stats.highestLevel': Math.max(1, safeNumber(metrics.level, 1)),
        'progression.stats.highestScore': safeNumber(metrics.score)
      };

      if (event === 'progress_sync') {
        maxima['progression.stats.correctAnswers'] = safeNumber(metrics.totalCorrect);
        maxima['progression.stats.monstersDefeated'] = safeNumber(metrics.monstersDefeated);
        maxima['progression.stats.bossesDefeated'] = safeNumber(metrics.bossesDefeated);
      } else if (event === 'correct_answer') {
        increments['progression.stats.correctAnswers'] = 1;
        if (String(metrics.difficulty || '').toLowerCase() === 'hard') {
          increments['progression.stats.hardAnswers'] = 1;
        }
      } else if (event === 'monster_defeated') {
        increments['progression.stats.monstersDefeated'] = 1;
      } else if (event === 'boss_defeated') {
        increments['progression.stats.bossesDefeated'] = 1;
      }

      const eventAt = new Date();
      const eventUpdate = { $max: maxima, $set: { 'progression.updatedAt': eventAt, updatedAt: eventAt } };
      if (Object.keys(increments).length) eventUpdate.$inc = increments;
      await db.collection('players').updateOne({ username }, eventUpdate);

      const updatedPlayer = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, state: 1, progression: 1 } }
      );
      const previousIds = updatedPlayer.progression && Array.isArray(updatedPlayer.progression.unlockedAchievementIds)
        ? updatedPlayer.progression.unlockedAchievementIds.map(String)
        : [];
      const progression = normalizeProgression(updatedPlayer.progression, updatedPlayer.state);
      const newlyUnlockedIds = progression.unlockedAchievementIds.filter((id) => !previousIds.includes(id));
      newlyUnlockedIds.forEach((id) => { progression.unlockedAt[id] = eventAt; });
      progression.updatedAt = eventAt;
      await db.collection('players').updateOne(
        { username },
        { $set: { progression, updatedAt: eventAt } }
      );

      res.json({
        status: 'ok',
        progression,
        definitions: publicAchievementDefinitions(),
        newlyUnlocked: ACHIEVEMENT_DEFINITIONS.filter((achievement) => newlyUnlockedIds.includes(achievement.id))
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to update player progression' });
    }
  });

  // Create an account after hero selection. Existing accounts must provide the
  // correct password and keep all saved progress.
  app.post('/api/players/:username/start', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      if (!username) {
        return res.status(400).json({ status: 'error', message: 'Username is required' });
      }

      const body = req.body || {};
      const password = String(body.password || '');
      if (password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
        return res.status(400).json({ status: 'error', message: 'Password must be 6 to 128 characters' });
      }
      const profile = {
        role: String(body.role || 'Student').trim().slice(0, 20),
        yearLevel: String(body.yearLevel || '').trim().slice(0, 10),
        block: String(body.block || '').trim().slice(0, 10),
        character: String(body.character || '').trim().slice(0, 40)
      };
      const now = new Date();
      const existing = await db.collection('players').findOne({ username });
      let created = false;

      if (existing) {
        if (existing.passwordHash && !verifyPassword(password, existing.passwordSalt, existing.passwordHash)) {
          return res.status(401).json({ status: 'error', message: 'Username already exists or password is incorrect' });
        }
        const update = { username, profile, updatedAt: now };
        // Legacy player rows are upgraded the first time their owner completes
        // hero selection with a password.
        if (!existing.passwordHash) Object.assign(update, createPasswordRecord(password));
        await db.collection('players').updateOne({ username }, { $set: update });
      } else {
        const passwordRecord = createPasswordRecord(password);
        await db.collection('players').insertOne({
          username,
          profile,
          state: createDefaultState(profile.character),
          progression: getDefaultProgression(),
          ...passwordRecord,
          createdAt: now,
          updatedAt: now
        });
        created = true;
      }

      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, username: 1, profile: 1, state: 1, progression: 1, createdAt: 1, updatedAt: 1 } }
      );

      res.json({
        status: 'ok',
        created,
        player
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to start player' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const body = req.body || {};
      const username = String(body.username || '').trim().slice(0, 24);
      const password = String(body.password || '');
      const player = await db.collection('players').findOne({ username });

      if (!player || !verifyPassword(password, player.passwordSalt, player.passwordHash)) {
        return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
      }

      res.json({
        status: 'ok',
        player: {
          username: player.username,
          profile: player.profile || null,
          state: player.state || { ...DEFAULT_STATE },
          progression: normalizeProgression(player.progression, player.state),
          updatedAt: player.updatedAt
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to log in' });
    }
  });

  app.post('/api/players/:username/reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const player = await db.collection('players').findOne(
        { username },
        { projection: { _id: 0, profile: 1 } }
      );
      const resetState = createDefaultState(player && player.profile && player.profile.character);
      await db.collection('players').updateOne(
        { username },
        { $set: { username, state: resetState, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ status: 'ok', state: resetState });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset player state' });
    }
  });

  app.post('/api/players/:username/level/reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const updatedAt = new Date();
      const result = await db.collection('players').updateOne(
        { username },
        { $set: { 'state.level': 1, levelResetAt: updatedAt, updatedAt } }
      );
      if (!result.matchedCount) {
        return res.status(404).json({ status: 'not_found', message: 'Player not found' });
      }
      res.json({ status: 'ok', level: 1, updatedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset player level' });
    }
  });

  // Preserve the completed/interrupted run, then start the player with a clean
  // active state. The client sends its immediate local cache so a reload cannot
  // lose progress that had not finished reaching MongoDB yet.
  app.post('/api/players/:username/progress/archive-reset', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const player = await db.collection('players').findOne({ username });
      if (!player) {
        return res.status(404).json({ status: 'not_found', message: 'Player not found' });
      }

      const body = req.body || {};
      const submittedState = body.state && typeof body.state === 'object' ? body.state : null;
      const submittedAt = Number(body.savedAt) || 0;
      const serverUpdatedAt = player.updatedAt ? new Date(player.updatedAt).getTime() : 0;
      const archivedState = submittedState && submittedAt >= serverUpdatedAt
        ? submittedState
        : (player.state || { ...DEFAULT_STATE });
      const archivedAt = new Date();

      const archive = await db.collection('player_progress_history').insertOne({
        username,
        profile: player.profile || null,
        state: archivedState,
        reason: 'page_reload',
        sourceSavedAt: submittedAt ? new Date(submittedAt) : player.updatedAt,
        archivedAt
      });

      await db.collection('players').updateOne(
        { username },
        {
          $set: {
            state: createDefaultState(player.profile && player.profile.character),
            progressResetAt: archivedAt,
            updatedAt: archivedAt
          }
        }
      );

      res.json({
        status: 'ok',
        archived: true,
        archiveId: String(archive.insertedId),
        state: createDefaultState(player.profile && player.profile.character),
        updatedAt: archivedAt
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to archive and reset progress' });
    }
  });

  // Admin: list every saved player (for the "Manage Users" panel).
  app.get('/api/players', async (req, res) => {
    try {
      const docs = await db.collection('players')
        .find({}, { projection: { _id: 0, username: 1, profile: 1, state: 1, createdAt: 1, updatedAt: 1 } })
        .sort({ updatedAt: -1 })
        .toArray();
      const players = docs.map((d) => ({ username: d.username, updatedAt: d.updatedAt, state: d.state }));
      res.json({ status: 'ok', players });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load players' });
    }
  });

  // Admin: combine saved players with everyone who appears on the leaderboard.
  // A leaderboard-only user gets a preview state and can be promoted to a saved
  // player from the admin panel without changing their leaderboard history.
  app.get('/api/admin/users', async (req, res) => {
    try {
      const [playerDocs, leaderboardRows] = await Promise.all([
        db.collection('players')
          .find({}, { projection: { _id: 0, username: 1, profile: 1, state: 1, createdAt: 1, updatedAt: 1 } })
          .toArray(),
        db.collection('leaderboard')
          .find({}, { projection: { _id: 0 } })
          .sort({ score: -1, createdAt: -1 })
          .toArray()
      ]);

      const usersByName = new Map();

      playerDocs.forEach((player) => {
        const username = String(player.username || '').trim();
        if (!username) return;
        usersByName.set(username.toLowerCase(), {
          username,
          updatedAt: player.updatedAt,
          state: player.state || { ...DEFAULT_STATE },
          profile: player.profile || null,
          leaderboardOnly: false,
          leaderboard: null
        });
      });

      leaderboardRows.forEach((row, index) => {
        const username = String(row.name || '').trim();
        if (!username) return;
        const key = username.toLowerCase();
        const leaderboard = {
          rank: index + 1,
          score: parseInt(row.score, 10) || 0,
          floor: parseInt(row.floor, 10) || 1,
          character: String(row.character || ''),
          role: String(row.role || ''),
          yearLevel: String(row.yearLevel || ''),
          block: String(row.block || ''),
          createdAt: row.createdAt
        };

        if (usersByName.has(key)) {
          // Rows are score-sorted, so the first matching row is the best result.
          const existing = usersByName.get(key);
          if (!existing.leaderboard) existing.leaderboard = leaderboard;
          return;
        }

        usersByName.set(key, {
          username,
          updatedAt: row.createdAt,
          state: {
            ...DEFAULT_STATE,
            score: leaderboard.score,
            floor: leaderboard.floor
          },
          leaderboardOnly: true,
          leaderboard
        });
      });

      const users = Array.from(usersByName.values()).sort((a, b) => {
        const aScore = parseInt(a.state && a.state.score, 10) || 0;
        const bScore = parseInt(b.state && b.state.score, 10) || 0;
        return bScore - aScore || a.username.localeCompare(b.username);
      });

      res.json({ status: 'ok', players: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load admin users' });
    }
  });

  // Admin: permanently delete a player's save.
  app.delete('/api/players/:username', async (req, res) => {
    try {
      const username = String(req.params.username || '').trim().slice(0, 24);
      const result = await db.collection('players').deleteOne({ username });
      res.json({ status: 'ok', deleted: result.deletedCount > 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to delete player' });
    }
  });

  // ---------- Leaderboard ----------
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const rows = await db.collection('leaderboard')
        .find({}, { projection: { _id: 0 } })
        .sort({ score: -1 })
        .limit(50)
        .toArray();
      const ranked = rows.map((row, i) => ({ rank: i + 1, ...row }));
      res.json({ status: 'ok', leaderboard: ranked });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load leaderboard' });
    }
  });

  app.post('/api/leaderboard', async (req, res) => {
    try {
      const body = req.body || {};
      const row = {
        name: String(body.name || 'Anonymous').trim().slice(0, 40),
        character: String(body.character || '').trim(),
        score: parseInt(body.score, 10) || 0,
        floor: parseInt(body.floor, 10) || 1,
        role: String(body.role || 'Student').trim(),
        yearLevel: String(body.yearLevel || '-').trim(),
        block: String(body.block || '-').trim(),
        createdAt: new Date()
      };
      await db.collection('leaderboard').insertOne(row);
      res.json({ status: 'ok' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to submit score' });
    }
  });

  app.listen(PORT, () => {
    console.log(`[server] CodeMaster PHP running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
