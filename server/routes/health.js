const express = require('express');

module.exports = function healthRoutes() {
  const router = express.Router();
  router.get('/health', (req, res) => res.json({ status: 'ok' }));
  return router;
};
