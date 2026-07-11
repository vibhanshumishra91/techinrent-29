'use strict';
// Partners / clients. GET is public (for the website Partners page); writes are manager-only.
const { requireManager } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const MAX_LOGO = 1200 * 1024; // ~1.2MB data URL cap

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
    // ---- Sales Partner Revenue (manager-only) — folded in here to stay within the function cap ----
    const rb = readBody(req);
    if ((req.query && req.query.resource === 'revenue') || rb.resource === 'revenue') {
      const mgr = requireManager(req);
      if (!mgr) return res.status(401).json({ error: 'Unauthorized' });

      if (req.method === 'GET') {
        const rows = (await crm.list('revenue')).sort((a, b) => (b.paymentTs || b.createdAt || 0) - (a.paymentTs || a.createdAt || 0));
        return res.status(200).json({ revenue: rows });
      }
      if (req.method === 'POST' || req.method === 'PATCH') {
        const editing = req.method === 'PATCH';
        if (editing && !rb.id) return res.status(400).json({ error: 'id required' });
        const cur = editing ? await crm.get('revenue', rb.id) : null;
        if (editing && !cur) return res.status(404).json({ error: 'Entry not found' });
        const clientName = rb.clientName !== undefined ? String(rb.clientName).trim() : (cur && cur.clientName) || '';
        if (!clientName) return res.status(400).json({ error: 'Client name is required' });
        const revenue = rb.revenue !== undefined ? (+rb.revenue || 0) : (cur ? cur.revenue : 0);
        const percent = rb.percent !== undefined ? Math.max(0, Math.min(100, +rb.percent || 0)) : (cur ? cur.percent : 0);
        const paymentDate = rb.paymentDate !== undefined ? String(rb.paymentDate).slice(0, 10) : (cur ? cur.paymentDate : '');
        const rec = {
          id: editing ? cur.id : crm.rid('rv'),
          partner: (rb.partner !== undefined ? String(rb.partner) : (cur && cur.partner) || '').slice(0, 120),
          clientName: clientName.slice(0, 120),
          service: (rb.service !== undefined ? String(rb.service) : (cur && cur.service) || '').slice(0, 120),
          revenue, percent, commission: Math.round(revenue * percent) / 100,
          paymentDate, paymentTs: paymentDate ? new Date(paymentDate).getTime() : (cur ? cur.paymentTs : Date.now()),
          note: (rb.note !== undefined ? String(rb.note) : (cur && cur.note) || '').slice(0, 300),
          createdAt: editing ? cur.createdAt : Date.now(),
        };
        return res.status(editing ? 200 : 201).json({ entry: await crm.put('revenue', rec) });
      }
      if (req.method === 'DELETE') {
        if (!rb.id) return res.status(400).json({ error: 'id required' });
        await crm.del('revenue', rb.id);
        return res.status(200).json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (req.method === 'GET') {
      // Public: only active partners, lightweight sort
      const partners = (await crm.list('partners'))
        .filter((p) => p.status !== 'hidden')
        .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0));
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json({ partners });
    }

    // All writes require a manager
    const mgr = requireManager(req);
    if (!mgr) return res.status(401).json({ error: 'Unauthorized' });
    const b = readBody(req);

    if (req.method === 'POST') {
      const name = String(b.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Partner name is required' });
      let logo = '';
      if (b.logo && typeof b.logo === 'string' && b.logo.startsWith('data:image/')) {
        if (b.logo.length > MAX_LOGO) return res.status(413).json({ error: 'Logo too large — use an image under ~400KB' });
        logo = b.logo;
      }
      const partner = {
        id: crm.rid('pt'), name, blurb: String(b.blurb || '').slice(0, 400),
        link: String(b.link || '').slice(0, 300), logo,
        order: +b.order || Date.now(), status: 'active', createdAt: Date.now(),
      };
      return res.status(201).json({ partner: await crm.put('partners', partner) });
    }

    if (req.method === 'PATCH') {
      if (!b.id) return res.status(400).json({ error: 'id required' });
      const fields = {};
      ['name', 'blurb', 'link', 'order', 'status'].forEach((k) => { if (b[k] !== undefined) fields[k] = b[k]; });
      if (b.logo && typeof b.logo === 'string' && b.logo.startsWith('data:image/')) {
        if (b.logo.length > MAX_LOGO) return res.status(413).json({ error: 'Logo too large' });
        fields.logo = b.logo;
      }
      const partner = await crm.patch('partners', b.id, fields);
      if (!partner) return res.status(404).json({ error: 'Partner not found' });
      return res.status(200).json({ partner });
    }

    if (req.method === 'DELETE') {
      if (!b.id) return res.status(400).json({ error: 'id required' });
      await crm.del('partners', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
