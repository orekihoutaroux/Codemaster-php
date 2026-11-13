const express = require('express');
const { ACHIEVEMENT_DEFINITIONS, normalizeProgression, publicAchievementDefinitions } = require('../lib/state');

module.exports = function progressionRoutes(db) {
  const router = express.Router();

  // Permanent titles and achievements live outside the resettable run state so
  // unlocked titles and achievements remain on the account across reloads and
  // new dungeon runs.
  router.get('/players/:username/progression', async (req, res) => {
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

  router.post('/players/:username/progression/event', async (req, res) => {
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

  return router;
};
