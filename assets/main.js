// === In-house demo booking ================================================
// Self-contained "Book a Demo" modal. Submits to our own /api/bookings
// serverless endpoint — no third-party platform, no redirects.
window.TIR_SERVICES = [
  'LinkedIn Lead Generation',
  'B2B Outreach & Appointment Setting',
  'LinkedIn Account Management',
  'Profile Optimization & Personal Branding',
  'LinkedIn Account Recovery',
  'Recruiter / Hiring Support',
  'Company Page Management',
  'LinkedIn Ads Management',
  'Other / Not sure yet'
];

function tirBookingFormHTML(opts) {
  opts = opts || {};
  var services = window.TIR_SERVICES.map(function (s) {
    var sel = opts.service && opts.service === s ? ' selected' : '';
    return '<option' + sel + '>' + s + '</option>';
  }).join('');
  return '' +
    '<form class="tir-book-form" onsubmit="return submitBooking(event)">' +
      '<div class="tir-book-grid">' +
        '<div class="tir-fld"><label>Full Name *</label><input name="fullName" type="text" required placeholder="Jane Doe"></div>' +
        '<div class="tir-fld"><label>Company Name</label><input name="company" type="text" placeholder="Acme Inc."></div>' +
        '<div class="tir-fld"><label>Email Address *</label><input name="email" type="email" required placeholder="jane@company.com"></div>' +
        '<div class="tir-fld"><label>Phone Number</label><input name="phone" type="tel" placeholder="+91 98765 43210"></div>' +
        '<div class="tir-fld"><label>Service Required</label><select name="service">' + services + '</select></div>' +
        '<div class="tir-fld"><label>Preferred Date &amp; Time</label><input name="preferredAt" type="datetime-local"></div>' +
      '</div>' +
      '<div class="tir-fld"><label>Additional Message (optional)</label><textarea name="message" rows="3" placeholder="Tell us about your goals, target audience, or any questions…"></textarea></div>' +
      '<button class="btn btn-primary btn-block tir-book-submit" type="submit">Request My Demo →</button>' +
      '<div class="tir-book-status" role="status" aria-live="polite"></div>' +
      '<p class="tir-book-fine">We reply within hours · No spam · Your details stay private.</p>' +
    '</form>';
}

function ensureBookingStyles() {
  if (document.getElementById('tir-book-css')) return;
  var css = ''
    + '.tir-modal-bg{position:fixed;inset:0;background:rgba(10,18,40,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999;animation:tirFade .15s ease}'
    + '@keyframes tirFade{from{opacity:0}to{opacity:1}}'
    + '.tir-modal{background:#fff;border-radius:16px;max-width:620px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 24px 60px rgba(10,18,40,.3)}'
    + '.tir-modal-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:22px 24px 6px}'
    + '.tir-modal-h h3{margin:0;font-size:1.35rem;line-height:1.2}'
    + '.tir-modal-h p{margin:4px 0 0;color:#5b6b7a;font-size:.92rem}'
    + '.tir-x{background:#f1f4f9;border:0;width:34px;height:34px;border-radius:9px;font-size:1.1rem;cursor:pointer;color:#33415a;flex:none}'
    + '.tir-modal-b{padding:10px 24px 24px}'
    + '.tir-book-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
    + '.tir-fld{display:flex;flex-direction:column;margin-top:12px}'
    + '.tir-fld label{font-size:.8rem;font-weight:700;color:#33415a;margin-bottom:5px}'
    + '.tir-fld input,.tir-fld select,.tir-fld textarea{padding:11px 12px;border:1px solid #d8deea;border-radius:9px;font:inherit;font-size:.95rem;background:#fff;color:#0f1b33;width:100%}'
    + '.tir-fld input:focus,.tir-fld select:focus,.tir-fld textarea:focus{outline:none;border-color:#0A66C2;box-shadow:0 0 0 3px rgba(10,102,194,.15)}'
    + '.tir-book-submit{margin-top:16px}'
    + '.tir-book-fine{margin:10px 0 0;text-align:center;color:#7a8699;font-size:.8rem}'
    + '.tir-book-status{margin-top:12px;font-size:.92rem;display:none}'
    + '.tir-book-status.show{display:block}'
    + '.tir-book-status.ok{color:#0a7d33}.tir-book-status.err{color:#c0392b}'
    + '.tir-book-done{text-align:center;padding:18px 6px}'
    + '.tir-book-done .tick{width:60px;height:60px;border-radius:50%;background:#e6f7ec;color:#0a7d33;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px}'
    + '@media(max-width:560px){.tir-book-grid{grid-template-columns:1fr}}';
  var st = document.createElement('style');
  st.id = 'tir-book-css';
  st.textContent = css;
  document.head.appendChild(st);
}

function openBooking(opts) {
  ensureBookingStyles();
  var prev = document.getElementById('tir-modal-root');
  if (prev) prev.remove();
  var root = document.createElement('div');
  root.id = 'tir-modal-root';
  root.innerHTML =
    '<div class="tir-modal-bg" onclick="if(event.target===this)closeBooking()">' +
      '<div class="tir-modal" role="dialog" aria-modal="true" aria-label="Book a demo">' +
        '<div class="tir-modal-h"><div><h3>Book Your Free Demo</h3><p>A 30-minute strategy call — pick a time that suits you. No commitment.</p></div>' +
        '<button class="tir-x" aria-label="Close" onclick="closeBooking()">×</button></div>' +
        '<div class="tir-modal-b">' + tirBookingFormHTML(opts || {}) + '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';
  var first = root.querySelector('input[name="fullName"]');
  if (first) setTimeout(function () { first.focus(); }, 50);
  return false;
}

function closeBooking() {
  var root = document.getElementById('tir-modal-root');
  if (root) root.remove();
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeBooking();
});

function submitBooking(e) {
  e.preventDefault();
  var form = e.target;
  var btn = form.querySelector('.tir-book-submit');
  var status = form.querySelector('.tir-book-status');
  var data = new FormData(form);
  var payload = {
    fullName: (data.get('fullName') || '').trim(),
    company: (data.get('company') || '').trim(),
    email: (data.get('email') || '').trim(),
    phone: (data.get('phone') || '').trim(),
    service: data.get('service') || '',
    preferredAt: (data.get('preferredAt') || '').trim(),
    message: (data.get('message') || '').trim(),
    source: 'Demo Booking'
  };
  btn.disabled = true;
  var original = btn.textContent;
  btn.textContent = 'Sending…';
  status.className = 'tir-book-status';

  fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok) throw new Error((res.j && res.j.error) || 'Something went wrong');
      var modalB = form.closest('.tir-modal-b') || form.parentNode;
      modalB.innerHTML =
        '<div class="tir-book-done">' +
          '<div class="tick">✓</div>' +
          '<h3 style="margin:0 0 6px">Thanks, ' + (payload.fullName.split(' ')[0] || 'there') + '!</h3>' +
          '<p style="color:#5b6b7a;margin:0 0 16px">Your demo request has been received. Our team will email you shortly at <b>' + payload.email.replace(/[<>&]/g, '') + '</b> to confirm your slot.</p>' +
          '<button class="btn btn-primary" onclick="closeBooking()">Done</button>' +
        '</div>';
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.textContent = original;
      status.textContent = err.message || 'Could not submit. Please try again or email vibhanshu@techinrent.com.';
      status.className = 'tir-book-status show err';
    });
  return false;
}

// Back-compat: any leftover onclick="openCalendly()" now opens the in-house form.
function openCalendly() { return openBooking(); }

// Mobile menu toggle
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.menu-btn');
  if (btn) {
    document.querySelector('.nav-links')?.classList.toggle('open');
  }
});

// Lead form -> opens WhatsApp with prefilled message (no backend needed)
function handleLead(e) {
  e.preventDefault();
  const f = e.target;
  const d = new FormData(f);
  const name = (d.get('name') || '').trim();
  const email = (d.get('email') || '').trim();
  const service = d.get('service') || 'LinkedIn growth';
  const msg = (d.get('message') || '').trim();
  const text =
    `Hi TechInRent! I'd like a free LinkedIn strategy call.%0A%0A` +
    `Name: ${encodeURIComponent(name)}%0A` +
    `Email: ${encodeURIComponent(email)}%0A` +
    `Interested in: ${encodeURIComponent(service)}` +
    (msg ? `%0ADetails: ${encodeURIComponent(msg)}` : '');
  const success = f.querySelector('.form-success');
  if (success) {
    success.style.display = 'block';
    success.textContent = 'Thanks ' + (name || '') + '! Opening WhatsApp to confirm your free call…';
  }
  // Persist the lead to the admin portal (server-side, reaches admin on any device).
  try {
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name, email: email, service: service, message: msg, source: 'Strategy Call Form' })
    }).catch(function () {});
  } catch (err) { /* network unavailable — ignore */ }

  window.open('https://wa.me/917898711748?text=' + text, '_blank');
  return false;
}

// Animate stat counters on view
const counters = document.querySelectorAll('[data-count]');
if (counters.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = target / 40;
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target + suffix; }
        else { el.textContent = Math.floor(cur) + suffix; requestAnimationFrame(tick); }
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => io.observe(c));
}

// FAQ accordion
document.addEventListener('click', function (e) {
  const q = e.target.closest('.faq-q');
  if (q) q.parentElement.classList.toggle('open');
});

// Set footer year
document.querySelectorAll('[data-year]').forEach((el) => el.textContent = new Date().getFullYear());
