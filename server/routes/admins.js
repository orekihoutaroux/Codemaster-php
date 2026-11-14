const express = require('express');
const { loginAdmin, logoutAdmin, requireAdmin, readBearerToken, listAdmins, addAdmin, removeAdmin } = require('../lib/admins');

module.exports = function adminsRoutes(db) {
  const router = express.Router();
  const adminOnly = requireAdmin(db);

  router.post('/admin/login', async (req, res) => {
    try {
      const body = req.body || {};
      const session = await loginAdmin(db, body.username, body.password);
      if (!session) {
        return res.status(401).json({ status: 'error', message: 'Invalid admin username or password' });
      }
      res.json({ status: 'ok', ...session });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Login failed' });
    }
  });

  router.post('/admin/logout', async (req, res) => {
    try {
      await logoutAdmin(db, readBearerToken(req));
      res.json({ status: 'ok' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Logout failed' });
    }
  });

  router.get('/admin/admins', adminOnly, async (req, res) => {
    try {
      res.json({ status: 'ok', you: req.adminUsername, admins: await listAdmins(db) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to load admins' });
    }
  });

  router.post('/admin/admins', adminOnly, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await addAdmin(db, body.username, body.password, req.adminUsername);
      if (result.error) return res.status(result.status).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', admin: result.admin });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to add admin' });
    }
  });

  router.delete('/admin/admins/:username', adminOnly, async (req, res) => {
    try {
      const result = await removeAdmin(db, req.params.username, req.adminUsername);
      if (result.error) return res.status(result.status).json({ status: 'error', message: result.error });
      res.json({ status: 'ok', removed: result.removed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: 'Failed to remove admin' });
    }
  });

  return router;
};
