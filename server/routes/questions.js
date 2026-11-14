const express = require('express');
const { getStoredQuestions, saveQuestion, restoreBuiltInQuestions } = require('../lib/questions');
const { normalizeCategory, rememberCategory } = require('../lib/categories');

module.exports = function questionsRoutes(db) {
  const router = express.Router();

  router.get('/questions', async (req, res) => {
    try {
      const questions = await getStoredQuestions(db);
      res.json({ status: 'ok', storage: 'mongodb', count: questions.length, questions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load questions' });
    }
  });

  router.post('/admin/questions', async (req, res) => {
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
        cat: normalizeCategory(body.cat).slice(0, 24) || 'basics',
        diff: ['easy', 'medium', 'hard'].includes(String(body.diff || '').trim()) ? String(body.diff).trim() : 'easy',
        type: String(body.type || '').trim() === 'code' ? 'code' : 'multiple',
        q: String(body.q || '').trim(),
        choices,
        answer,
        explain: String(body.explain || '').trim()
      };
      if (!questionFields.q) {
        return res.status(400).json({ status: 'error', message: 'Question text is required' });
      }

      const saved = await saveQuestion(db, questionFields);
      await rememberCategory(db, questionFields.cat, req.adminUsername);
      res.json({ status: 'ok', storage: 'mongodb', ...saved });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to save question' });
    }
  });

  router.post('/admin/questions/reset', async (req, res) => {
    try {
      const result = await restoreBuiltInQuestions(db);
      res.json({ status: 'ok', storage: 'mongodb', ...result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to reset questions' });
    }
  });

  return router;
};
