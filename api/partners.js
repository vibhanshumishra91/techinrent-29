'use strict';
// Partners / clients. GET is public (for the website Partners page); writes are manager-only.
const { requireManager } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const MAX_LOGO = 500 * 1024; // ~500KB data URL cap

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });

  try {
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
