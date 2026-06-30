'use strict';
const { sign, safeEqual } = require('../lib/auth');
const users = require('../lib/users');
const rl = require('../lib/ratelimit');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = readBody(req);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const uname = username.toLowerCase();

  // Rate-limit per username+IP (fails open if Redis is down)
  const rlKey = uname + '|' + clientIp(req);
  const lim = await rl.hit(rlKey);
  if (!lim.allowed) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });

  let authed = null;

  // 1) Primary path: server-side user store (scrypt-hashed passwords)
  try {
    const u = await users.getByUsername(uname);
    if (u && u.status !== 'inactive' && users.verifyPassword(password, u.passHash, u.passSalt)) {
      authed = { id: u.id, role: u.role, name: u.name, username: u.usernameDisplay || u.username };
    }
  } catch (e) { /* store unavailable — fall through to env fallback */ }

  // 2) Emergency fallback: env-configured manager (so you can never be locked out)
  if (!authed) {
    const EU = (process.env.ADMIN_USERNAME || '').toLowerCase();
    const EP = process.env.ADMIN_PASSWORD || '';
    if (EU && EP && safeEqual(uname, EU) && safeEqual(password, EP)) {
      authed = { id: 'u1', role: 'manager', name: process.env.ADMIN_USERNAME, username: process.env.ADMIN_USERNAME };
    }
  }

  if (!authed) return res.status(401).json({ error: 'Invalid credentials' });

  await rl.reset(rlKey);
  const token = sign({ uid: authed.id, role: authed.role, name: authed.name, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 8 });
  return res.status(200).json({ ok: true, token, user: authed });
};
