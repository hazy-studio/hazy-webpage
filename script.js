// ─── Config ──────────────────────────────────────────────────────────────────
const WEIGHT         = 700;   // font weight (100–900)
const LETTER_SPACING = '0px'; // canvas letter spacing (e.g. '-1px', '2px')

// ─── Canvas ───────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d', { alpha: true });

const buf    = document.createElement('canvas');
const bufCtx = buf.getContext('2d');

let W, H, fontSize, colorText, imgData, noiseScale;

document.fonts.ready.then(() => { setup(); requestAnimationFrame(draw); });
window.addEventListener('resize', setup);

function setup() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;

  // Measure at reference size before resizing (canvas resize clears all ctx state)
  ctx.font          = `${WEIGHT} 100px Inter, sans-serif`;
  ctx.letterSpacing = LETTER_SPACING;
  const m     = ctx.measureText('HAZY');
  const pad   = parseFloat(getComputedStyle(document.querySelector('.content')).paddingLeft);
  fontSize    = ((W - pad * 2) / m.width) * 100;
  const textH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * (fontSize / 100);
  H           = Math.ceil(textH * 1.05);

  // Physical canvas = logical × dpr (sharp on hi-DPI / mobile)
  canvas.width        = Math.round(W * dpr);
  canvas.height       = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  // Restore ctx state after resize (canvas resize resets all context properties)
  ctx.scale(dpr, dpr);
  ctx.fontKerning           = 'normal';
  ctx.font                  = `${WEIGHT} ${fontSize}px Inter, sans-serif`;
  ctx.letterSpacing         = LETTER_SPACING;
  ctx.textAlign             = 'center';
  ctx.textBaseline          = 'middle';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Off-screen buffer at 1/3 resolution (upscaled for smooth noise)
  buf.width  = Math.ceil(W / 3);
  buf.height = Math.ceil(H / 3);
  imgData    = bufCtx.createImageData(buf.width, buf.height);
  noiseScale = W / buf.width;

  colorText = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() || '#000';
}

// ─── Wave noise ───────────────────────────────────────────────────────────────
function wave(x, y, t) {
  const a = Math.sin( x * 0.010 + y * 0.007 + t * 0.0005);
  const b = Math.sin(-x * 0.005 + y * 0.013 + t * 0.0003);
  const c = Math.sin(-x * 0.012 - y * 0.009 + t * 0.0007);
  return (Math.tanh(a + b + c) + 1) * 0.5;
}

// ─── Animation loop ───────────────────────────────────────────────────────────
function draw(ts) {
  ctx.clearRect(0, 0, W, H);

  // Fill noise buffer at low resolution
  const px = imgData.data;
  const sw = buf.width, sh = buf.height;
  for (let row = 0; row < sh; row++) {
    for (let col = 0; col < sw; col++) {
      const g = Math.round(wave(col * noiseScale, row * noiseScale, ts) * 255);
      const i = (row * sw + col) << 2;
      px[i] = px[i+1] = px[i+2] = g;
      px[i+3] = 255;
    }
  }
  bufCtx.putImageData(imgData, 0, 0);

  // Draw noise full-size, then clip to text letterforms
  ctx.drawImage(buf, 0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = colorText;
  ctx.fillText('HAZY', W / 2, H / 2);
  ctx.globalCompositeOperation = 'source-over';

  requestAnimationFrame(draw);
}

// ─── Waitlist form ────────────────────────────────────────────────────────────
// Replace with your Google Apps Script web app deployment URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykSzQzZpT2nC6q0rDJUHgwf0CKlGIngTWtPp6WnrXEtW_ILFVn4ASLBCYfT_ce_0yuFQ/exec';

const form  = document.getElementById('waitlist');
const input = document.getElementById('email');
const btn   = form.querySelector('button');

form.addEventListener('submit', e => {
  e.preventDefault();

  const email = input.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    input.setCustomValidity('Please enter a valid email (e.g. name@example.com)');
    input.reportValidity();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }

  // Show success immediately — don't wait for geo/sheet
  input.value = "You're on the list.";
  input.classList.add('done');
  btn.style.visibility = 'hidden';

  submitToSheet(email);
});

async function submitToSheet(email) {
  const ua      = navigator.userAgent;
  const browser = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : /Firefox/.test(ua) ? 'Firefox' : 'Other';
  const device  = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop';
  const os      = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const params  = new URLSearchParams(window.location.search);
  const source  = params.get('utm_source') || document.referrer || 'direct';
  const time    = new Date().toISOString();

  let ip = '', country = '';
  try {
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    ip      = geo.ip           || '';
    country = geo.country_name || '';
  } catch (_) {}

  const formData = new FormData();
  formData.append('time',    time);
  formData.append('email',   email);
  formData.append('ip',      ip);
  formData.append('country', country);
  formData.append('browser', browser);
  formData.append('device',  device);
  formData.append('os',      os);
  formData.append('source',  source);

  try {
    await fetch(SCRIPT_URL, { method: 'POST', body: formData });
  } catch (_) {}
}

