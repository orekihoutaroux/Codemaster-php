// Question categories live in the "categories" collection. The starter set
// matches the Study Materials topics plus the categories the starter
// questions use. Admins can add more from the question editor.
const DEFAULT_CATEGORIES = [
  'basics', 'variables', 'strings', 'arrays', 'control', 'functions',
  'oop', 'coding', 'advanced', 'modern php', 'traits', 'references'
];

// Lowercase, single spaces, letters/numbers/space/dash only, 2-24 chars.
function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function validateCategory(name) {
  if (!/^[a-z0-9][a-z0-9 -]{0,22}[a-z0-9]$/.test(name)) {
    return 'Category must be 2-24 letters, numbers, spaces or dashes';
  }
  return null;
}

// Only fills an empty collection, so a starter category an admin deleted
// does not come back on the next server restart.
async function ensureDefaultCategories(db) {
  if ((await db.collection('categories').countDocuments({})) > 0) return;
  const now = new Date();
  await db.collection('categories').bulkWrite(DEFAULT_CATEGORIES.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, createdBy: 'system', createdAt: now } },
      upsert: true
    }
  })));
}

// Stored categories plus any category a question already uses, sorted A-Z.
async function listCategories(db) {
  const stored = await db.collection('categories').distinct('name');
  const used = await db.collection('questions').distinct('cat');
  const all = new Set();
  stored.concat(used).forEach((c) => { const n = normalizeCategory(c); if (n) all.add(n); });
  return Array.from(all).sort();
}

async function addCategory(db, value, createdBy) {
  const name = normalizeCategory(value);
  const problem = validateCategory(name);
  if (problem) return { error: problem, status: 400 };
  const existing = await listCategories(db);
  if (existing.includes(name)) return { error: `"${name}" already exists`, status: 409 };
  await db.collection('categories').updateOne(
    { name },
    { $setOnInsert: { name, createdBy: createdBy || 'admin', createdAt: new Date() } },
    { upsert: true }
  );
  return { category: name };
}

// Deletes a category nobody uses. A category still used by questions is
// refused (with the count), so no question is left pointing at a category
// that is not in the list; the last remaining category is kept too.
async function removeCategory(db, value) {
  const name = normalizeCategory(value);
  if (!name) return { error: 'Category is required', status: 400 };
  const inUse = await db.collection('questions').countDocuments({ cat: name });
  if (inUse > 0) {
    return {
      error: `${inUse} question${inUse === 1 ? '' : 's'} still use "${name}". Move ${inUse === 1 ? 'it' : 'them'} to another category first.`,
      status: 409,
      inUse
    };
  }
  const all = await listCategories(db);
  if (!all.includes(name)) return { error: 'Category not found', status: 404 };
  if (all.length <= 1) return { error: 'At least one category must remain', status: 400 };
  await db.collection('categories').deleteOne({ name });
  return { removed: name };
}

// Makes sure a category used by a saved question is in the list.
async function rememberCategory(db, value, createdBy) {
  const name = normalizeCategory(value);
  if (!name || validateCategory(name)) return;
  await db.collection('categories').updateOne(
    { name },
    { $setOnInsert: { name, createdBy: createdBy || 'admin', createdAt: new Date() } },
    { upsert: true }
  );
}

module.exports = { DEFAULT_CATEGORIES, normalizeCategory, ensureDefaultCategories, listCategories, addCategory, removeCategory, rememberCategory };
