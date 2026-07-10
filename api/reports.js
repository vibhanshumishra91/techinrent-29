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
    const today = new Date().toISOString().slice(0, 10);

    if (req.method === 'GET') {
      let reports = await crm.list('reports');
      if (!isMgr(me)) reports = reports.filter((r) => r.userId === me.uid);
      reports.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      const out = { reports };
      // Daily call counts are a manager-only metric.
      if (isMgr(me)) { try { out.callCountsToday = await crm.callCounts(today); } catch (e) { out.callCountsToday = {}; } }
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      const b = readBody(req);

      // Lightweight call-tap counter (SDR taps "Call" → +1 for today). Manager-visible only.
      if (b.action === 'call') {
        let count = 0;
        try { count = await crm.incrCall(me.uid, today); } catch (e) {}
        return res.status(200).json({ ok: true, count });
      }

      let image = null;
      if (b.image && typeof b.image === 'string' && b.image.startsWith('data:image/')) {
        if (b.image.length > MAX_IMG) return res.status(413).json({ error: 'Image too large — please use a smaller screenshot' });
        image = b.image;
        // Offload the screenshot to Vercel Blob (keeps the Redis DB lean).
        // Falls back to inline storage if Blob is unavailable — a report is never rejected over storage.
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const { put } = require('@vercel/blob');
            const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(b.image);
            if (m) {
              const ext = (m[1].split('/')[1] || 'jpg').replace('jpeg', 'jpg');
              const blob = await put('call-logs/' + me.uid + '-' + today + '-' + Date.now() + '.' + ext,
                Buffer.from(m[2], 'base64'), { access: 'public', contentType: m[1] });
              image = blob.url;
            }
          } catch (e) { /* keep inline data URL */ }
        }
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
      // Best-effort: remove the offloaded Blob image too, so no orphan files pile up.
      try {
        const rep = await crm.get('reports', b.id);
        if (rep && rep.image && /^https:\/\/.*\.blob\.vercel-storage\.com\//.test(rep.image) && process.env.BLOB_READ_WRITE_TOKEN) {
          const { del } = require('@vercel/blob');
          await del(rep.image);
        }
      } catch (e) { /* never block the delete */ }
      await crm.del('reports', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
