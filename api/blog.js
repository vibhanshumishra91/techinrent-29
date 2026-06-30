'use strict';
// Server-rendered public blog post at /blog/<slug> (via rewrite). Emits full SEO
// meta + JSON-LD so admin-created posts are crawlable and rank. ?img=1 serves the
// featured image so og:image is a real URL.
const crm = require('../lib/crmstore');

const SITE = 'https://techinrent.com';
const DEFAULT_IMG = SITE + '/og-image.png';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function getBySlug(slug) {
  const posts = await crm.list('posts');
  return posts.find((p) => p.slug === slug && p.status === 'published') || null;
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Post not found | TechInRent</title><link rel="stylesheet" href="/assets/style.css"><div style="max-width:680px;margin:12vh auto;text-align:center;font-family:Inter,system-ui,sans-serif"><h1>Post not found</h1><p>This article doesn’t exist or was unpublished.</p><a class="btn btn-primary" href="/blog">← Back to the blog</a></div>');
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').trim();
  const wantImg = req.query && (req.query.img === '1' || req.query.img === 'true');
  if (!slug) return notFound(res);

  let post;
  try { post = await getBySlug(slug); } catch (e) { post = null; }
  if (!post) return notFound(res);

  // Serve the featured image binary (for og:image and inline use)
  if (wantImg) {
    const m = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/.exec(post.featuredImage || '');
    if (!m) { res.statusCode = 302; res.setHeader('Location', DEFAULT_IMG); return res.end(); }
    const buf = Buffer.from(m[2], 'base64');
    res.statusCode = 200;
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.end(buf);
  }

  const url = SITE + '/blog/' + post.slug;
  const title = esc(post.metaTitle || post.title) + ' | TechInRent';
  const desc = esc(post.metaDescription || post.excerpt || '');
  const ogImg = post.featuredImage ? (url + '/image') : DEFAULT_IMG;
  const published = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date(post.createdAt).toISOString();
  const dateLabel = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
    description: post.metaDescription || post.excerpt || '', image: ogImg, datePublished: published, dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),
    author: { '@type': 'Organization', name: 'TechInRent' }, publisher: { '@type': 'Organization', name: 'TechInRent', logo: { '@type': 'ImageObject', url: SITE + '/techinrent-logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const html = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
${post.keywords ? `<meta name="keywords" content="${esc(post.keywords)}">` : ''}
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-us" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.metaTitle || post.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta property="og:site_name" content="TechInRent">
<meta property="og:locale" content="en_US">
<meta property="article:published_time" content="${published}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.metaTitle || post.title)}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImg}">
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div class="topbar"><div class="container"><div class="tb-left">🔒 Policy-Safe LinkedIn Growth · Trusted by 500+ B2B teams</div><div class="tb-right"><a href="tel:+917898711748">📞 +91 78987 11748</a><a href="mailto:vibhanshu@techinrent.com">✉️ vibhanshu@techinrent.com</a></div></div></div>
<header class="site-header"><div class="container nav">
  <a class="brand" href="/index.html"><img src="/assets/logo.png" alt="TechInRent logo"><span>TechInRent</span></a>
  <nav class="nav-links"><a href="/services.html">Services</a><a href="/case-studies.html">Case Studies</a><a href="/blog.html">Blog</a><a href="/faq.html">FAQ</a><a href="/about.html">About</a><a href="/partners.html">Partners</a><a href="/contact.html">Contact</a></nav>
  <div class="nav-cta"><a class="btn btn-ghost" href="tel:+917898711748">Call Now</a><a class="btn btn-primary" href="/contact.html#book">Book Free Call</a><button class="menu-btn" aria-label="Open menu"><span></span><span></span><span></span></button></div>
</div></header>
<main class="section" style="padding-top:40px">
  <article class="container" style="max-width:760px">
    <p style="color:var(--blue);font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:.8rem;margin-bottom:10px"><a href="/blog.html" style="color:var(--blue)">← Blog</a> · ${esc(dateLabel)}</p>
    <h1 style="font-size:2.2rem;line-height:1.15;margin:0 0 18px">${esc(post.title)}</h1>
    ${post.featuredImage ? `<img src="${url}/image" alt="${esc(post.title)}" style="width:100%;border-radius:16px;margin:8px 0 24px;border:1px solid var(--line)">` : ''}
    <div class="post-body" style="font-size:1.06rem;line-height:1.8;color:#1f2a37">${post.body || ''}</div>
    <div style="margin-top:40px;padding:24px;background:#f4f8fd;border:1px solid var(--line);border-radius:16px;text-align:center">
      <h3 style="margin:0 0 8px">Want results like these on your LinkedIn?</h3>
      <p style="color:var(--slate);margin:0 0 14px">We run done-for-you outreach + lead generation. Book a free strategy call.</p>
      <a class="btn btn-primary" href="/contact.html#book">Book a Free Call →</a>
    </div>
  </article>
</main>
<footer class="site-footer"><div class="container" style="padding:30px 0;text-align:center;color:var(--slate)">© <span data-year></span> TechInRent · <a href="/privacy-policy.html">Privacy</a> · <a href="/terms.html">Terms</a></div></footer>
<script src="/assets/main.js"></script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
  return res.end(html);
};
