// === Calendly booking =====================================================
// Replace this with your real Calendly scheduling link (one place, used everywhere).
window.CALENDLY_URL = 'https://calendly.com/vibhanshu-techinrent/new-meeting';

function openCalendly() {
  if (!document.getElementById('calendly-widget-css')) {
    var l = document.createElement('link');
    l.id = 'calendly-widget-css';
    l.rel = 'stylesheet';
    l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
  }
  var fire = function () {
    if (window.Calendly) { Calendly.initPopupWidget({ url: window.CALENDLY_URL + '?hide_gdpr_banner=1' }); }
  };
  if (window.Calendly) { fire(); }
  else {
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.onload = fire;
    document.body.appendChild(s);
  }
  return false;
}

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
  // Capture the lead into the CRM inbox (same-origin localStorage).
  try {
    var inbox = JSON.parse(localStorage.getItem('tir_inbox') || '[]');
    inbox.push({ name: name, email: email, service: service, message: msg, ts: Date.now() });
    localStorage.setItem('tir_inbox', JSON.stringify(inbox));
  } catch (err) { /* storage unavailable — ignore */ }

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
