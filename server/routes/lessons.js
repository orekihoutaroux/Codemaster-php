const express = require('express');
const { listLessons, saveLesson, deleteLesson, restoreBuiltInLessons } = require('../lib/lessons');

// STUDY MATERIALS. Reading is public; everything under /admin needs an admin
// session (checked in server.js before these routes run).
module.exports = function lessonsRoutes(db) {
  const router = express.Router();

  router.get('/lessons', async (req, res) => {
    try {
      const lessons = await listLessons(db);
      res.json({ status: 'ok', count: lessons.length, lessons });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load lessons' });
    }
  });

  router.post('/admin/lessons', async (req, res) => {
    try {
      const result = await saveLesson(db, req.body, null, req.adminUsername);
      if (result.error) return res.status(result.status || 400).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', ...result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to add lesson' });
    }
  });

  router.post('/admin/lessons/reset', async (req, res) => {
    try {
      res.json({ status: 'ok', ...(await restoreBuiltInLessons(db)) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to restore lessons' });
    }
  });

  router.post('/admin/lessons/:id', async (req, res) => {
    try {
      const result = await saveLesson(db, req.body, String(req.params.id), req.adminUsername);
      if (result.error) return res.status(result.status || 400).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', ...result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to save lesson' });
    }
  });

  router.delete('/admin/lessons/:id', async (req, res) => {
    try {
      const result = await deleteLesson(db, String(req.params.id));
      if (result.error) return res.status(result.status || 400).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', ...result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to delete lesson' });
    }
  });

  return router;
};
