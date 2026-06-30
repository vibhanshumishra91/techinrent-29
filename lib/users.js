'use strict';
// Server-side user store backed by Upstash Redis, with scrypt-hashed passwords.
// No plaintext passwords are ever stored or returned to the client.
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
function client() {
  if (!url || !token) throw new Error('Storage not configured: missing KV/Upstash REST credentials');
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

const UKEY = 'users';        // hash: uid -> user JSON (includes passHash/passSalt)
const NKEY = 'users:byname'; // hash: lowercase username -> uid (uniqueness + lookup)

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const h = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(h, 'hex'), b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parse(v) { if (v == null) return null; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch (e) { return null; } }
function publicUser(u) { if (!u) return null; const { passHash, passSalt, ...rest } = u; return rest; }

async function getById(id) { return parse(await client().hget(UKEY, id)); }
async function getByUsername(username) {
  const lc = String(username || '').trim().toLowerCase();
  if (!lc) return null;
  const uid = await client().hget(NKEY, lc);
  return uid ? getById(uid) : null;
}
async function listUsers() {
  const all = (await client().hgetall(UKEY)) || {};
  return Object.values(all).map(parse).filter(Boolean).map(publicUser)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
async function countManagers() {
  const all = (await client().hgetall(UKEY)) || {};
  return Object.values(all).map(parse).filter((x) => x && x.role === 'manager').length;
}
async function createUser({ id, name, username, password, role, createdBy, status }) {
  name = String(name || '').trim();
  username = String(username || '').trim();
  const lc = username.toLowerCase();
  if (!name || !username || !password) throw new Error('Name, username and password are required');
  if (String(password).length < 6) throw new Error('Password must be at least 6 characters');
  if (await client().hget(NKEY, lc)) throw new Error('That username is already taken');
  const { hash, salt } = hashPassword(password);
  id = id || ('u_' + crypto.randomBytes(5).toString('hex'));
  const user = {
    id, name, username: lc, usernameDisplay: username,
    role: role === 'manager' ? 'manager' : 'sdr',
    status: status || 'active',
    passHash: hash, passSalt: salt, createdAt: Date.now(), createdBy: createdBy || null,
  };
  await client().hset(UKEY, { [id]: JSON.stringify(user) });
  await client().hset(NKEY, { [lc]: id });
  return publicUser(user);
}
async function updateUser(id, patch) {
  const u = await getById(id);
  if (!u) return null;
  if (patch.name != null && String(patch.name).trim()) u.name = String(patch.name).trim();
  if (patch.status != null) u.status = patch.status === 'inactive' ? 'inactive' : 'active';
  if (patch.password) {
    if (String(patch.password).length < 6) throw new Error('Password must be at least 6 characters');
    const { hash, salt } = hashPassword(patch.password); u.passHash = hash; u.passSalt = salt;
  }
  if (patch.username && String(patch.username).trim().toLowerCase() !== u.username) {
    const lc = String(patch.username).trim().toLowerCase();
    if (await client().hget(NKEY, lc)) throw new Error('That username is already taken');
    await client().hdel(NKEY, u.username);
    u.username = lc; u.usernameDisplay = String(patch.username).trim();
    await client().hset(NKEY, { [lc]: id });
  }
  u.updatedAt = Date.now();
  await client().hset(UKEY, { [id]: JSON.stringify(u) });
  return publicUser(u);
}
async function deleteUser(id) {
  const u = await getById(id);
  if (!u) return false;
  await client().hdel(UKEY, id);
  await client().hdel(NKEY, u.username);
  return true;
}

module.exports = {
  hashPassword, verifyPassword, getById, getByUsername, listUsers,
  countManagers, createUser, updateUser, deleteUser, publicUser,
  configured: !!(url && token),
};
