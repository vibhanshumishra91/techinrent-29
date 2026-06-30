'use strict';
// Dynamic sitemap of published blog posts (served at /blog-sitemap.xml via rewrite).
const crm = require('../lib/crmstore');

module.exports = async (req, res) => {
  let posts = [];
  try { posts = (await crm.list('posts')).filter((p) => p.status === 'published'); } catch (e) { posts = []; }
  const urls = posts.map((p) => {
    const d = new Date(p.updatedAt || p.publishedAt || p.createdAt || Date.now()).toISOString().slice(0, 10);
    return `<url><loc>https://techinrent.com/blog/${p.slug}</loc><lastmod>${d}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  }).join('');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
};
