'use strict';
const { sign, safeEqual } = require('../lib/auth');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username = '', password = '' } = readBody(req);
  const ADMIN_USER = process.env.ADMIN_USERNAME || '';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || '';

  if (!ADMIN_PASS) return res.status(500).json({ error: 'Admin login not configured on the server' });

  const userOk = ADMIN_USER ? safeEqual(username, ADMIN_USER) : true;
  const passOk = safeEqual(password, ADMIN_PASS);

  if (userOk && passOk) {
    const token = sign({ role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 8 }); // 8h
    return res.status(200).json({ ok: true, token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
};
