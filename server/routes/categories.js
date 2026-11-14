const express = require('express');
const { listCategories, addCategory } = require('../lib/categories');

// Mounted after the admin-session check in server.js, so both routes need an
// admin login.
module.exports = function categoriesRoutes(db) {
  const router = express.Router();

  router.get('/admin/categories', async (req, res) => {
    try {
      res.json({ status: 'ok', categories: await listCategories(db) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load categories' });
    }
  });

  router.post('/admin/categories', async (req, res) => {
    try {
      const result = await addCategory(db, (req.body || {}).name, req.adminUsername);
      if (result.error) return res.status(result.status).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', category: result.category, categories: await listCategories(db) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to add category' });
    }
  });

  return router;
};
