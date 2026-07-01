'use strict';
// Shared activity log. GET: manager sees all team activity, SDR sees own.
// POST: append an entry (actor taken from the auth token). Powers the Activity
// Logs view and the notifications bell across devices.
const { requireAuth } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const isMgr = (u) => u.role === 'manager' || u.role === 'admin';
const MAX = 400; // keep the log bounded

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const me = requireAuth(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    if (req.method === 'GET') {
      let logs = await crm.list('activity');
      if (!isMgr(me)) logs = logs.filter((l) => l.userId === me.uid);
      logs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return res.status(200).json({ logs: logs.slice(0, 120) });
    }
    if (req.method === 'POST') {
      const b = readBody(req);
      const action = String(b.action || '').slice(0, 200);
      if (!action) return res.status(400).json({ error: 'action required' });
      const entry = { id: crm.rid('ac'), userId: me.uid, userName: me.name, action, ts: Date.now() };
      await crm.put('activity', entry);
      // Best-effort trim so the hash never grows unbounded.
      try {
        const all = await crm.list('activity');
        if (all.length > MAX) {
          all.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          for (const old of all.slice(0, all.length - MAX)) await crm.del('activity', old.id);
        }
      } catch (e) { /* ignore trim errors */ }
      return res.status(201).json({ entry });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
