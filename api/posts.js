'use strict';
// Blog posts. GET is public (published only, unless a manager token is present);
// create/edit/delete is manager-only. Posts render publicly at /blog/<slug>.
const { requireManager } = require('../lib/auth');
const crm = require('../lib/crmstore');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const MAX_IMG = 1600 * 1024;

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'post';
}
async function uniqueSlug(base, ignoreId) {
  const posts = await crm.list('posts');
  let slug = base, n = 1;
  while (posts.some((p) => p.slug === slug && p.id !== ignoreId)) { n += 1; slug = base + '-' + n; }
  return slug;
}
function excerptOf(body, given) {
  if (given) return String(given).slice(0, 200);
  return String(body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!crm.configured) return res.status(500).json({ error: 'Storage not configured' });
  const mgr = requireManager(req);

  try {
    if (req.method === 'GET') {
      const b = req.query || {};
      let posts = await crm.list('posts');
      if (!mgr) posts = posts.filter((p) => p.status === 'published');
      if (b.slug) {
        const p = posts.find((x) => x.slug === String(b.slug));
        return p ? res.status(200).json({ post: p }) : res.status(404).json({ error: 'Not found' });
      }
      // List view omits the heavy body/image
      posts.sort((a, b2) => (b2.publishedAt || b2.createdAt || 0) - (a.publishedAt || a.createdAt || 0));
      const list = posts.map(({ body, featuredImage, ...rest }) => ({ ...rest, hasImage: !!featuredImage }));
      return res.status(200).json({ posts: list });
    }

    if (!mgr) return res.status(401).json({ error: 'Unauthorized' });
    const b = readBody(req);

    if (req.method === 'POST' || req.method === 'PATCH') {
      const editing = req.method === 'PATCH';
      if (editing && !b.id) return res.status(400).json({ error: 'id required' });
      const cur = editing ? await crm.get('posts', b.id) : null;
      if (editing && !cur) return res.status(404).json({ error: 'Post not found' });

      const title = b.title !== undefined ? String(b.title).trim() : (cur && cur.title) || '';
      if (!title) return res.status(400).json({ error: 'Title is required' });

      let featuredImage = cur ? cur.featuredImage : '';
      if (b.featuredImage !== undefined) {
        if (b.featuredImage && String(b.featuredImage).startsWith('data:image/')) {
          if (String(b.featuredImage).length > MAX_IMG) return res.status(413).json({ error: 'Image too large — use a smaller one' });
          featuredImage = b.featuredImage;
        } else if (b.featuredImage === '') { featuredImage = ''; }
      }

      const slugBase = slugify(b.slug || title);
      const slug = editing && cur.slug && !b.slug ? cur.slug : await uniqueSlug(slugBase, editing ? b.id : null);
      const body = b.body !== undefined ? String(b.body) : (cur && cur.body) || '';
      const status = b.status === 'published' ? 'published' : (b.status === 'draft' ? 'draft' : (cur && cur.status) || 'draft');

      const post = {
        id: editing ? cur.id : crm.rid('po'),
        slug, title,
        metaTitle: (b.metaTitle !== undefined ? String(b.metaTitle) : (cur && cur.metaTitle) || '').slice(0, 70),
        metaDescription: (b.metaDescription !== undefined ? String(b.metaDescription) : (cur && cur.metaDescription) || '').slice(0, 180),
        keywords: (b.keywords !== undefined ? String(b.keywords) : (cur && cur.keywords) || '').slice(0, 200),
        excerpt: excerptOf(body, b.excerpt !== undefined ? b.excerpt : (cur && cur.excerpt)),
        body, featuredImage,
        author: (cur && cur.author) || mgr.name || 'TechInRent',
        status,
        createdAt: cur ? cur.createdAt : Date.now(),
        publishedAt: status === 'published' ? (cur && cur.publishedAt ? cur.publishedAt : Date.now()) : null,
      };
      const saved = await crm.put('posts', post);
      return res.status(editing ? 200 : 201).json({ post: saved });
    }

    if (req.method === 'DELETE') {
      if (!b.id) return res.status(400).json({ error: 'id required' });
      await crm.del('posts', b.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || 'Request failed' });
  }
};
