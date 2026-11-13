require('dotenv').config();
const { connectDB } = require('./db');
const { ensureQuestionsSeeded, migrateQuestionEditsIntoQuestions } = require('./lib/questions');

// The server seeds the question bank itself on every boot, so running this is
// optional. It is kept so you can fill MongoDB without starting the game.
async function seed() {
  const db = await connectDB();

  await migrateQuestionEditsIntoQuestions(db);
  const { inserted, stored } = await ensureQuestionsSeeded(db);

  if (!inserted) console.log('[seed] Every starter question was already stored; nothing to add.');
  console.log(`[seed] Done. "questions" holds ${stored} question(s).`);

  // Player accounts and leaderboard rows are created by real users only.
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
