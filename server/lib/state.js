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

module.exports = {
  DEFAULT_STATE,
  CHARACTER_MAX_HP,
  createDefaultState,
  ACHIEVEMENT_DEFINITIONS,
  getDefaultProgression,
  normalizeProgression,
  publicAchievementDefinitions
};
