# TechInRent — LinkedIn Growth & B2B Lead Generation

Marketing website for TechInRent. Static HTML/CSS/JS — no build step.

🌐 **Production:** https://techinrent.com

## Structure

```
.
├── index.html              # Homepage
├── services.html           # Services overview
├── linkedin-*.html         # Service landing pages (SEO)
├── blog*.html              # Blog index + articles
├── about / contact / faq / case-studies.html
├── privacy-policy / terms / refund-policy / security.html
├── 404.html                # Custom 404 (noindex)
├── crm/                    # Internal admin lead inbox (noindex, robots-disallowed)
├── assets/                 # style.css, main.js, icons, logo
├── sitemap.xml             # All 29 public pages
├── robots.txt              # Disallows /crm/
├── manifest.webmanifest    # PWA manifest
└── vercel.json             # cleanUrls + no trailing slash
```

## Local preview

Any static server works, e.g.:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

Hosted on **Vercel**. Pushing to the default branch triggers an automatic
production deploy. `vercel.json` enables clean URLs (`/about` instead of
`/about.html`).

## Lead capture

The contact forms (`handleLead` in `assets/main.js`) save submissions to
`localStorage` (viewable in `crm/`) and open a prefilled WhatsApp chat to
+91 78987 11748.
