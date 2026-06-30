'use strict';
// Server-side leads. Manager sees all; SDR sees only leads assigned to them.
const { requireAuth } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const isMgr = (u) => u.role === 'manager' || u.role === 'admin';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const me = requireAuth(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    if (req.method === 'GET') {
      let leads = await crm.list('leads');
      if (!isMgr(me)) leads = leads.filter((l) => l.ownerId === me.uid);
      leads.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.status(200).json({ leads });
    }

    if (req.method === 'POST') {
      const b = readBody(req);
      const now = Date.now();
      const lead = {
        id: crm.rid('ld'), name: (b.name || 'Unknown').trim(), email: b.email || '', phone: b.phone || '',
        company: b.company || '', service: b.service || 'Lead Generation', source: b.source || 'Manual',
        stage: b.stage || 'New Lead', ownerId: isMgr(me) ? (b.ownerId || null) : me.uid,
        value: +b.value || 0, followUpAt: b.followUpAt || null,
        notes: [], activities: [{ ts: now, by: me.uid, type: 'created', text: 'Lead created' }], createdAt: now,
      };
      return res.status(201).json({ lead: await crm.put('leads', lead) });
    }

    if (req.method === 'PATCH') {
      const b = readBody(req);
      if (!b.id) return res.status(400).json({ error: 'id required' });
      const cur = await crm.get('leads', b.id);
      if (!cur) return res.status(404).json({ error: 'Lead not found' });
      if (!isMgr(me) && cur.ownerId !== me.uid) return res.status(403).json({ error: 'Not your lead' });
      const allowed = {};
      ['name', 'email', 'phone', 'company', 'service', 'stage', 'value', 'followUpAt'].forEach((k) => { if (b[k] !== undefined) allowed[k] = b[k]; });
      if (isMgr(me) && b.ownerId !== undefined) allowed.ownerId = b.ownerId || null;
      if (b.addNote) { cur.notes = cur.notes || []; cur.notes.push({ ts: Date.now(), by: me.uid, text: String(b.addNote) }); allowed.notes = cur.notes; }
      if (b.activity) { cur.activities = cur.activities || []; cur.activities.push({ ts: Date.now(), by: me.uid, type: b.activity.type || 'touch', text: b.activity.text || '' }); allowed.activities = cur.activities; }
      return res.status(200).json({ lead: await crm.patch('leads', b.id, allowed) });
    }

    if (req.method === 'DELETE') {
      const b = readBody(req);
      if (!isMgr(me)) return res.status(403).json({ error: 'Manager only' });
      if (!b.id) return res.status(400).json({ error: 'id required' });
      await crm.del('leads', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
