require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { ensureQuestionsSeeded, migrateQuestionEditsIntoQuestions } = require('./lib/questions');
const { ensureDefaultAdmin, requireAdmin } = require('./lib/admins');
const { ensureDefaultCategories } = require('./lib/categories');
const { ensureLessonsSeeded } = require('./lib/lessons');

const healthRoutes = require('./routes/health');
const questionsRoutes = require('./routes/questions');
const playersRoutes = require('./routes/players');
const progressionRoutes = require('./routes/progression');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const adminsRoutes = require('./routes/admins');
const categoriesRoutes = require('./routes/categories');
const lessonsRoutes = require('./routes/lessons');

const PORT = process.env.PORT || 3000;

async function main() {
  const db = await connectDB();
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // The question bank lives in MongoDB. Fill it on first boot and fold in any
  // edits an older version left in the separate "question_edits" collection.
  await migrateQuestionEditsIntoQuestions(db);
  await ensureQuestionsSeeded(db);
  await ensureDefaultAdmin(db);
  await ensureDefaultCategories(db);
  await ensureLessonsSeeded(db);

  app.use('/api', healthRoutes(db));
  // Admin login/logout and admin management. Everything else under /api/admin
  // (question edits, the user list) and deleting a player now needs a valid
  // admin session; the routes the game itself uses stay open.
  app.use('/api', adminsRoutes(db));
  const adminOnly = requireAdmin(db);
  app.use('/api/admin', adminOnly);
  app.delete('/api/players/:username', adminOnly);
  app.use('/api', categoriesRoutes(db));
  app.use('/api', questionsRoutes(db));
  app.use('/api', lessonsRoutes(db));
  app.use('/api', playersRoutes(db));
  app.use('/api', progressionRoutes(db));
  app.use('/api', authRoutes(db));
  app.use('/api', leaderboardRoutes(db));

  // Unknown API routes and malformed JSON bodies answer in JSON, so the
  // client's res.json() never chokes on an HTML error page.
  app.use('/api', (req, res) => {
    res.status(404).json({ status: 'error', message: 'Unknown API route' });
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ status: 'error', message: status === 400 ? 'Invalid request body' : 'Server error' });
  });

  app.listen(PORT, () => {
    console.log(`[server] CodeMaster PHP listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
