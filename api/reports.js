'use strict';
// SDR daily reports (with optional compressed call-log image). SDR submits their
// own + sees their own history; manager sees everyone's.
const { requireAuth } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const isMgr = (u) => u.role === 'manager' || u.role === 'admin';
const MAX_IMG = 1600 * 1024; // ~1.6MB cap (client compresses well under this)

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const me = requireAuth(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    if (req.method === 'GET') {
      let reports = await crm.list('reports');
      if (!isMgr(me)) reports = reports.filter((r) => r.userId === me.uid);
      reports.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return res.status(200).json({ reports });
    }

    if (req.method === 'POST') {
      const b = readBody(req);
      let image = null;
      if (b.image && typeof b.image === 'string' && b.image.startsWith('data:image/')) {
        if (b.image.length > MAX_IMG) return res.status(413).json({ error: 'Image too large — please use a smaller screenshot' });
        image = b.image;
      }
      const report = {
        id: crm.rid('rp'), userId: me.uid, userName: me.name,
        date: new Date().toISOString().slice(0, 10),
        calls: +b.calls || 0, meetings: +b.meetings || 0, summary: String(b.summary || '').slice(0, 2000),
        image, ts: Date.now(),
      };
      return res.status(201).json({ report: await crm.put('reports', report) });
    }

    if (req.method === 'DELETE') {
      if (!isMgr(me)) return res.status(403).json({ error: 'Only a manager can delete reports' });
      const b = readBody(req);
      if (!b.id) return res.status(400).json({ error: 'id required' });
      await crm.del('reports', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
