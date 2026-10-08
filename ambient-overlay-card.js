/**
 * ambient-overlay-card
 * Lovelace custom card — atmospheric overlay effects for your dashboard
 */

/* ============================== HELPERS ============================== */

function fireEvent(node, type, detail) {
  const event = new Event(type, { bubbles: true, composed: true });
  event.detail = detail;
  node.dispatchEvent(event);
}

function spreadSample(arr, count) {
  if (!arr || !arr.length) return [];
  const sorted = [...arr].sort((a, b) => a.l - b.l);
  if (count >= sorted.length) return sorted;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(sorted[Math.floor((i * sorted.length) / count)]);
  }
  return result;
}

function hexToRgb(hex) {
  let h = (hex || "").trim();
  if (h === "auto" || !h) h = "#ffffff";
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(num)) return { r: 255, g: 255, b: 255 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gradientColor(colors, t) {
  const safeColors = (colors && colors.length === 3) ? colors : ["#c9a227", "#a83232", "#d9812c"];
  const [c0, c1, c2] = safeColors.map(hexToRgb);
  const seg = t < 0.5 ? [c0, c1, t * 2] : [c1, c2, (t - 0.5) * 2];
  const [from, to, localT] = seg;
  return rgbToCss({
    r: Math.round(lerp(from.r, to.r, localT)),
    g: Math.round(lerp(from.g, to.g, localT)),
    b: Math.round(lerp(from.b, to.b, localT)),
  });
}

function getParticleCount(preset, eventType) {
  let max = 60;
  if (eventType === "balloons") max = 30;
  if (eventType === "lights") max = 25;
  if (eventType === "shooting_stars") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "lightning") {
    switch (preset) {
      case "low": return 2;
      case "high": return 6;
      case "medium": default: return 4;
    }
  }
  if (eventType === "fog") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "stars") {
    switch (preset) {
      case "low": return 15;
      case "high": return 55;
      case "medium": default: return 30;
    }
  }
  if (eventType === "bats") {
    switch (preset) {
      case "low": return 4;
      case "high": return 14;
      case "medium": default: return 8;
    }
  }
  if (eventType === "bee") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "clouds") {
    switch (preset) {
      case "low": return 2;
      case "high": return 7;
      case "medium": default: return 4;
    }
  }
  if (eventType === "confetti") {
    switch (preset) {
      case "low": return 20;
      case "high": return 70;
      case "medium": default: return 40;
    }
  }
  switch (preset) {
    case "low": return Math.round(max * 0.33);
    case "high": return max;
    case "medium": default: return Math.round(max * 0.66);
  }
}

function getOpacityValue(preset) {
  switch (preset) {
    case "low": return 0.3;
    case "high": return 1.0;
    case "medium": default: return 0.6;
  }
}

// Moon phase computed purely from the date (no Home Assistant sensor needed).
// Reference: known new moon on 6 January 2000, 18:14 UTC. Returns 0 = new moon,
// 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter, then back towards
// 1 = new moon.
function getMoonPhase(date) {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const synodicMonthDays = 29.530588853;
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((diffDays % synodicMonthDays) + synodicMonthDays) % synodicMonthDays;
  return phase / synodicMonthDays;
}

// Builds the SVG path for the lit part of the moon for a given phase (0-1).
// Waxing grows from the right, waning shrinks towards the left (northern
// hemisphere view). New moon and full moon are special cases, because the
// normal arc formula degenerates there (radius 0).
function moonPhasePath(cx, cy, r, phase) {
  if (phase < 0.01 || phase > 0.99) return null; // New moon: no lit area
  if (Math.abs(phase - 0.5) < 0.01) return "full"; // Full moon: fully lit
  const theta = phase * 2 * Math.PI;
  let rx = r * Math.cos(theta);
  // Enforce a minimum crescent width: astronomically the crescent becomes
  // hair-thin shortly after new moon / before full moon (barely recognisable).
  // For a clearly readable decoration it is limited to at least 20% of the disc
  // width - slightly unastronomical, but always clearly a crescent.
  const minRx = r * 0.8;
  if (rx > minRx) rx = minRx;
  // These two flags were NOT guessed from a formula; they were measured for
  // each of the four quarters separately (actual rendered lit area compared
  // with the astronomically expected one). Both flags are needed together, one
  // alone is not enough.
  const sweepOuter = phase < 0.5 ? 1 : 0;
  const sweepInner = (phase < 0.5) === (rx > 0) ? 0 : 1;
  return `M${cx},${(cy - r).toFixed(2)} A${r},${r} 0 0,${sweepOuter} ${cx},${(cy + r).toFixed(2)} A${Math.abs(rx).toFixed(2)},${r} 0 0,${sweepInner} ${cx},${(cy - r).toFixed(2)} Z`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function brightnessFromAnyColor(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") return null;
  if (trimmed.startsWith("#")) {
    const rgb = hexToRgb(trimmed);
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }
  const nums = trimmed.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const r = parseFloat(nums[0]), g = parseFloat(nums[1]), b = parseFloat(nums[2]);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

const THEME_BG_VAR_NAMES = [
  "--card-background-color",
  "--primary-background-color",
  "--ha-card-background",
  "--secondary-background-color",
  "--app-header-background-color",
];

function checkNodeForThemeColor(node) {
  const style = getComputedStyle(node);
  for (const varName of THEME_BG_VAR_NAMES) {
    const brightness = brightnessFromAnyColor(style.getPropertyValue(varName));
    if (brightness !== null) return brightness;
  }
  return brightnessFromAnyColor(style.backgroundColor);
}

function detectBackgroundBrightness(hostEl) {
  try {
    let node = hostEl;
    let depth = 0;
    while (node && depth < 25) {
      if (node.nodeType === 1) {
        const brightness = checkNodeForThemeColor(node);
        if (brightness !== null) return brightness;
      }
      if (node.parentElement) {
        node = node.parentElement;
      } else if (node.parentNode && node.parentNode.host) {
        node = node.parentNode.host;
      } else if (node.getRootNode) {
        const root = node.getRootNode();
        node = (root && root.host) ? root.host : null;
      } else {
        node = null;
      }
      depth++;
    }

    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const brightness = checkNodeForThemeColor(el);
      if (brightness !== null) return brightness;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function isDarkModeActive(hassInstance, hostEl) {
  try {
    const brightness = detectBackgroundBrightness(hostEl);
    if (brightness !== null) {
      return brightness < 128;
    }

    if (hassInstance && hassInstance.themes && typeof hassInstance.themes.darkMode === "boolean") {
      return hassInstance.themes.darkMode;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return true;
  }
}

function resolveDynamicColor(cfgColor, hassInstance, defaultLight = "#000000", defaultDark = "#ffffff", hostEl) {
  if (cfgColor && cfgColor !== "auto") return cfgColor;
  const dark = isDarkModeActive(hassInstance, hostEl);
  return dark ? defaultDark : defaultLight;
}

function overlayBaseCss(className, extraProps = "") {
  return `
    .${className} {
      position: fixed; top:0; left:50%; transform:translateX(-50%);
      width:100vw; height:100vh; pointer-events:none; z-index:9999; overflow:hidden;
      ${extraProps}
    }
  `;
}

function sanitizeLeafShape(input) {
  if (typeof input !== "string" || !input.trim()) return null;
  const trimmed = input.trim();
  const forbidden = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|xlink:href|href\s*=/i;
  if (forbidden.test(trimmed)) return null;
  const allowedTagPattern = /<\/?(path|polygon|circle|line|g|rect)\b[^>]*>/gi;
  const strippedOfAllowed = trimmed.replace(allowedTagPattern, "");
  if (strippedOfAllowed.includes("<")) return null;
  return trimmed;
}

const _randomCache = new Map();
function getCachedRandomSet(key, count, factory) {
  const cacheKey = `${key}:${count}`;
  if (!_randomCache.has(cacheKey)) {
    _randomCache.set(cacheKey, Array.from({ length: count }, factory));
  }
  return _randomCache.get(cacheKey);
}

/* ============================ STATIC DATA ============================ */

// How long an effect takes to fade out smoothly when it ends, instead of
// disappearing abruptly.
const FADE_DURATION_MS = 2500;

const WEATHER_STATE_MAP = {
  "rainy": ["rain"],
  "pouring": ["rain"],
  "snowy": ["snow"],
  "snowy-rainy": ["snow", "rain"],
  "hail": ["hail"],
  "lightning": ["lightning"],
  "lightning-rainy": ["lightning", "rain"],
  "fog": ["fog"],
  "windy": ["storm"],
  "windy-variant": ["storm"],
  "clear-night": ["stars"],
  "cloudy": ["clouds"],
  "partlycloudy": ["clouds"],
  "sunny": ["sun"],
};

function mapWeatherStateToEvents(state) {
  return WEATHER_STATE_MAP[state] || ["off"];
}

const COUNT_IS_INTERVAL_TEXT = {
  santa: "How often Santa flies by: Low ≈ every 5-6 min, Medium ≈ every 3-4 min, High ≈ every 1-2 min (not a particle amount, since there is only one sleigh).",
  dog: "How often the Labrador runs past: Low ≈ every 5-6 min, Medium ≈ every 3-4 min, High ≈ every 1-2 min (not a particle amount, since there is only one dog).",
  train: "How often the steam train chugs past: Low ≈ every 5-6 min, Medium ≈ every 3-4 min, High ≈ every 1-2 min (not a particle amount, since there is only one).",

  night_sky: "How often the comet passes: Low ≈ every 5-6 min, Medium ≈ every 3-4 min, High ≈ every 1-2 min. Also controls the number of shooting stars (3 / 5 / 8).",
  owl_birdhouse: "How often a bird visits the birdhouse during the day: Low ≈ every 100 s, Medium ≈ every 60 s, High ≈ every 30 s (at night the owl sits there, so no effect).",
};

const EVENT_CAPABILITIES = {
  off: { count: false, opacity: false, color: false },
  weather_auto: { count: true, opacity: true, color: true },
  leaves: { count: true, opacity: true, color: false },
  night_sky: { count: true, opacity: true, color: true },
  santa: { count: true, opacity: true, color: false },
  spider: { count: false, opacity: true, color: true },
  dog: { count: true, opacity: true, color: false },
  train: { count: true, opacity: true, color: false },
  bats: { count: true, opacity: true, color: true },
  owl_birdhouse: { count: true, opacity: true, color: false },
  bee: { count: true, opacity: true, color: false },
  birthday: { count: true, opacity: true, color: false },
};

const BALLOON_COLORS = ["#FF4B4B", "#FF851B", "#FFDC00", "#2ECC40", "#0074D9", "#B10DC9", "#F012BE"];

const BALLOON_SVG = `
<svg viewBox="0 0 50 80" preserveAspectRatio="xMidYMid meet">
  <path d="M 25 5 Q 45 5 45 30 Q 45 52 25 55 Q 5 52 5 30 Q 5 5 25 5 Z" fill="currentColor" />
  <polygon points="22,55 28,55 25,58" fill="currentColor" />
  <path d="M 12 18 Q 15 10 22 8" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M 25 58 Q 20 65 28 72 T 25 80" stroke="rgba(200,200,200,0.7)" stroke-width="1" fill="none" />
</svg>
`;

const DEFAULT_LEAF_SHAPE = `
  <path d="M50 4 C22 18, 10 55, 50 96 C90 55, 78 18, 50 4 Z" fill="currentColor"/>
  <path d="M50 10 L50 90" stroke="rgba(0,0,0,0.25)" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 30 L34 20 M50 30 L66 20 M50 55 L30 45 M50 55 L70 45 M50 75 L36 68 M50 75 L64 68"
        stroke="rgba(0,0,0,0.18)" stroke-width="2" stroke-linecap="round"/>
`;

const BALLOONS = Array.from({ length: 30 }, (_, i) => ({
  l: (i * 3.2) + 2,
  size: Math.floor(Math.random() * 20) + 38,
  dur: (Math.random() * 4 + 7).toFixed(2),
  d: (Math.random() * -10).toFixed(2),
  color: BALLOON_COLORS[i % BALLOON_COLORS.length],
  sway: Math.floor(Math.random() * 25 + 15),
}));

const DROPS = Array.from({ length: 60 }, (_, i) => ({
  l: (i * 1.6) + 1,
  size: Math.floor(Math.random() * 14) + 16,
  dur: (Math.random() * 0.3 + 0.4).toFixed(2),
  d: (Math.random() * -2).toFixed(2),
  op: (Math.random() * 0.5 + 0.4).toFixed(2),
}));

const FLAKES_DATA = Array.from({ length: 50 }, (_, i) => ({
  l: (i * 1.95) + 1,
  s: Math.floor(Math.random() * 12) + 8,
  ex: Math.floor(Math.random() * 60) - 30,
  dur: Math.floor(Math.random() * 12) + 18,
  d: (Math.random() * 1).toFixed(2),
  op: (Math.random() * 0.6 + 0.3).toFixed(2),
}));

/* ============================ RENDER FUNCTIONS ============================ */

function renderRain(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "rain");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const drops = spreadSample(DROPS, count);

  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const dropHTML = drops.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    return `<div class="drop" style="left:${d.l}vw; height:${d.size}px; animation-duration:${d.dur}s; animation-delay:${d.d}s; opacity:${op};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("rain")}
    .rain .drop { 
      position: absolute; 
      top: -20%; 
      width: 2px; 
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, ${color} 100%) !important; 
      border-radius: 50%; 
      animation: rainfall linear infinite;
      will-change: transform;
    }
    @keyframes rainfall { 
      0% { transform: translateY(0vh) translateX(0px); } 
      100% { transform: translateY(120vh) translateX(-15px); } 
    }
  `;
  return { css, html: `<div class="rain" aria-hidden="true">${dropHTML}</div>` };
}

function renderSnow(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "snow");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const flakes = spreadSample(FLAKES_DATA, count);

  const isHigh = (cfg.opacity_preset || "medium") === "high";
  // Derive the delay from the absolute clock time so the flakes keep falling
  // after a re-render instead of jumping back up. This happens often with snow:
  // the counter for the growing snow cover re-renders every 15 seconds, and
  // with a fixed delay every flake visibly jumped back up a bit.
  const snowNowSec = Date.now() / 1000;
  const flakeHTML = flakes.map((f) => {
    const op = isHigh
      ? Math.min(1, Math.max(f.op, 0.85)).toFixed(2)
      : (f.op * opacity).toFixed(2);
    return `<i class="snowflake" style="left:${f.l}vw; font-size:${f.s}px; --start-x:0px; --end-x:${f.ex}px; animation-duration:${f.dur}s; animation-delay:-${((snowNowSec + f.d * 20) % f.dur).toFixed(2)}s; opacity:${op}; color:${color};">❄</i>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("snowflakes")}
    .snowflake { position:absolute; top:-10%; font-style:normal; animation:wander-fall linear infinite; will-change: transform; }
    @keyframes wander-fall {
      0%   { transform: translate(var(--start-x), -10%); }
      50%  { transform: translate(var(--end-x), 60vh); }
      100% { transform: translate(var(--end-x), 120vh); }
    }
    .snow-accumulation {
      position: absolute; bottom: 0; left: 0; width: 100%;
      border-top-left-radius: 40% 10px; border-top-right-radius: 40% 10px;
      transition: height 8s linear;
    }
  `;

  const snowLevel = typeof cfg._snowLevel === "number" ? cfg._snowLevel : 0;
  const accumHeight = Math.min(18, snowLevel * 0.18);
  const accumHtml = accumHeight > 0
    ? `<div class="snow-accumulation" aria-hidden="true" style="height:${accumHeight.toFixed(2)}vh; background:linear-gradient(180deg, rgba(255,255,255,0.92), rgba(230,238,245,0.8));"></div>`
    : "";

  return { css, html: `<div class="snowflakes" aria-hidden="true">${flakeHTML}${accumHtml}</div>` };
}

function renderLeaves(cfg, hass, hostEl) {
  const leafColors = Array.isArray(cfg.leaf_colors) && cfg.leaf_colors.length === 3 ? cfg.leaf_colors : ["#c9a227", "#a83232", "#d9812c"];
  const count = getParticleCount(cfg.count_preset || "medium", "leaves");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const leafShape = sanitizeLeafShape(cfg.leaf_shape) || DEFAULT_LEAF_SHAPE;
  const leaves = spreadSample(FLAKES_DATA, count);

  // Periodic gust of wind instead of continuous falling: "count/frequency" now
  // controls how often a short burst of leaves blows across the screen, rather
  // than how many leaves fall at the same time. It no longer runs non-stop all
  // day but in bursts - feels more like "an occasional autumn wind" than
  // constant rain.
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const gustPct = Math.min(35, (25 / interval) * 100);
  const nowSec = Date.now() / 1000;
  const baseDelay = -(nowSec % interval);
  const fadeInPct = (gustPct * 0.06).toFixed(2);
  const fadeOutPct = (gustPct * 0.94).toFixed(2);

  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const leafHTML = leaves.map((f, i) => {
    const op = isHigh
      ? Math.min(1, Math.max(f.op, 0.85)).toFixed(2)
      : (f.op * opacity).toFixed(2);
    const color = gradientColor(leafColors, i / leaves.length);
    const px = `${f.s * 1.6}px`;
    // Each leaf starts slightly offset WITHIN the same gust window (not spread
    // over the whole day as before).
    const staggerSec = f.d * (gustPct / 100) * interval * 0.7;
    const thisDelay = (baseDelay - staggerSec).toFixed(2);
    return `<i class="leaf" style="left:${f.l}vw; width:${px}; height:${px}; --leaf-op:${op}; animation-delay:${thisDelay}s; color:${color};"><svg viewBox="0 0 100 100" width="100%" height="100%">${leafShape}</svg></i>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("leaves")}
    .leaf { position:absolute; top:-10%; animation:leaf-fall-gust ${interval}s linear infinite; will-change: transform, opacity; }
    @keyframes leaf-fall-gust {
      0%, ${fadeInPct}% { transform: translateY(0) rotate(0deg); opacity: 0; }
      ${(parseFloat(fadeInPct) + 1).toFixed(2)}% { opacity: var(--leaf-op); }
      ${fadeOutPct}% { opacity: var(--leaf-op); }
      ${gustPct.toFixed(2)}%, 100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
    }
  `;
  return { css, html: `<div class="leaves" aria-hidden="true">${leafHTML}</div>` };
}


function renderLights(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const bulbCount = getParticleCount(cfg.count_preset || "medium", "lights");
  const colors = ["#ff3333", "#33cc33", "#3399ff", "#ffff33", "#ff9933", "#cc33cc"];
  
  let bulbsHtml = "";
  for (let i = 0; i < bulbCount; i++) {
    const col = colors[i % colors.length];
    bulbsHtml += `<div class="bulb" style="background:${col}; animation-delay:${(i * 0.2).toFixed(1)}s;"></div>\n`;
  }

  const html = `<div class="lights-string" style="opacity:${opacity};" aria-hidden="true">${bulbsHtml}</div>`;
  const css = `
    .lights-string {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 25px;
      pointer-events: none; z-index: 9999; display: flex; justify-content: space-around; padding: 0 10px; box-sizing: border-box;
    }
    .bulb {
      width: 10px; height: 14px; border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: bulb-blink 1.2s ease-in-out infinite alternate;
      will-change: opacity, transform;
    }
    @keyframes bulb-blink { 0% { opacity: 0.3; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1.1); } }
  `;
  return { css, html };
}

function renderShootingStars(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "shooting_stars");
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);

  const stars = getCachedRandomSet("shooting_stars", count, () => ({
    top: (Math.random() * 50).toFixed(2),
    left: (Math.random() * 100).toFixed(2),
    dur: (Math.random() * 3 + 2).toFixed(2),
    offset: (Math.random() * 5).toFixed(2),
  }));

  // Derive the delay from the absolute clock time (negative value) so the
  // shooting stars continue EXACTLY where they were after a re-render. With a
  // fixed positive delay they would start over every time - e.g. whenever the
  // wishing star in the same effect changes position and is redrawn.
  const nowSec = Date.now() / 1000;
  const starsHtml = stars.map((s) => {
    const dur = parseFloat(s.dur);
    const phase = ((nowSec + parseFloat(s.offset)) % dur).toFixed(2);
    return `<div class="shooting-star" style="top:${s.top}vh; left:${s.left}vw; animation-duration:${s.dur}s; animation-delay:-${phase}s; color:${color};"></div>`;
  }).join("\n");

  const html = `<div class="shooting-stars-container" style="opacity:${opacity};" aria-hidden="true">${starsHtml}</div>`;
  const css = `
    ${overlayBaseCss("shooting-stars-container")}
    .shooting-star {
      position: absolute; width: 100px; height: 2px;
      background: linear-gradient(90deg, currentColor, transparent);
      transform: rotate(-45deg); opacity: 0;
      animation: shooting-star-anim linear infinite;
      will-change: transform, opacity;
    }
    @keyframes shooting-star-anim {
      0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
      100% { transform: translateX(-300px) translateY(300px) rotate(-45deg); opacity: 0; }
    }
  `;
  return { css, html };
}

function renderLightning(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const speedFactor = getParticleCount(cfg.count_preset || "medium", "lightning");
  const dur = (6 / speedFactor).toFixed(1);

  const html = `<div class="lightning-flash" style="opacity:${opacity}; animation-duration:${dur}s;" aria-hidden="true"></div>`;
  const css = `
    .lightning-flash {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; background: rgba(255, 255, 255, 0.85);
      opacity: 0; animation: flash-anim ease-in-out infinite;
      will-change: opacity;
    }
    @keyframes flash-anim {
      0%, 90%, 100% { opacity: 0; }
      92% { opacity: 0.9; }
      93% { opacity: 0.1; }
      94% { opacity: 0.8; }
      96% { opacity: 0; }
    }
  `;
  return { css, html };
}

function renderFog(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "fog");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const banks = getCachedRandomSet("fog", count, () => ({
    top: (Math.random() * 80).toFixed(2),
    width: Math.floor(Math.random() * 40) + 60,
    height: Math.floor(Math.random() * 15) + 12,
    dur: (Math.random() * 20 + 25).toFixed(2),
    delay: (Math.random() * -20).toFixed(2),
    baseOp: (Math.random() * 0.3 + 0.3).toFixed(2),
    reverse: Math.random() > 0.5,
  }));

  const fogHTML = banks.map((b) => {
    const bankOp = isHigh ? Math.max(b.baseOp, 0.7) : (b.baseOp * opacity);
    const dir = b.reverse ? "fog-drift-reverse" : "fog-drift";
    return `<div class="fog-bank" style="top:${b.top}vh; width:${b.width}vw; height:${b.height}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; animation-name:${dir}; opacity:${bankOp.toFixed(2)}; background:radial-gradient(ellipse at center, ${color} 0%, transparent 70%);"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("fog-container")}
    .fog-bank {
      position: absolute; left: -20vw; border-radius: 50%; filter: blur(10px); will-change: transform;
    }
    @keyframes fog-drift {
      0%   { transform: translateX(0); }
      100% { transform: translateX(140vw); }
    }
    @keyframes fog-drift-reverse {
      0%   { transform: translateX(140vw); }
      100% { transform: translateX(0); }
    }
  `;
  return { css, html: `<div class="fog-container" aria-hidden="true">${fogHTML}</div>` };
}

function renderHail(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "hail");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const stones = spreadSample(DROPS, count);

  const hailHTML = stones.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    const size = Math.max(3, Math.round(d.size / 3));
    const dur = (parseFloat(d.dur) * 0.55).toFixed(2);
    return `<div class="hailstone" style="left:${d.l}vw; width:${size}px; height:${size}px; animation-duration:${dur}s; animation-delay:${d.d}s; opacity:${op}; background:${color};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("hail")}
    .hail .hailstone {
      position: absolute; top: -10%; border-radius: 50%;
      box-shadow: 0 0 2px rgba(0,0,0,0.3);
      animation: hailfall linear infinite;
      will-change: transform;
    }
    @keyframes hailfall {
      0% { transform: translateY(0vh) translateX(0px); }
      100% { transform: translateY(120vh) translateX(-25px); }
    }
  `;
  return { css, html: `<div class="hail" aria-hidden="true">${hailHTML}</div>` };
}

function renderStorm(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "storm");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const gusts = spreadSample(DROPS, count);

  const gustHTML = gusts.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    const dur = (parseFloat(d.dur) * 0.6).toFixed(2);
    const len = Math.max(20, d.size * 2);
    return `<div class="storm-streak" style="top:${d.l}vh; width:${len}px; animation-duration:${dur}s; animation-delay:${d.d}s; opacity:${op}; background:linear-gradient(90deg, transparent, ${color});"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("storm-container")}
    .storm-streak {
      position: absolute; left: -20vw; height: 2px;
      animation: storm-gust linear infinite;
      will-change: transform;
    }
    @keyframes storm-gust {
      0%   { transform: translateX(0) translateY(0); }
      100% { transform: translateX(140vw) translateY(6vh); }
    }
  `;
  return { css, html: `<div class="storm-container" aria-hidden="true">${gustHTML}</div>` };
}

function renderSanta(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const flightPct = Math.min(30, (18 / interval) * 100);
  const nowSec = Date.now() / 1000;
  const delaySec = (-(nowSec % interval)).toFixed(2);

  // Occasionally (roughly every 3rd pass) the sleigh drops a present that falls
  // down - decided deterministically from the pass number, so a re-render
  // mid-flight does not suddenly make the present disappear/appear.
  const flightNumber = Math.floor(nowSec / interval);
  const dropsGift = flightNumber % 3 === 0;
  const giftStartPct = (flightPct * 0.35).toFixed(2);
  const giftEndPct = (flightPct * 0.85).toFixed(2);

  const css = `
    .santa-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .santa-sleigh-box {
      position: absolute; top: 8vh; right: -250px; width: 220px; height: 62px;
      animation: santa-fly ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes santa-fly {
      0% { transform: translateX(0) translateY(0); }
      ${flightPct.toFixed(2)}% { transform: translateX(calc(-100vw - 300px)) translateY(-15px); }
      100% { transform: translateX(calc(-100vw - 300px)) translateY(-15px); }
    }
    ${dropsGift ? `
    .santa-gift {
      animation: santa-gift-fall ${interval}s linear infinite; animation-delay: ${delaySec}s;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes santa-gift-fall {
      0%, ${giftStartPct}% { opacity: 0; transform: translateY(0) rotate(0deg); }
      ${(parseFloat(giftStartPct) + 2).toFixed(2)}% { opacity: 1; transform: translateY(0) rotate(0deg); }
      ${giftEndPct}% { opacity: 0; transform: translateY(42px) rotate(140deg); }
      100% { opacity: 0; transform: translateY(42px) rotate(140deg); }
    }
    ` : ""}
  `;

  const html = `
    <div class="santa-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="santa-sleigh-box">
        <svg viewBox="0 -20 320 90" preserveAspectRatio="xMidYMid meet">
          <defs>
            <g id="santa-reindeer">
              <ellipse cx="35" cy="28" rx="17" ry="9" fill="#8b5a2b"/>
              <path d="M20,24 Q10,18 8,14" fill="none" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
              <ellipse cx="8" cy="14" rx="7" ry="6" fill="#8b5a2b"/>
              <circle cx="2" cy="16" r="2.3" fill="#4a2f18"/>
              <path d="M8,9 L4,-3 M4,-3 L0,-7 M4,-3 L2,1 M8,9 L13,-4 M13,-4 L17,-8 M13,-4 L15,0"
                    fill="none" stroke="#4a2f18" stroke-width="2" stroke-linecap="round"/>
              <path d="M22,35 Q16,44 12,50 M28,36 Q24,44 20,50 M46,36 Q54,42 58,50 M40,36 Q46,44 50,50"
                    fill="none" stroke="#5a3a1a" stroke-width="3" stroke-linecap="round"/>
              <path d="M52,24 Q57,20 55,27" fill="none" stroke="#8b5a2b" stroke-width="2" stroke-linecap="round"/>
            </g>
          </defs>
          <use href="#santa-reindeer"/>
          <use href="#santa-reindeer" transform="translate(68,0)"/>
          <path d="M60,18 Q100,22 148,26 M128,18 Q140,22 148,26" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.8"/>
          <path d="M148,44 Q142,30 154,20 Q162,13 172,13 L212,13 Q224,13 224,25 L224,37 Q224,44 214,44 Z"
                fill="#b91c1c" stroke="#d4af37" stroke-width="2"/>
          <ellipse cx="182" cy="27" rx="12" ry="14" fill="#c41e3a"/>
          <ellipse cx="182" cy="40" rx="12" ry="3" fill="#ffffff"/>
          <rect x="172" y="29" width="20" height="3" fill="#1a1a1a"/>
          <rect x="180" y="28.5" width="4" height="4" fill="#d4af37"/>
          <circle cx="182" cy="10" r="7" fill="#f4c2a1"/>
          <path d="M175,12 Q182,24 189,12 Q188,18 182,20 Q176,18 175,12 Z" fill="#ffffff"/>
          <path d="M175,5 Q165,-8 179,-13 Q184,-12 180,-6 Q177,-1 175,5 Z" fill="#c41e3a"/>
          <ellipse cx="180" cy="4" rx="7" ry="2.5" fill="#ffffff"/>
          <circle cx="179" cy="-13" r="2.5" fill="#ffffff"/>
          ${dropsGift ? `
          <g class="santa-gift">
            <rect x="206" y="34" width="13" height="11" fill="#e63946" stroke="#1a1a1a" stroke-width="1"/>
            <path d="M206,38 L219,38 M212.5,34 L212.5,45" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M209,34 Q212.5,29 216,34" fill="none" stroke="#ffffff" stroke-width="1.5"/>
          </g>
          ` : ""}
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function buildCornerWebSvg(spokeCount, ringCount) {
  const cx = 100, cy = 0, radius = 100;
  const angles = [];
  for (let i = 0; i < spokeCount; i++) {
    angles.push(90 + (i * (90 / (spokeCount - 1))));
  }
  const toPoint = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: (cx + r * Math.cos(rad)).toFixed(1), y: (cy + r * Math.sin(rad)).toFixed(1) };
  };

  let spokesD = "";
  angles.forEach((a) => {
    const p = toPoint(a, radius);
    spokesD += `M ${cx} ${cy} L ${p.x} ${p.y} `;
  });

  let ringsSvg = "";
  for (let ring = 1; ring <= ringCount; ring++) {
    const frac = ring / (ringCount + 1);
    const pts = angles.map((a) => toPoint(a, radius * frac));
    let d = `M ${pts[0].x} ${pts[0].y} `;
    for (let i = 1; i < pts.length; i++) d += `L ${pts[i].x} ${pts[i].y} `;
    ringsSvg += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.6" opacity="${(0.35 + ring * 0.1).toFixed(2)}"/>`;
  }
  return `<path d="${spokesD}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.7"/>${ringsSvg}`;
}

function renderSpider(cfg, hass, hostEl) {
  const webColor = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const webSvg = buildCornerWebSvg(6, 4);

  const css = `
    .spider-web-container {
      position: fixed; top: 0; right: 0; width: 300px; height: 300px;
      pointer-events: none; z-index: 9999; overflow: visible; color: ${webColor};
    }
    .corner-web {
      position: absolute; top: 0; right: 0; width: 180px; height: 180px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
    }
    .hanging-spider-box {
      position: absolute; top: 40px; right: 50px; width: 26px; height: 26px;
      animation: spider-drop 14s ease-in-out infinite; will-change: transform;
    }
    .spider-web-thread {
      position: absolute; top: -300px; left: 50%; width: 1px; height: 300px;
      background: ${webColor}; transform: translateX(-50%);
    }
    @keyframes spider-drop {
      0%, 100% { transform: translateY(0); }
      26% { transform: translateY(150px); }
      28% { transform: translateY(200px); }
      31% { transform: translateY(158px); }
      34%, 65% { transform: translateY(180px); }
      45%, 55% { transform: translateY(170px); }
    }
    .spider-body-wrapper {
      width: 100%; height: 100%;
      animation: spider-wobble 14s ease-in-out infinite;
    }
    @keyframes spider-wobble {
      0%, 26%, 34%, 100% { transform: rotate(0deg); }
      28% { transform: rotate(9deg); }
      31% { transform: rotate(-6deg); }
    }
    .spider-eye {
      animation: spider-eye-blink 1.4s ease-in-out infinite;
    }
    @keyframes spider-eye-blink {
      0%, 40% { opacity: 1; filter: drop-shadow(0 0 3px #ff2222); }
      50% { opacity: 0.25; filter: drop-shadow(0 0 1px #ff2222); }
      60%, 100% { opacity: 1; filter: drop-shadow(0 0 3px #ff2222); }
    }
  `;

  const html = `
    <div class="spider-web-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg class="corner-web" viewBox="0 0 100 100">${webSvg}</svg>
      <div class="hanging-spider-box">
        <div class="spider-web-thread"></div>
        <div class="spider-body-wrapper">
          <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
            <defs>
              <g id="spider-legs-right">
                <path d="M58,42 Q75,32 88,18" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M58,50 Q80,47 94,42" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M58,58 Q80,62 92,74" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M56,65 Q70,78 76,92" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
              </g>
            </defs>
            <use href="#spider-legs-right"/>
            <use href="#spider-legs-right" transform="translate(100,0) scale(-1,1)"/>
            <circle cx="50" cy="40" r="10" fill="#111"/>
            <ellipse cx="50" cy="62" rx="15" ry="19" fill="#111"/>
            <circle class="spider-eye" cx="45" cy="35" r="2.5" fill="#ff0000"/>
            <circle class="spider-eye" cx="55" cy="35" r="2.5" fill="#ff0000"/>
          </svg>
        </div>
      </div>
    </div>
  `;
  return { css, html };
}





function renderTrain(cfg, hass, hostEl) {
  // Steam train with a variable number of wagons: four fixed everyday/festive
  // wagons, plus optionally one wagon per person at home (from person_entities)
  // and a wagon with free text. The locomotive sits in its own <g
  // transform="translate"> group with local coordinates, so it can easily be
  // adapted to the actual train length.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (30 / interval) * 100).toFixed(2);
  const nowSec = Date.now() / 1000;
  const delaySec = (-(nowSec % interval)).toFixed(2);

  // 5th possible load "Santa's sack": replaces the firewood in the last wagon,
  // but ONLY when the configured sensor (e.g. an input_boolean for the
  // Christmas season) is on.
  const santaActive = cfg.santa_sensor && hass?.states?.[cfg.santa_sensor]?.state === "on";
  // Alternative load "dinner": dishes and food instead of the normal load when
  // the configured dinner sensor is on. Christmas takes precedence if both
  // sensors happen to be on.
  const dinnerActive = !santaActive && cfg.dinner_sensor && hass?.states?.[cfg.dinner_sensor]?.state === "on";
  const cargo0 = santaActive ? "snowman" : dinnerActive ? "plates" : "food";
  const cargo1 = santaActive ? "santa" : dinnerActive ? "roast" : "toys";
  const cargo2 = santaActive ? "presents" : dinnerActive ? "dessert" : "mailbags";
  const cargo3 = santaActive ? "santa_sack" : dinnerActive ? "drinks" : "wood";

  // Occasional gags, decided deterministically from the pass number (no
  // randomness on every render, so a re-render mid-journey does not suddenly
  // make something disappear/appear).
  const flightNumber = Math.floor(nowSec / interval);
  const hasHeartSmoke = flightNumber % 6 === 0;
  const hootPct = (parseFloat(walkPct) * 0.62).toFixed(2);
  const hootEndPct = (parseFloat(walkPct) * 0.72).toFixed(2);

  const smokeHtml = [0, 1, 2].map((i) => {
    if (i === 1 && hasHeartSmoke) {
      // Very rarely the middle smoke puff becomes a heart shape instead of a
      // circle, before dissolving as usual while rising.
      return `
        <path class="train-smoke train-smoke-heart" d="M69,3 C67,0 62,0 62,4 C62,7 69,11 69,11 C69,11 76,7 76,4 C76,0 71,0 69,3 Z"
          fill="#d9d9d9" stroke="#1a1a1a" stroke-width="1.2"
          style="animation-duration:2.85s; animation-delay:0.55s;"/>
      `;
    }
    return `
    <circle class="train-smoke" cx="${76 - i * 11}" cy="${-1 - i * 3}" r="${5.5 + i * 1.4}" fill="#d9d9d9" stroke="#1a1a1a" stroke-width="1.5"
      style="animation-duration:${(2.6 + i * 0.25).toFixed(2)}s; animation-delay:${(i * 0.55).toFixed(2)}s;"/>
  `;
  }).join("");

  // Extra wagons for people who are currently at home - attached behind the
  // four fixed wagons. The order simply follows the order of the entities in
  // the configuration (no sorting needed, the order does not matter).
  const personEntities = typeof cfg.person_entities === "string"
    ? cfg.person_entities.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const personCargoList = personEntities
    .map((eid) => hass?.states?.[eid])
    .filter((st) => st && st.state === "home")
    .map((st) => {
      const picture = st.attributes?.entity_picture;
      const name = st.attributes?.friendly_name || st.entity_id || "?";
      const initial = name.trim().charAt(0).toUpperCase() || "?";
      // Circle deliberately MUCH larger than the rest of the load, growing
      // upwards beyond the normal load area (there is plenty of room, see e.g.
      // Santa's hat) - no name any more, which would have cost space.
      const cargoContent = picture
        ? `
          <circle cx="43" cy="-6" r="36" fill="#e8e0d0" stroke="#1a1a1a" stroke-width="1.8"/>
          <clipPath id="person-clip-${escapeHtml(st.entity_id)}"><circle cx="43" cy="-6" r="33.5"/></clipPath>
          <image x="9.5" y="-39.5" width="67" height="67" href="${escapeHtml(picture)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#person-clip-${escapeHtml(st.entity_id)})"/>
        `
        : `
          <circle cx="43" cy="-6" r="36" fill="#8a9bb0" stroke="#1a1a1a" stroke-width="1.8"/>
          <text x="43" y="5" font-size="38" text-anchor="middle" fill="#ffffff" font-weight="bold">${escapeHtml(initial)}</text>
        `;
      return { cargo: cargoContent, window: "" };
    });

  // Extra wagons with free text (e.g. for guests, a pet or anything else not
  // represented by a person entity). Two possible sources: either a sensor
  // (e.g. input_text) containing comma-separated names ("Marcel, Rudolf") - one
  // wagon per name - or a fixed text. The sensor takes precedence if both are
  // set.
  const customEntityRaw = cfg.custom_wagon_entity
    ? (hass?.states?.[cfg.custom_wagon_entity]?.state || "")
    : "";
  const customEntityUnavailable = ["unknown", "unavailable", "none", ""].includes(String(customEntityRaw).trim().toLowerCase());
  const customNames = (!customEntityUnavailable ? String(customEntityRaw) : (cfg.custom_wagon_text || ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const makeCustomCargo = (text) => {
    const fontSize = text.length <= 4 ? 22 : text.length <= 7 ? 16 : text.length <= 10 ? 12 : 9;
    const safeText = escapeHtml(text.length > 14 ? text.slice(0, 13) + "…" : text);
    return {
      cargo: `
        <circle cx="43" cy="-6" r="36" fill="#f5f0e6" stroke="#1a1a1a" stroke-width="1.8"/>
        <text x="43" y="0" font-size="${fontSize}" text-anchor="middle" fill="#1a1a1a" font-weight="bold">${safeText}</text>
      `,
      window: "",
    };
  };
  const customCargoList = customNames.map(makeCustomCargo);

  // Total number of wagons: four fixed + people + free-text wagons. Only the
  // COUNT is needed here (for positions/width) - which load goes into the first
  // four wagons is decided further down (the CARGO object is not defined yet at
  // this point).
  const wagonCount = 4 + personCargoList.length + customCargoList.length + 1;
  const WAGON_GAP = 93;
  const WAGON_X = Array.from({ length: wagonCount }, (_, i) => 4 + i * WAGON_GAP);
  const LOCO_X = 4 + wagonCount * WAGON_GAP + 8;

  // The SVG width and the visible outer box grow with the actual train length -
  // both in the same ratio, so every wagon always stays the same size (more
  // wagons make the train longer, not squashed) and "preserveAspectRatio" does
  // not distort or clip anything.
  const svgWidth = LOCO_X + 132;
  const svgTop = -60;
  const svgHeight = 66 - svgTop;
  const baseScale = 37 / 90;
  const scale = baseScale;
  const boxWidth = Math.round(svgWidth * scale);
  const boxHeight = Math.round(svgHeight * scale);

  const css = `
    .train-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .train-box {
      position: absolute; bottom: 1vh;
      animation: train-drive ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes train-drive {
      0% { transform: translateX(0); }
      ${walkPct}% { transform: translateX(calc(100vw + ${boxWidth + 40}px)); }
      100% { transform: translateX(calc(100vw + ${boxWidth + 40}px)); }
    }
    .train-wheel {
      /* Rotation removed (saves resources) - wheels are now static */
    }
    .train-smoke {
      animation-name: train-smoke-rise; animation-timing-function: ease-out; animation-iteration-count: infinite;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes train-smoke-rise {
      0%   { transform: translate(0,0) scale(0.5); opacity: 0.9; }
      100% { transform: translate(-95px,-8px) scale(1.7); opacity: 0; }
    }
    .train-hoot {
      animation: train-hoot-pop ${interval}s linear infinite;
      animation-delay: ${delaySec}s;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes train-hoot-pop {
      0%, ${hootPct}% { opacity: 0; transform: scale(0.4) translateY(4px); }
      ${(parseFloat(hootPct) + 1.5).toFixed(2)}% { opacity: 1; transform: scale(1.08) translateY(0); }
      ${hootEndPct}% { opacity: 1; transform: scale(1) translateY(0); }
      ${(parseFloat(hootEndPct) + 2).toFixed(2)}%, 100% { opacity: 0; transform: scale(0.4) translateY(4px); }
    }
    .end-lamp-a, .end-lamp-b {
      animation: end-lamp-blink 1.4s steps(1) infinite;
    }
    .end-lamp-b {
      animation-delay: -0.7s;
    }
    @keyframes end-lamp-blink {
      0%, 49% { fill: #ff2222; }
      50%, 100% { fill: #22cc44; }
    }
  `;

  const wheel = (cx, cy, r) => `
    <g class="train-wheel">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.32).toFixed(1)}" fill="#1a1a1a"/>
    </g>
  `;

  // Four different loads that go on top of the wagon instead of uniform coal -
  // each within the same area (x=2-81, y=8-32) so it fits the wagon outline.
  // Load motifs: deliberately few but LARGE pieces - the wagon is only 87 units
  // wide, and many small pieces turn into unrecognisable blobs on screen. All
  // motifs stand on the wagon floor (y=32) and grow upwards into the free
  // space.
  const CARGO = {
    food: `
      <circle cx="18" cy="18" r="13" fill="#d81f26" stroke="#8a1015" stroke-width="1.8"/>
      <path d="M18,5 Q19,-1 24,-2" stroke="#4a7a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="43.5" cy="17" r="14" fill="#f5a623" stroke="#a86a10" stroke-width="1.8"/>
      <path d="M43.5,3 Q45,-3 50,-4" stroke="#4a7a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="69" cy="18" r="13" fill="#7cb342" stroke="#4a7a1f" stroke-width="1.8"/>
      <path d="M69,5 Q70,-1 75,-2" stroke="#4a7a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `,
    toys: `
      <rect x="6" y="6" width="24" height="26" fill="#4a90d9" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M12,14 L24,14 M18,14 L18,26" stroke="#2a5f96" stroke-width="2.5"/>
      <rect x="32" y="-3" width="24" height="35" fill="#ffd93d" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="44" cy="9" r="6" fill="#e8952a"/>
      <rect x="58" y="10" width="24" height="22" fill="#e63946" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M64,21 L76,21" stroke="#8a2020" stroke-width="2.5"/>
    `,
    presents: `
      <rect x="8" y="10" width="30" height="22" fill="#4a90d9" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M23,10 L23,32 M8,21 L38,21" stroke="#ffd93d" stroke-width="3.5"/>
      <path d="M23,10 Q16,2 13,7 Q16,11 23,10 Q30,2 33,7 Q30,11 23,10 Z" fill="#ffd93d" stroke="#1a1a1a" stroke-width="1.3"/>
      <rect x="46" y="2" width="34" height="30" fill="#e63946" stroke="#1a1a1a" stroke-width="2"/>
      <path d="M63,2 L63,32 M46,17 L80,17" stroke="#7cb342" stroke-width="4"/>
      <path d="M63,2 Q55,-7 52,-1 Q55,3 63,2 Q71,-7 74,-1 Q71,3 63,2 Z" fill="#7cb342" stroke="#1a1a1a" stroke-width="1.3"/>
    `,
    wood: `
      <circle cx="18" cy="19" r="13" fill="#8a5a2f" stroke="#4a2f18" stroke-width="2"/>
      <circle cx="18" cy="19" r="5.5" fill="#c9a05a"/>
      <circle cx="43.5" cy="17" r="14" fill="#6b4423" stroke="#4a2f18" stroke-width="2"/>
      <circle cx="43.5" cy="17" r="6" fill="#a67c3d"/>
      <circle cx="69" cy="19" r="13" fill="#8a5a2f" stroke="#4a2f18" stroke-width="2"/>
      <circle cx="69" cy="19" r="5.5" fill="#c9a05a"/>
    `,
    santa_sack: `
      <path d="M14,32 Q6,7 43.5,1 Q81,7 73,32 Z" fill="#c0392b" stroke="#6b1810" stroke-width="2"/>
      <path d="M24,5 Q43.5,-7 63,5" stroke="#6b1810" stroke-width="2.2" fill="none"/>
      <rect x="26" y="-9" width="15" height="16" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.4"/>
      <path d="M33.5,-9 L33.5,7 M26,-1 L41,-1" stroke="#ffd93d" stroke-width="2"/>
      <circle cx="55" cy="-4" r="8" fill="#ffd93d" stroke="#1a1a1a" stroke-width="1.4"/>
    `,
    snowman: `
      <circle cx="43.5" cy="21" r="11" fill="#f5f5f5" stroke="#c9c2b4" stroke-width="1.6"/>
      <circle cx="43.5" cy="6" r="8.5" fill="#f5f5f5" stroke="#c9c2b4" stroke-width="1.6"/>
      <circle cx="43.5" cy="-6" r="6.5" fill="#f5f5f5" stroke="#c9c2b4" stroke-width="1.6"/>
      <path d="M35,3 L26,-4 M52,3 L61,-4" stroke="#6b4423" stroke-width="2.8" stroke-linecap="round"/>
      <rect x="38" y="-20" width="11" height="9" fill="#1a1a1a"/>
      <rect x="33.5" y="-12" width="20" height="2.8" fill="#1a1a1a"/>
      <circle cx="41" cy="-7" r="1.1" fill="#1a1a1a"/>
      <circle cx="46" cy="-7" r="1.1" fill="#1a1a1a"/>
      <path d="M43.5,-5 L49.5,-3.5 L43.5,-2 Z" fill="#e8952a"/>
      <circle cx="43.5" cy="3" r="1.3" fill="#1a1a1a"/>
      <circle cx="43.5" cy="9" r="1.3" fill="#1a1a1a"/>
    `,
    santa: `
      <rect x="4" y="16" width="18" height="16" fill="#7cb342" stroke="#1a1a1a" stroke-width="1.6"/>
      <path d="M13,16 L13,32 M4,24 L22,24" stroke="#e63946" stroke-width="2.2"/>
      <circle cx="46" cy="20" r="12" fill="#c0392b" stroke="#6b1810" stroke-width="1.6"/>
      <rect x="36" y="24" width="20" height="4.5" fill="#1a1a1a"/>
      <circle cx="46" cy="2" r="8" fill="#f0d1a8" stroke="#c9a878" stroke-width="1.1"/>
      <path d="M38,6 Q46,15 54,6 L54,11 Q46,18 38,11 Z" fill="#ffffff"/>
      <path d="M37,-3 Q46,-14 55,-3 Q55,-12 46,-14 Q37,-12 37,-3 Z" fill="#c0392b" stroke="#6b1810" stroke-width="1.4"/>
      <circle cx="55" cy="-13" r="3.2" fill="#ffffff"/>
      <circle cx="43" cy="1" r="1.2" fill="#1a1a1a"/>
      <circle cx="49" cy="1" r="1.2" fill="#1a1a1a"/>
      <rect x="66" y="14" width="17" height="18" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.6"/>
      <path d="M74.5,14 L74.5,32 M66,23 L83,23" stroke="#ffd93d" stroke-width="2.2"/>
    `,
    plates: `
      <ellipse cx="43.5" cy="27" rx="32" ry="5.5" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="43.5" cy="20" rx="22" ry="10" fill="#e8d9c0" stroke="#c9b48a" stroke-width="1.4"/>
      <circle cx="32" cy="15" r="5.5" fill="#e63946" stroke="#8a2020" stroke-width="1.1"/>
      <circle cx="45" cy="11" r="6" fill="#7cb342" stroke="#4a7a1f" stroke-width="1.1"/>
      <circle cx="58" cy="15" r="5" fill="#e8952a" stroke="#a86a10" stroke-width="1.1"/>
    `,
    roast: `
      <ellipse cx="43.5" cy="28" rx="32" ry="5" fill="#e8d9c0" stroke="#1a1a1a" stroke-width="1.8"/>
      <path d="M27,21 L17,30 M60,21 L70,30" stroke="#c9791a" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="43.5" cy="13" rx="22" ry="14" fill="#c9791a" stroke="#8a4f0f" stroke-width="1.8"/>
      <path d="M32,6 Q43.5,0 55,6" stroke="#8a4f0f" stroke-width="1.6" fill="none"/>
      <circle cx="13" cy="25" r="5" fill="#7cb342" stroke="#4a7a1f" stroke-width="1.2"/>
      <circle cx="74" cy="25" r="5" fill="#e63946" stroke="#8a2020" stroke-width="1.2"/>
    `,
    drinks: `
      <rect x="8" y="4" width="16" height="28" rx="2.5" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.8"/>
      <rect x="13" y="-6" width="6" height="11" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="10" y="12" width="12" height="9" fill="#e8f0f8" opacity="0.85"/>
      <rect x="35" y="-2" width="17" height="34" rx="2.5" fill="#7cb342" stroke="#1a1a1a" stroke-width="1.8"/>
      <rect x="40.5" y="-13" width="6" height="12" fill="#7cb342" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="37.5" y="8" width="12" height="9" fill="#eef7e4" opacity="0.85"/>
      <path d="M62,8 L79,8 L76,32 L65,32 Z" fill="#e8952a" stroke="#1a1a1a" stroke-width="1.8"/>
      <rect x="67.5" y="-2" width="6" height="11" fill="#e8952a" stroke="#1a1a1a" stroke-width="1.5"/>
    `,
    mailbags: `
      <path d="M8,32 Q2,10 22,4 Q42,10 36,32 Z" fill="#9a8a68" stroke="#4a3f28" stroke-width="2"/>
      <path d="M13,6 Q22,-4 31,6" stroke="#4a3f28" stroke-width="2.2" fill="none"/>
      <rect x="14" y="14" width="16" height="11" fill="#e8d9c0" stroke="#4a3f28" stroke-width="1.3"/>
      <path d="M48,32 Q42,12 62,6 Q82,12 76,32 Z" fill="#8a7a5a" stroke="#4a3f28" stroke-width="2"/>
      <path d="M53,8 Q62,-2 71,8" stroke="#4a3f28" stroke-width="2.2" fill="none"/>
      <rect x="54" y="16" width="16" height="11" fill="#e8d9c0" stroke="#4a3f28" stroke-width="1.3"/>
    `,
    dessert: `
      <path d="M8,32 L13,9 L35,9 L40,32 Z" fill="#e8c9a0" stroke="#1a1a1a" stroke-width="1.8"/>
      <ellipse cx="24" cy="8" rx="13" ry="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.5"/>
      <circle cx="24" cy="0" r="4" fill="#e63946" stroke="#8a2020" stroke-width="1.1"/>
      <path d="M52,7 L73,7 L62.5,32 Z" fill="#e8c9a0" stroke="#1a1a1a" stroke-width="1.8"/>
      <path d="M56,14 L69,14 M58,20 L67,20" stroke="#c9a878" stroke-width="1.4"/>
      <circle cx="62.5" cy="1" r="9" fill="#f0a0b8" stroke="#1a1a1a" stroke-width="1.5"/>
      <circle cx="62.5" cy="-10" r="6.5" fill="#fff0c0" stroke="#1a1a1a" stroke-width="1.5"/>
    `,
  };

  // Complete list of wagon contents: four fixed + people + optional free text
  // (count/positions were already computed further up).
  const endMarkerCargo = `
    <rect x="15" y="10" width="53" height="20" rx="3" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="1.5"/>
    <circle class="end-lamp-a" cx="28" cy="20" r="7" fill="#ff2222" stroke="#1a1a1a" stroke-width="1.5"/>
    <circle class="end-lamp-b" cx="55" cy="20" r="7" fill="#22cc44" stroke="#1a1a1a" stroke-width="1.5"/>
    <circle cx="28" cy="20" r="3" fill="#ffffff" opacity="0.6"/>
    <circle cx="55" cy="20" r="3" fill="#ffffff" opacity="0.6"/>
  `;

  const allCargo = [
    { cargo: endMarkerCargo, window: "", wheels: 2 },
    ...customCargoList,
    ...[...personCargoList].reverse(),
    { cargo: CARGO[cargo0], window: "" },
    { cargo: CARGO[cargo1], window: "" },
    { cargo: CARGO[cargo2], window: "" },
    { cargo: CARGO[cargo3], window: "" },
  ];

  const wagon = (x, cargoContent, windowContent = "", wheelCount = 3) => {
    const wheelXs = wheelCount === 2 ? [22, 65] : [15, 43, 71];
    return `
    <g transform="translate(${x},0)">
      ${cargoContent}
      <path d="M0,32 L83,32 Q87,32 87,38 L87,48 Q87,52 83,52 L4,52 Q0,52 0,48 Z" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2.5"/>
      <rect x="8" y="39" width="71" height="9" fill="#ffd966"/>
      ${windowContent}
      ${wheelXs.map((wx) => wheel(wx, 58, 6.5)).join("")}
    </g>
  `;
  };

  const couplingsHtml = WAGON_X
    .map((x, i) => {
      const nextX = i < WAGON_X.length - 1 ? WAGON_X[i + 1] : LOCO_X;
      return `M${x + 87},50 L${nextX},50`;
    })
    .map((d) => `<path d="${d}" stroke="#1a1a1a" stroke-width="2"/>`)
    .join("");

  // The complete locomotive in local coordinates (0 = its own start), moved
  // into place with translate(LOCO_X,0).
  const locoHtml = `
    <g transform="translate(${LOCO_X},0)">
      <!-- Chassis frame -->
      <rect x="0" y="42" width="96" height="8" fill="#3a3a3a"/>
      <!-- Red boiler -->
      <rect x="2" y="18" width="60" height="26" rx="10" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2.5"/>
      <path d="M18,18 L18,8 M25,18 L23,10" stroke="#ee1c1c" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cab with small flag -->
      <path d="M56,8 L56,2 L62,8 Z" fill="#ee1c1c"/>
      <rect x="34" y="6" width="24" height="22" rx="2" fill="#ffd966" stroke="#1a1a1a" stroke-width="2.5"/>
      <path d="M38,22 L42,12" stroke="#c9a227" stroke-width="2"/>
      <!-- Black round nose -->
      <path d="M60,18 Q86,13 100,24 Q100,37 90,42 Q72,44 60,40 Z" fill="#1a1a1a"/>
      <!-- Small headlamp -->
      <circle cx="97" cy="25" r="4" fill="#fff3c4" stroke="#c9a227" stroke-width="1.3"/>
      <circle cx="97" cy="25" r="1.6" fill="#ffffff"/>
      <!-- Chimney -->
      <path d="M73,17 L69,5 Q69,1 75,1 L86,1 Q92,1 92,5 L88,17 Z" fill="#f5f0e6" stroke="#1a1a1a" stroke-width="2.5"/>
      <!-- Steam -->
      <g>${smokeHtml}</g>
      <!-- Horn speech bubble, appears briefly during the run -->
      <g class="train-hoot">
        <path d="M26,-6 Q26,-17 37,-17 L61,-17 Q72,-17 72,-6 Q72,4 61,4 L44,4 L38,9 L39,4 Q26,4 26,-6 Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.8"/>
        <text x="49" y="-2.5" font-size="9" font-family="Georgia, serif" font-weight="bold" fill="#1a1a1a" text-anchor="middle">TOOT</text>
      </g>
      <!-- Cowcatcher -->
      <path d="M99,42 Q110,46 116,54 L94,54 Z" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2"/>
      <!-- Locomotive wheels -->
      <path d="M22,50 L56,50" stroke="#1a1a1a" stroke-width="3"/>
      ${wheel(20, 54, 10)}
      ${wheel(56, 54, 10)}
      ${wheel(88, 56, 7)}
    </g>
  `;

  const html = `
    <div class="train-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="train-box" style="width:${boxWidth}px; height:${boxHeight}px; left:-${boxWidth + 24}px;">
        <svg viewBox="0 ${svgTop} ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
          <!-- Ground/track line -->
          <path d="M2,58 L${svgWidth - 4},58" stroke="#1a1a1a" stroke-width="2"/>

          <!-- All wagons: four fixed plus optional person and free-text wagons -->
          ${allCargo.map((item, i) => wagon(WAGON_X[i], item.cargo, item.window, item.wheels || 3)).join("\n")}

          <!-- Couplings between all wagons and to the locomotive -->
          ${couplingsHtml}

          ${locoHtml}
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderDog(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (20 / interval) * 100);
  const startHeight = typeof cfg._startHeight === "number" ? cfg._startHeight : Math.random() * 70 + 10;
  const drift = typeof cfg._drift === "number" ? cfg._drift : (Math.random() * 16 - 8);
  const delaySec = (-((Date.now() / 1000) % interval)).toFixed(2);

  // Sniffing pause: short stop + head lowered, at about 40% of the route.
  const sniffFrac = 0.4;
  const sniffStart = (walkPct * sniffFrac).toFixed(2);
  const sniffMid = (walkPct * sniffFrac + 0.8).toFixed(2);
  const sniffEnd = (walkPct * sniffFrac + 1.6).toFixed(2);

  // Shaking in the rain: only when a real weather entity is configured AND it
  // currently reports rain - otherwise nothing happens (no invented state).
  // Important: this checks the entity directly, regardless of whether another
  // card is showing the rain effect - two cards cannot "see" each other.
  const rainStates = ["rainy", "pouring", "lightning-rainy", "snowy-rainy"];
  const isRaining = cfg.weather_entity && rainStates.includes(hass?.states?.[cfg.weather_entity]?.state);

  const css = `
    .dog-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .dog-walk-box {
      position: absolute; top: ${startHeight.toFixed(2)}vh; left: -185px; width: 165px; height: 55px;
      animation: dog-walk ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes dog-walk {
      0% { transform: translate(0, 0); }
      ${sniffStart}% { transform: translate(calc((100vw + 300px) * ${sniffFrac}), ${(drift * sniffFrac).toFixed(2)}vh); }
      ${sniffEnd}% { transform: translate(calc((100vw + 300px) * ${sniffFrac}), ${(drift * sniffFrac).toFixed(2)}vh); }
      ${walkPct.toFixed(2)}% { transform: translate(calc(100vw + 300px), ${drift.toFixed(2)}vh); }
      100% { transform: translate(calc(100vw + 300px), ${drift.toFixed(2)}vh); }
    }
    .dog-bob {
      animation: dog-bob 0.55s ease-in-out infinite alternate;
    }
    @keyframes dog-bob {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }
    .dog-leg-a { animation: dog-leg-swing-a 0.55s ease-in-out infinite alternate; }
    .dog-leg-b { animation: dog-leg-swing-b 0.55s ease-in-out infinite alternate; }
    @keyframes dog-leg-swing-a {
      0% { transform: rotate(-14deg); }
      100% { transform: rotate(14deg); }
    }
    @keyframes dog-leg-swing-b {
      0% { transform: rotate(14deg); }
      100% { transform: rotate(-14deg); }
    }
    .dog-tail {
      animation: dog-tail-wag 0.35s ease-in-out infinite alternate;
      transform-box: fill-box; transform-origin: 100% 50%;
    }
    @keyframes dog-tail-wag {
      0% { transform: rotate(-8deg); }
      100% { transform: rotate(12deg); }
    }
    .dog-sniff-pose {
      animation: dog-sniff-cycle ${interval}s ease-in-out infinite;
      animation-delay: ${delaySec}s;
      transform-box: fill-box; transform-origin: 90% 60%;
    }
    @keyframes dog-sniff-cycle {
      0% { transform: rotate(0deg) translateY(0); }
      ${sniffStart}% { transform: rotate(0deg) translateY(0); }
      ${sniffMid}% { transform: rotate(16deg) translateY(3px); }
      ${sniffEnd}% { transform: rotate(0deg) translateY(0); }
      100% { transform: rotate(0deg) translateY(0); }
    }
    .dog-head-bounce {
      animation: dog-head-nod 0.55s ease-in-out infinite alternate;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes dog-head-nod {
      0% { transform: translateY(0); }
      100% { transform: translateY(-2px); }
    }
    .dog-ear {
      /* Swinging removed (saves resources) - ear stays still */
    }
    .dog-tongue {
      /* Wagging removed (saves resources) - tongue stays still */
    }
    .dog-print {
      animation: dog-print-fade 1.1s ease-out infinite;
    }
    @keyframes dog-print-fade {
      0% { opacity: 0; }
      15% { opacity: 0.45; }
      60% { opacity: 0.22; }
      100% { opacity: 0; }
    }
    ${isRaining ? `
    .dog-shake {
      animation: dog-shake-cycle 9s ease-in-out infinite;
      transform-box: fill-box; transform-origin: 50% 70%;
    }
    @keyframes dog-shake-cycle {
      0%, 92% { transform: rotate(0deg); }
      93% { transform: rotate(-6deg); }
      94% { transform: rotate(6deg); }
      95% { transform: rotate(-5deg); }
      96% { transform: rotate(5deg); }
      97% { transform: rotate(-3deg); }
      98%, 100% { transform: rotate(0deg); }
    }
    ` : ""}
  `;

  const html = `
    <div class="dog-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="dog-walk-box">
        <div class="dog-bob">
          <svg viewBox="-25 0 145 55" preserveAspectRatio="xMidYMid meet">
            <g class="${isRaining ? "dog-shake" : ""}">
              <g class="dog-leg-a" style="transform-origin: 88px 36px;">
                <path d="M88,36 Q92,42 95,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
              </g>
              <g class="dog-leg-b" style="transform-origin: 78px 36px;">
                <path d="M78,36 Q76,42 74,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
              </g>
              <g class="dog-leg-b" style="transform-origin: 35px 36px;">
                <path d="M35,36 Q39,42 42,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
              </g>
              <g class="dog-leg-a" style="transform-origin: 25px 36px;">
                <path d="M25,36 Q21,42 18,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
              </g>
              <ellipse class="dog-print" cx="20" cy="49.5" rx="2.8" ry="1.3" fill="#8a6f45"/>
              <ellipse class="dog-print" cx="40" cy="49.5" rx="2.8" ry="1.3" fill="#8a6f45" style="animation-delay:0.55s;"/>
              <g class="dog-tail">
                <path d="M24,22 Q4,8 -14,14 Q-8,24 2,26 Q10,28 24,24 Z" fill="#d4a25c"/>
              </g>
              <ellipse cx="55" cy="25" rx="35" ry="14" fill="#d4a25c"/>
              <g class="dog-sniff-pose">
                <g class="dog-head-bounce">
                  <ellipse cx="95" cy="18" rx="13" ry="11" fill="#d4a25c"/>
                  <g class="dog-ear">
                    <path d="M90,12 Q80,10 82,22 Q86,26 92,20 Z" fill="#a67c3d"/>
                  </g>
                  <ellipse cx="106" cy="23" rx="7" ry="5.5" fill="#e8c78a"/>
                  <circle cx="112" cy="23" r="2" fill="#2a1a10"/>
                  <circle cx="97" cy="15" r="1.6" fill="#2a1a10"/>
                  <path class="dog-tongue" d="M105,27 Q107,33 109,27 Q107,29.5 105,27 Z" fill="#e8879a"/>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  `;
  return { css, html };
}

function renderComet(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#1a3a5c", "#bfe9ff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const flightSeconds = 3.5;
  const flightPct = Math.min(30, (flightSeconds / interval) * 100).toFixed(2);
  // Fade-in and fade-out MUST be relative to the flight duration, not fixed
  // percentages of the whole cycle: with rare passes the flight is only ~1.7%
  // of the cycle, so a hard-coded "1%" would have used almost all of it for
  // fading in - the comet would only have been visible for the last fraction of
  // a second.
  const cometFadeInPct = (parseFloat(flightPct) * 0.12).toFixed(3);
  const fadePct = (parseFloat(flightPct) * 1.2).toFixed(2);
  const delaySec = (-((Date.now() / 1000) % interval)).toFixed(2);

  const css = `
    .comet-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .comet-box {
      position: absolute; top: -10vh; left: -20vw; width: 220px; height: 5px;
      animation-name: comet-fly; animation-timing-function: linear; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s;
      will-change: transform, opacity;
    }
    .comet-trail {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, ${color});
      border-radius: 50%; filter: blur(1px);
    }
    .comet-head {
      position: absolute; right: -3px; top: 50%; transform: translateY(-50%);
      width: 8px; height: 8px; border-radius: 50%; background: ${color};
      box-shadow: 0 0 14px 4px ${color};
    }
    @keyframes comet-fly {
      0% { transform: translate(0, 0) rotate(35deg); opacity: 0; }
      ${cometFadeInPct}% { opacity: ${finalOpacity}; }
      ${flightPct}% { transform: translate(130vw, 100vh) rotate(35deg); opacity: ${finalOpacity}; }
      ${fadePct}% { opacity: 0; }
      100% { opacity: 0; transform: translate(130vw, 100vh) rotate(35deg); }
    }
  `;
  const html = `
    <div class="comet-container" aria-hidden="true">
      <div class="comet-box">
        <div class="comet-trail"></div>
        <div class="comet-head"></div>
      </div>
    </div>
  `;
  return { css, html };
}

function renderBats(cfg, hass, hostEl) {
  // Improvement (bugfix): bats used to be solid black - practically invisible
  // on a dark theme background (same problem as the clouds had before). Now
  // theme-dependent: dark grey-violet on light backgrounds, lighter grey-violet
  // on dark backgrounds - deliberately staying "nocturnal" rather than
  // colourful.
  const color = resolveDynamicColor(cfg.color, hass, "#2a2530", "#cbc4d9", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "bats");

  const bats = getCachedRandomSet("bats", count, () => ({
    top: (Math.random() * 85).toFixed(2),
    dur: (Math.random() * 6 + 9).toFixed(2),
    delay: (Math.random() * -12).toFixed(2),
    flapDur: (Math.random() * 0.2 + 0.25).toFixed(2),
    baseOp: (Math.random() * 0.3 + 0.5).toFixed(2),
    wobble: Math.floor(Math.random() * 10) + 6,
  }));

  const batHtml = bats.map((b) => {
    const op = isHigh ? Math.max(parseFloat(b.baseOp), 0.85) : (parseFloat(b.baseOp) * opacity);
    return `
    <div class="bat" style="top:${b.top}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; opacity:${op.toFixed(2)}; --wobble:${b.wobble}vh;">
      <svg viewBox="0 0 40 20" class="bat-wings" style="animation-duration:${b.flapDur}s;">
        <path d="M20,10 L2,0 L9,7 L0,10 L9,13 L2,20 Z" fill="${color}"/>
        <path d="M20,10 L38,0 L31,7 L40,10 L31,13 L38,20 Z" fill="${color}"/>
        <ellipse cx="20" cy="10" rx="3" ry="4" fill="${color}"/>
        <path d="M17,7 L14,3 M23,7 L26,3" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("bats-container")}
    .bat {
      position: absolute; left: -10vw; width: 40px;
      animation-name: bat-fly; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    .bat-wings {
      width: 100%; height: auto; display: block;
      animation-name: bat-flap; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate;
      transform-origin: center;
    }
    @keyframes bat-fly {
      0%   { transform: translateX(0) translateY(0); }
      25%  { transform: translateX(30vw) translateY(calc(-1 * var(--wobble))); }
      50%  { transform: translateX(60vw) translateY(var(--wobble)); }
      75%  { transform: translateX(90vw) translateY(calc(-1 * var(--wobble))); }
      100% { transform: translateX(120vw) translateY(0); }
    }
    @keyframes bat-flap {
      0% { transform: scaleY(1); }
      100% { transform: scaleY(0.4); }
    }
  `;
  return { css, html: `<div class="bats-container" aria-hidden="true">${batHtml}</div>` };
}

function renderBirdhouse(cfg, hass, hostEl) {
  // Birdhouse: fixed in the top left (smaller than the owl), always visible.
  // Periodically a small bird flies in from the left, "lands" briefly at the
  // entrance hole (short pause + wing flaps), then flies on out of the screen
  // to the right. Uses the same start-time technique as Santa/comet/steam train
  // so a re-render does not interrupt the approach.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 100, medium: 60, high: 30 }[cfg.count_preset || "medium"] || 60;
  const delaySec = (-((Date.now() / 1000) % interval)).toFixed(2);
  // Share of the cycle for the complete approach + fly-by (the rest is a pause
  // in which the bird waits invisibly).
  const flightPct = Math.min(35, (9 / interval) * 100).toFixed(2);
  const birdFadeInPct = (parseFloat(flightPct) * 0.15).toFixed(3);
  const landPct = (flightPct * 0.4).toFixed(2);
  const leavePct = (flightPct * 0.6).toFixed(2);

  const css = `
    .birdhouse-box {
      position: fixed; top: 2vh; left: 1vw; width: 58px; height: 78px;
      pointer-events: none; z-index: 999997;
    }
    .bird-fly-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 999999; overflow: hidden;
    }
    .bird-fly-box {
      position: absolute; top: 6vh; left: -6vw; width: 30px; height: 24px;
      animation-name: bird-visit; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes bird-visit {
      0%   { transform: translate(0, 4vh); opacity: 0; }
      ${birdFadeInPct}%   { opacity: ${finalOpacity}; }
      ${landPct}% { transform: translate(9vw, 0); opacity: ${finalOpacity}; }
      ${leavePct}% { transform: translate(9vw, 0); opacity: ${finalOpacity}; }
      ${flightPct}% { transform: translate(112vw, -3vh); opacity: ${finalOpacity}; }
      100% { transform: translate(112vw, -3vh); opacity: 0; }
    }
    .bird-wing {
      animation: bird-wing-flap 0.15s ease-in-out infinite alternate;
      transform-origin: 15px 10px;
    }
    @keyframes bird-wing-flap {
      0% { transform: scaleY(1) rotate(0deg); }
      100% { transform: scaleY(0.5) rotate(-15deg); }
    }
  `;
  const html = `
    <div class="birdhouse-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 58 78" style="width:100%; height:100%;">
        <g transform="translate(5.941,9.941) scale(0.8235)">
        <path d="M-6,68 Q26,58 62,68 L62,74 Q26,66 -6,74 Z" fill="#5a3d24"/>
        <path d="M4,10 L29,-6 L54,10 Z" fill="#a83a2a" stroke="#6b2015" stroke-width="2"/>
        <path d="M6,12 L52,12 L48,54 Q48,58 44,58 L14,58 Q10,58 10,54 Z" fill="#c68a3d" stroke="#6b4a2f" stroke-width="2"/>
        <circle cx="29" cy="32" r="8" fill="#3a2712"/>
        <path d="M20,44 L38,44" stroke="#6b4a2f" stroke-width="3" stroke-linecap="round"/>
        <path d="M29,58 L29,64" stroke="#6b4a2f" stroke-width="3"/>
        </g>
      </svg>
    </div>
    <div class="bird-fly-container" aria-hidden="true">
      <div class="bird-fly-box">
        <svg viewBox="0 0 33 24" style="width:100%; height:100%;">
          <ellipse cx="15" cy="12" rx="9" ry="6.5" fill="#4a90d9"/>
          <circle cx="24" cy="9" r="4.5" fill="#4a90d9"/>
          <path d="M28,8 L32,9 L28,11 Z" fill="#e8952a"/>
          <circle cx="25" cy="8" r="1" fill="#1a1a1a"/>
          <path class="bird-wing" d="M15,10 Q6,4 3,12 Q9,14 15,10 Z" fill="#3a7ab8"/>
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderMoon(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;

  const phase = getMoonPhase(new Date());
  const lightPath = moonPhasePath(29, 39, 24, phase);

  // The unlit part of the moon needs different colours on light and dark
  // backgrounds: on dark it can be strongly dark (looks like a real night-sky
  // moon); on light the same colour would look like an out-of-place dark blot -
  // there a subtle light grey with a darker edge works better.
  const dark = isDarkModeActive(hass, hostEl);
  const unlitFill = dark ? "#2a3a4a" : "#d8dce0";
  const unlitStroke = dark ? "#5a6a7a" : "#a8b0b8";

  const css = `
    .moon-container {
      position: fixed; top: 2vh; right: 1vw; width: 58px; height: 78px;
      pointer-events: none; z-index: 999998;
    }
    .moon-glow {
      animation: moon-glow-pulse 6s ease-in-out infinite;
    }
    @keyframes moon-glow-pulse {
      0%, 100% { opacity: 0.75; }
      50% { opacity: 1; }
    }
  `;

  // Five craters spread over the whole disc - clipped to the lit area with a
  // clipPath, so at every phase (not only full moon) they only appear where
  // light actually falls.
  const craterStyle = `fill="#cfbf8c" stroke="#b09d68" stroke-width="0.7"`;
  const cratersSvg = `
    <circle cx="20" cy="29" r="4" ${craterStyle}/>
    <circle cx="37" cy="44" r="3" ${craterStyle}/>
    <circle cx="25" cy="50" r="2.4" ${craterStyle}/>
    <circle cx="41" cy="29" r="2.2" ${craterStyle}/>
    <circle cx="14" cy="41" r="2" ${craterStyle}/>
    <circle cx="45" cy="40" r="2.3" ${craterStyle}/>
    <circle cx="31" cy="34" r="1.6" ${craterStyle}/>
  `;

  let moonSvg;
  if (lightPath === null) {
    // New moon: almost nothing visible, only the dark outline - realistic.
    moonSvg = `<circle cx="29" cy="39" r="24" fill="${unlitFill}" stroke="${unlitStroke}" stroke-width="1"/>`;
  } else if (lightPath === "full") {
    moonSvg = `
      <circle cx="29" cy="39" r="24" fill="#f0e6c8" stroke="${unlitStroke}" stroke-width="1"/>
      ${cratersSvg}
    `;
  } else {
    moonSvg = `
      <defs>
        <clipPath id="moon-light-clip">
          <path d="${lightPath}"/>
        </clipPath>
      </defs>
      <circle cx="29" cy="39" r="24" fill="${unlitFill}" stroke="${unlitStroke}" stroke-width="1"/>
      <path d="${lightPath}" fill="#f0e6c8"/>
      <g clip-path="url(#moon-light-clip)">
        ${cratersSvg}
      </g>
    `;
  }

  const html = `
    <div class="moon-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 58 78" style="width:100%; height:100%;">
        <g transform="translate(-4.143,-12.571) scale(1.1429)">
        <g class="moon-glow">
          ${moonSvg}
        </g>
        </g>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderSun(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;

  const css = `
    .sun-container {
      position: fixed; top: 2vh; right: 1vw; width: 58px; height: 78px;
      pointer-events: none; z-index: 999998;
    }
    .sun-halo {
      animation: sun-glow 4s ease-in-out infinite;
    }
    .sun-core {
      animation: sun-pulse 4s ease-in-out infinite;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes sun-glow {
      0%, 100% { opacity: 0.75; }
      50% { opacity: 1; }
    }
    @keyframes sun-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
  `;

  // Glow deliberately done with a gradient instead of a blur filter: filters
  // can produce a visible rectangle around the figure on weaker browsers (e.g.
  // Fire TV).
  const html = `
    <div class="sun-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 58 78" style="width:100%; height:100%;">
        <g transform="translate(0,-7) scale(1)">
        <defs>
          <radialGradient id="sun-halo-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffd93d" stop-opacity="0.9"/>
            <stop offset="55%" stop-color="#ffc233" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#ffb020" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="sun-core-grad" cx="42%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#fff4b0"/>
            <stop offset="55%" stop-color="#ffcb3d"/>
            <stop offset="100%" stop-color="#f5a623"/>
          </radialGradient>
        </defs>
        <circle class="sun-halo" cx="29" cy="39" r="28" fill="url(#sun-halo-grad)"/>
        <circle class="sun-core" cx="29" cy="39" r="16" fill="url(#sun-core-grad)" stroke="#d98a1a" stroke-width="2"/>
        </g>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderOwl(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;

  const css = `
    .owl-container {
      position: fixed; top: 2vh; left: 1vw; width: 58px; height: 78px;
      pointer-events: none; z-index: 999999;
    }
    .owl-head {
      animation: owl-turn 9s ease-in-out infinite;
      transform-box: fill-box; transform-origin: 50% 62%;
    }
    .owl-body {
      animation: owl-breathe 4s ease-in-out infinite;
      transform-box: fill-box; transform-origin: 50% 72%;
    }
    .owl-eye-lid.left {
      animation: owl-blink-left 9s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    .owl-eye-lid.right {
      animation: owl-blink-right 9s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    @keyframes owl-turn {
      0%, 40% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg); }
      60%, 90% { transform: rotate(0deg); }
      95% { transform: rotate(6deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes owl-breathe {
      0%, 100% { transform: scale(1, 1); }
      50% { transform: scale(1.02, 0.98); }
    }
    @keyframes owl-blink-left {
      0%, 18%, 26%, 100% { transform: scaleY(0); }
      22% { transform: scaleY(1); }
    }
    @keyframes owl-blink-right {
      0%, 58%, 66%, 100% { transform: scaleY(0); }
      62% { transform: scaleY(1); }
    }
  `;
  const html = `
    <div class="owl-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 58 78" style="width:100%; height:100%;">
        <g transform="translate(1,2.133) scale(0.4667)">
        <path d="M92,10 A14,14 0 1,0 92,38 A11,11 0 1,1 92,10 Z" fill="#f4ecd8" opacity="0.8"/>
        <path d="M0,112 Q60,102 120,112 L120,120 Q60,110 0,120 Z" fill="#5a3d24"/>
        <path d="M14,108 L4,100 M100,108 L112,100" stroke="#5a3d24" stroke-width="3" stroke-linecap="round"/>
        <g class="owl-body">
          <path d="M28,58 Q16,78 24,103 Q30,105 36,98 Q32,78 38,60 Z" fill="#5a3d24"/>
          <path d="M92,58 Q104,78 96,103 Q90,105 84,98 Q88,78 82,60 Z" fill="#5a3d24"/>
          <ellipse cx="60" cy="82" rx="32" ry="30" fill="#6b4a2f"/>
          <ellipse cx="60" cy="88" rx="20" ry="22" fill="#8a6238"/>
          <path d="M48,74 L60,82 L72,74 M46,84 L60,92 L74,84 M48,96 L60,104 L72,96"
                fill="none" stroke="#6b4a2f" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M50,110 L46,118 M50,110 L50,120 M50,110 L54,118
                    M70,110 L66,118 M70,110 L70,120 M70,110 L74,118"
                stroke="#e8952a" stroke-width="2.5" stroke-linecap="round"/>
        </g>
        <g class="owl-head">
          <path d="M40,24 L32,4 L48,20 Z" fill="#5a3d24"/>
          <path d="M80,24 L88,4 L72,20 Z" fill="#5a3d24"/>
          <circle cx="60" cy="47" r="28" fill="#8a6238"/>
          <circle cx="48" cy="46" r="13" fill="#f4ead9"/>
          <circle cx="72" cy="46" r="13" fill="#f4ead9"/>
          <circle cx="48" cy="46" r="8" fill="#e8952a"/>
          <circle cx="72" cy="46" r="8" fill="#e8952a"/>
          <circle cx="48" cy="46" r="4" fill="#1a1a1a"/>
          <circle cx="72" cy="46" r="4" fill="#1a1a1a"/>
          <circle cx="46" cy="43" r="1.6" fill="#ffffff"/>
          <circle cx="70" cy="43" r="1.6" fill="#ffffff"/>
          <circle class="owl-eye-lid left" cx="48" cy="46" r="13" fill="#8a6238"/>
          <circle class="owl-eye-lid right" cx="72" cy="46" r="13" fill="#8a6238"/>
          <path d="M54,56 L66,56 L60,66 Z" fill="#e8952a"/>
        </g>
        </g>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderBee(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "bee");

  const bees = getCachedRandomSet("bee", count, () => ({
    top: (Math.random() * 80).toFixed(2),
    dur: (Math.random() * 8 + 14).toFixed(2),
    delay: (Math.random() * -20).toFixed(2),
    wobble: Math.floor(Math.random() * 14) + 6,
    baseOp: (Math.random() * 0.2 + 0.75).toFixed(2),
  }));

  const beeHtml = bees.map((b) => {
    const op = isHigh ? Math.max(parseFloat(b.baseOp), 0.9) : (parseFloat(b.baseOp) * opacity);
    return `
    <div class="bee" style="top:${b.top}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; opacity:${op.toFixed(2)}; --wobble:${b.wobble}vh;">
      <svg viewBox="0 0 34 26" preserveAspectRatio="xMidYMid meet">
        <ellipse class="bee-wing" cx="13" cy="6" rx="8" ry="5" fill="#eef6ff" opacity="0.85" stroke="#c3d6ea" stroke-width="0.6"/>
        <ellipse class="bee-wing" cx="27" cy="6" rx="8" ry="5" fill="#eef6ff" opacity="0.85" stroke="#c3d6ea" stroke-width="0.6"/>
        <ellipse cx="20" cy="14" rx="11" ry="8" fill="#2a1a05"/>
        <rect x="12" y="10" width="4" height="8" fill="#f5c518"/>
        <rect x="20" y="10" width="4" height="8" fill="#f5c518"/>
        <rect x="28" y="10" width="3" height="8" fill="#f5c518"/>
        <circle cx="9" cy="14" r="4" fill="#1a1a1a"/>
      </svg>
    </div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("bee-container")}
    .bee {
      position: absolute; left: -8vw; width: 34px;
      animation-name: bee-zigzag; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    .bee-wing {
      animation: bee-wing-flap 0.12s ease-in-out infinite alternate;
      transform-origin: 20px 9px;
    }
    @keyframes bee-zigzag {
      0%   { transform: translateX(0) translateY(0); }
      20%  { transform: translateX(24vw) translateY(calc(-1 * var(--wobble))); }
      40%  { transform: translateX(48vw) translateY(var(--wobble)); }
      60%  { transform: translateX(72vw) translateY(calc(-0.6 * var(--wobble))); }
      80%  { transform: translateX(96vw) translateY(var(--wobble)); }
      100% { transform: translateX(120vw) translateY(0); }
    }
    @keyframes bee-wing-flap {
      0% { transform: scaleY(1); }
      100% { transform: scaleY(0.55); }
    }
  `;
  return { css, html: `<div class="bee-container" aria-hidden="true">${beeHtml}</div>` };
}

// Improvement: generates a branching frost/hoarfrost pattern mathematically
// (like the spider web), growing diagonally into the screen from a corner (0,0)
// - main branches with small side twigs.

function renderClouds(cfg, hass, hostEl) {
  // Improvement (bugfix): clouds used to be fixed light grey/white -
  // practically invisible on a light theme background. Now theme-dependent like
  // the other weather effects: dark grey on light backgrounds, light grey on
  // dark backgrounds.
  const color = resolveDynamicColor(cfg.color, hass, "#57626f", "#e8edf2", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "clouds");

  const clouds = getCachedRandomSet("clouds", count, (_, i) => {
    // Improvement: time offsets spread evenly over the cycle (base position by
    // index) instead of fully random - otherwise all clouds can bunch up and
    // leave gaps with no visible cloud at all. A bit of random jitter on top so
    // it still does not look "mechanically" even.
    const jitter = Math.random() * 12 - 6;
    return {
      top: (Math.random() * 82).toFixed(2),
      scale: (Math.random() * 0.7 + 0.7).toFixed(2),
      dur: (Math.random() * 40 + 60).toFixed(2),
      delay: (-(i / count) * 85 + jitter).toFixed(2),
      baseOp: (Math.random() * 0.18 + 0.28).toFixed(2),
    };
  });

  const cloudHtml = clouds.map((c) => {
    const op = isHigh ? Math.max(parseFloat(c.baseOp), 0.65) : (parseFloat(c.baseOp) * opacity);
    return `<div class="cloud" style="top:${c.top}vh; transform:scale(${c.scale}); animation-duration:${c.dur}s; animation-delay:${c.delay}s; opacity:${op.toFixed(2)}; background:${color}; box-shadow: 6vw 1vh 0 -1vh ${color}, -5vw 1.5vh 0 -1.5vh ${color}, 3vw -1vh 0 -0.5vh ${color};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("clouds-container")}
    .cloud {
      position: absolute; left: -30vw; width: 22vw; height: 8vh;
      border-radius: 50%;
      filter: blur(4px);
      animation-name: cloud-drift; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    @keyframes cloud-drift {
      0% { transform: translateX(0) scale(var(--s, 1)); }
      100% { transform: translateX(160vw) scale(var(--s, 1)); }
    }
  `;
  return { css, html: `<div class="clouds-container" aria-hidden="true">${cloudHtml}</div>` };
}

function renderWishStar(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#1a1a2e", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const peak = isHigh ? 1 : Math.max(opacity, 0.5);
  const pos = cfg._wishstarPos || { top: 30, left: 50 };

  const css = `
    .wishstar {
      position: fixed; top: ${pos.top.toFixed(2)}vh; left: ${pos.left.toFixed(2)}vw; width: 70px; height: 70px;
      pointer-events: none; z-index: 9999;
      animation: wishstar-flash 3s ease-in-out 1 forwards;
      will-change: opacity, transform;
    }
    .wishstar-halo {
      position: absolute; inset: 0; border-radius: 50%;
      background: radial-gradient(circle, ${color} 0%, ${color}99 30%, transparent 72%);
      filter: blur(5px);
    }
    .wishstar-ray {
      position: absolute; top: 50%; left: 50%; filter: blur(2.5px); opacity: 0.55;
    }
    .wishstar-ray.v { width: 2.5px; height: 100%; background: linear-gradient(${color}, transparent 38%, transparent 62%, ${color}); transform: translate(-50%, -50%); }
    .wishstar-ray.h { width: 100%; height: 2.5px; background: linear-gradient(90deg, ${color}, transparent 38%, transparent 62%, ${color}); transform: translate(-50%, -50%); }
    .wishstar-core {
      position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; margin: -8px;
      border-radius: 50%; background: #ffffff;
      box-shadow: 0 0 14px 5px ${color};
    }
    @keyframes wishstar-flash {
      0% { opacity: 0; transform: scale(0.3); }
      30% { opacity: ${peak}; transform: scale(1.2); }
      55% { opacity: ${peak}; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.3); }
    }
  `;
  const html = `
    <div class="wishstar" aria-hidden="true">
      <div class="wishstar-halo"></div>
      <div class="wishstar-ray v"></div>
      <div class="wishstar-ray h"></div>
      <div class="wishstar-core"></div>
    </div>
  `;
  return { css, html };
}

function renderStars(cfg, hass, hostEl) {
  // Stars "teleport" between 4 random positions and are invisible during the
  // jump (opacity explicitly held at 0 BEFORE and AFTER the jump so the browser
  // does not interpolate the movement). Improvement (resources): the position
  // now uses "transform: translate()" instead of "top"/"left". This matters:
  // top/left animations force the browser to recalculate layout for other
  // elements on EVERY frame, while transform is composited purely on the GPU
  // (no layout reflow). In addition ALL stars now share ONE keyframe
  // (previously every star had its own 25-step keyframe) - the individual
  // positions/brightness come from per-star CSS variables instead. With e.g. 55
  // stars this saves a lot of CSS size and browser work.
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "stars");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const stars = getCachedRandomSet("stars", count, () => ({
    waypoints: Array.from({ length: 4 }, () => ({
      top: (Math.random() * 85).toFixed(2),
      left: (Math.random() * 100).toFixed(2),
    })),
    size: (Math.random() * 2.5 + 2).toFixed(2),
    dur: (Math.random() * 8 + 20).toFixed(2),
    delay: (Math.random() * -28).toFixed(2),
    baseOp: (Math.random() * 0.4 + 0.55).toFixed(2),
  }));

  const starHTML = stars.map((s) => {
    const peak = isHigh
      ? Math.max(parseFloat(s.baseOp), 0.95)
      : Math.max(parseFloat(s.baseOp) * opacity, 0.35);
    const glow = (parseFloat(s.size) * 2.5).toFixed(2);
    const [p1, p2, p3, p4] = s.waypoints;
    // Each position is expressed as a shift (translate) in vw/vh relative to
    // the star's own start position (top/left as a normal ONE-TIME placement -
    // no animation). Since top1/left1 is the base point, the first shift is
    // (0,0).
    const dx2 = (parseFloat(p2.left) - parseFloat(p1.left)).toFixed(2);
    const dy2 = (parseFloat(p2.top) - parseFloat(p1.top)).toFixed(2);
    const dx3 = (parseFloat(p3.left) - parseFloat(p1.left)).toFixed(2);
    const dy3 = (parseFloat(p3.top) - parseFloat(p1.top)).toFixed(2);
    const dx4 = (parseFloat(p4.left) - parseFloat(p1.left)).toFixed(2);
    const dy4 = (parseFloat(p4.top) - parseFloat(p1.top)).toFixed(2);
    const vars = `--peak:${peak}; --dx2:${dx2}vw; --dy2:${dy2}vh; --dx3:${dx3}vw; --dy3:${dy3}vh; --dx4:${dx4}vw; --dy4:${dy4}vh;`;
    return `<div class="star" style="top:${p1.top}vh; left:${p1.left}vw; width:${s.size}px; height:${s.size}px; background:${color}; box-shadow: 0 0 ${glow}px ${color}, 0 0 1.5px rgba(160,160,160,0.9); animation-duration:${s.dur}s; animation-delay:${s.delay}s; ${vars}"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("stars-container")}
    .star {
      position: absolute; border-radius: 50%;
      animation-name: star-teleport-cycle; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: opacity, transform;
    }
    /* One shared keyframe for ALL stars. Flash in gently (4%), hold calmly for a
       long time (14%), fade out gently (3%), then in a tiny 0.4% window - with
       opacity explicitly at 0 before AND after the jump - silently jump to the
       next position (translate). */
    @keyframes star-teleport-cycle {
      0%     { opacity: 0; transform: translate(0,0) scale(0.3); }
      4%     { opacity: var(--peak); transform: translate(0,0) scale(1.1); }
      18%    { opacity: var(--peak); transform: translate(0,0) scale(1); }
      21%    { opacity: 0; transform: translate(0,0) scale(0.3); }
      23.8%  { opacity: 0; transform: translate(0,0) scale(0.3); }
      24.2%  { opacity: 0; transform: translate(var(--dx2),var(--dy2)) scale(0.3); }
      25%    { opacity: 0; transform: translate(var(--dx2),var(--dy2)) scale(0.3); }
      29%    { opacity: var(--peak); transform: translate(var(--dx2),var(--dy2)) scale(1.1); }
      43%    { opacity: var(--peak); transform: translate(var(--dx2),var(--dy2)) scale(1); }
      46%    { opacity: 0; transform: translate(var(--dx2),var(--dy2)) scale(0.3); }
      48.8%  { opacity: 0; transform: translate(var(--dx2),var(--dy2)) scale(0.3); }
      49.2%  { opacity: 0; transform: translate(var(--dx3),var(--dy3)) scale(0.3); }
      50%    { opacity: 0; transform: translate(var(--dx3),var(--dy3)) scale(0.3); }
      54%    { opacity: var(--peak); transform: translate(var(--dx3),var(--dy3)) scale(1.1); }
      68%    { opacity: var(--peak); transform: translate(var(--dx3),var(--dy3)) scale(1); }
      71%    { opacity: 0; transform: translate(var(--dx3),var(--dy3)) scale(0.3); }
      73.8%  { opacity: 0; transform: translate(var(--dx3),var(--dy3)) scale(0.3); }
      74.2%  { opacity: 0; transform: translate(var(--dx4),var(--dy4)) scale(0.3); }
      75%    { opacity: 0; transform: translate(var(--dx4),var(--dy4)) scale(0.3); }
      79%    { opacity: var(--peak); transform: translate(var(--dx4),var(--dy4)) scale(1.1); }
      93%    { opacity: var(--peak); transform: translate(var(--dx4),var(--dy4)) scale(1); }
      96%    { opacity: 0; transform: translate(var(--dx4),var(--dy4)) scale(0.3); }
      98.8%  { opacity: 0; transform: translate(var(--dx4),var(--dy4)) scale(0.3); }
      99.2%  { opacity: 0; transform: translate(0,0) scale(0.3); }
      100%   { opacity: 0; transform: translate(0,0) scale(0.3); }
    }
  `;
  return { css, html: `<div class="stars-container" aria-hidden="true">${starHTML}</div>` };
}

function renderBirthday(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const balloonCount = getParticleCount(cfg.count_preset || "medium", "balloons");
  const balloons = spreadSample(BALLOONS, balloonCount);
  const balloonHTML = balloons.map((b) => `
    <div class="bday-balloon-wrapper" style="left:${b.l}vw; animation-duration:${b.dur}s; animation-delay:${b.d}s; opacity:${opacity};">
      <div class="bday-balloon" style="width:${b.size}px; height:${(b.size * 1.6)}px; color:${b.color};">
        ${BALLOON_SVG}
      </div>
    </div>
  `).join("\n");

  const confettiColors = ["#ff4b4b", "#ffb703", "#8ecae6", "#06d6a0", "#f72585", "#ffd60a"];
  const confettiCount = getParticleCount(cfg.count_preset || "medium", "confetti");
  const confetti = getCachedRandomSet("birthday-confetti", confettiCount, () => ({
    l: (Math.random() * 100).toFixed(2),
    size: (Math.random() * 6 + 5).toFixed(1),
    dur: (Math.random() * 3 + 3).toFixed(2),
    delay: (Math.random() * -6).toFixed(2),
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    baseOp: (Math.random() * 0.3 + 0.6).toFixed(2),
  }));
  const confettiHtml = confetti.map((c) => {
    const op = isHigh ? Math.max(parseFloat(c.baseOp), 0.9) : (parseFloat(c.baseOp) * opacity);
    return `<div class="confetti-piece" style="left:${c.l}vw; width:${c.size}px; height:${(c.size * 0.6).toFixed(1)}px; background:${c.color}; animation-duration:${c.dur}s; animation-delay:${c.delay}s; opacity:${op.toFixed(2)};"></div>`;
  }).join("\n");

  const text = (cfg.birthday_text && cfg.birthday_text.trim()) || "Happy Birthday!";
  const safeText = escapeHtml(text);
  const flagColors = ["#ff4b4b", "#ffb703", "#8ecae6", "#06d6a0", "#f72585"];
  let flagsHtml = "";
  const flagCount = 16;
  for (let i = 0; i < flagCount; i++) {
    const left = (i / (flagCount - 1)) * 100;
    const color = flagColors[i % flagColors.length];
    flagsHtml += `<div class="banner-flag" style="left:${left}%; background:${color};"></div>`;
  }

  const css = `
    .bday-balloons-container, .confetti-container {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .bday-balloon-wrapper { position:absolute; bottom:-20%; animation:bday-balloon-rise linear infinite; will-change: transform; }
    .bday-balloon { display:flex; align-items:center; justify-content:center; }
    .bday-balloon svg { width:100%; height:100%; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.25)); }
    @keyframes bday-balloon-rise { 0% { transform: translateY(10vh); } 100% { transform: translateY(-120vh); } }

    .confetti-piece {
      position: absolute; top: -5%;
      animation-name: confetti-fall; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    @keyframes confetti-fall {
      0%   { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(115vh) rotate(540deg); }
    }

    .birthday-banner {
      position: fixed; top: 0; left: 0; width: 100vw; height: 60px;
      pointer-events: none; z-index: 9999;
    }
    .banner-string {
      position: absolute; top: 8px; left: 0; width: 100%; height: 1px;
      background: rgba(255,255,255,0.4);
    }
    .banner-flag {
      position: absolute; top: 8px; width: 16px; height: 20px;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      animation: banner-flag-sway 2.4s ease-in-out infinite;
      transform-origin: top center;
    }
    @keyframes banner-flag-sway {
      0%, 100% { transform: rotate(-4deg); }
      50% { transform: rotate(4deg); }
    }
    .banner-text {
      position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
      font-size: 28px; font-weight: 800; color: #ffffff;
      text-shadow: 0 0 8px rgba(0,0,0,0.5), 2px 2px 0 #ff4b4b, -2px -2px 0 #06d6a0;
      font-family: system-ui, -apple-system, sans-serif;
      white-space: nowrap;
      animation: banner-bounce 2s ease-in-out infinite;
    }
    @keyframes banner-bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-4px); }
    }
  `;
  // Which parts are shown is ticked in the editor. Without a value everything
  // is on (as before), so existing configurations look unchanged.
  const showBalloons = cfg.birthday_balloons !== false;
  const showConfetti = cfg.birthday_confetti !== false;
  const showBanner = cfg.birthday_banner !== false;
  const showLights = cfg.birthday_lights !== false;

  const lightsPart = showLights ? renderLights(cfg, hass, hostEl) : null;

  const html = `
    ${showBalloons ? `<div class="bday-balloons-container" aria-hidden="true">${balloonHTML}</div>` : ""}
    ${showConfetti ? `<div class="confetti-container" aria-hidden="true">${confettiHtml}</div>` : ""}
    ${showBanner ? `
    <div class="birthday-banner" aria-hidden="true">
      <div class="banner-string"></div>
      ${flagsHtml}
      <div class="banner-text">${safeText}</div>
    </div>` : ""}
    ${lightsPart ? lightsPart.html : ""}
  `;
  return { css: css + (lightsPart ? "\n" + lightsPart.css : ""), html };
}

// Combined effect "night sky": bundles shooting stars, wishing star and comet.
// Which parts run is ticked in the editor. The starry sky itself is
// deliberately NOT included - it still comes automatically from the weather
// automation on clear nights.
function renderNightSky(cfg, hass, hostEl) {
  const parts = [];
  if (cfg.night_shooting_stars !== false) parts.push(renderShootingStars(cfg, hass, hostEl));
  if (cfg.night_wishstar !== false) parts.push(renderWishStar(cfg, hass, hostEl));
  if (cfg.night_comet !== false) parts.push(renderComet(cfg, hass, hostEl));
  return {
    css: parts.map((p) => p.css).join("\n"),
    html: parts.map((p) => p.html).join("\n"),
  };
}

// Combined effect "owl & birdhouse": both share the same spot in the top left
// and take turns based on the sun - the birdhouse during the day, the owl at
// night. Without a sun.sun entity the birdhouse is shown.
function renderOwlBirdhouse(cfg, hass, hostEl) {
  const sunState = hass?.states?.["sun.sun"]?.state;
  const isNight = sunState === "below_horizon";
  return isNight ? renderOwl(cfg, hass, hostEl) : renderBirdhouse(cfg, hass, hostEl);
}

const RENDERERS = {
  rain: renderRain,
  snow: renderSnow,
  leaves: renderLeaves,
  lightning: renderLightning,
  fog: renderFog,
  hail: renderHail,
  storm: renderStorm,
  clouds: renderClouds,
  stars: renderStars,
  moon: renderMoon,
  sun: renderSun,
  night_sky: renderNightSky,
  owl_birdhouse: renderOwlBirdhouse,
  santa: renderSanta,
  spider: renderSpider,
  dog: renderDog,
  train: renderTrain,
  bats: renderBats,
  bee: renderBee,
  birthday: renderBirthday,
};

/* ============================== MAIN CARD ============================== */

class AmbientOverlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onThemeChange = this._onThemeChange.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._snowLevel = 0;
    this._snowTimer = null;
    this._portalHost = null;
    this._portalShadow = null;
    this._visibilityPollTimer = null;
    this._periodicStartTimes = {};
    this._wishstarTimer = null;
    this._wishstarPos = null;
    this._starsReshuffleTimer = null;
    // Improvement: instead of removing an effect from the DOM immediately when
    // it ends, this map remembers which effects are "active" and which are
    // "fading out" (with the time the fade started). That way every effect can
    // fade smoothly instead of disappearing abruptly - see
    // _updateEffectLayers() further down.
    this._effectLayers = new Map();
    this._fadeRemovalTimers = new Map();
  }

  _ensurePortal() {
    if (this._portalHost) return;
    this._portalHost = document.createElement("div");
    // Improvement (bugfix): "position: fixed" alone is not always enough - some
    // custom cards (e.g. swipe/carousel cards with fade transitions) use a high
    // z-index for their own transition animations and can end up above our
    // effects. An extremely high z-index that is practically never exceeded
    // makes sure our effect container is ALWAYS on top, whatever else is on the
    // page.
    // Improvement: when the steam train runs as its OWN card at the same time
    // as another effect that also sits at the bottom edge, the two should not
    // randomly cover each other depending on which card loaded first - so the
    // train gets a slightly higher value and ALWAYS drives visibly in front.
    this._portalHost.style.cssText = `position:fixed; top:0; left:0; width:0; height:0; pointer-events:none;`;
    this._applyPortalZIndex();
    this._portalShadow = this._portalHost.attachShadow({ mode: "open" });
    document.body.appendChild(this._portalHost);
  }

  // Must be set on EVERY render, not only when created: if an existing card is
  // later switched to the steam train in the editor (or the other way round),
  // the value would otherwise stay as it was and the train would suddenly be
  // behind another effect.
  _applyPortalZIndex() {
    if (!this._portalHost) return;
    this._portalHost.style.zIndex = this._config?.event === "train" ? "2147483647" : "2147483646";
  }

  _syncPortalVisibility() {
    if (!this._portalHost) return;

    const checkIsVisible = () => {
      if (!this.isConnected) return false;

      // Traverse the root DOM and across all shadow DOM boundaries
      let node = this;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const style = window.getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
            return false;
          }
        }
        if (node.parentElement) {
          node = node.parentElement;
        } else if (node.parentNode && node.parentNode.host) {
          node = node.parentNode.host;
        } else {
          node = null;
        }
      }

      // Check whether the card has a real position in the layout
      const rect = this.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && this.offsetParent === null) {
        // In case HA hides the card as a container
        const parent = this.parentElement || (this.getRootNode() && this.getRootNode().host);
        if (parent) {
          const pStyle = window.getComputedStyle(parent);
          if (pStyle.display === "none" || pStyle.visibility === "hidden") return false;
        }
      }

      return true;
    };

    const isVisible = checkIsVisible() && !document.hidden;
    this._portalHost.style.display = isVisible ? "" : "none";
  }

  connectedCallback() {
    window.addEventListener("set-theme", this._onThemeChange);
    window.addEventListener("resize", this._onThemeChange);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this._onThemeChange);
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    this._ensurePortal();
    this._syncPortalVisibility();
    this._visibilityPollTimer = setInterval(() => this._syncPortalVisibility(), 700);
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("set-theme", this._onThemeChange);
    window.removeEventListener("resize", this._onThemeChange);
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", this._onThemeChange);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    if (this._snowTimer) {
      clearInterval(this._snowTimer);
      this._snowTimer = null;
    }
    if (this._wishstarTimer) {
      clearInterval(this._wishstarTimer);
      this._wishstarTimer = null;
    }
    if (this._starsReshuffleTimer) {
      clearInterval(this._starsReshuffleTimer);
      this._starsReshuffleTimer = null;
    }
    for (const timer of this._fadeRemovalTimers.values()) {
      clearTimeout(timer);
    }
    this._fadeRemovalTimers.clear();
    if (this._visibilityPollTimer) {
      clearInterval(this._visibilityPollTimer);
      this._visibilityPollTimer = null;
    }
    if (this._portalHost && this._portalHost.parentNode) {
      this._portalHost.parentNode.removeChild(this._portalHost);
    }
    this._portalHost = null;
    this._portalShadow = null;
  }

  _onThemeChange() {
    this._render();
  }

  _onVisibilityChange() {
    const root = this._portalShadow;
    if (!root) return;
    const hidden = document.hidden;
    let pauseStyle = root.getElementById("pause-style");
    if (!pauseStyle) {
      pauseStyle = document.createElement("style");
      pauseStyle.id = "pause-style";
      root.appendChild(pauseStyle);
    }
    pauseStyle.textContent = hidden ? "* { animation-play-state: paused !important; }" : "";
  }

  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "auto",
      color_mode: "auto",
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      weather_entity: "",
      birthday_text: "Happy Birthday!",
      birthday_balloons: true,
      birthday_confetti: true,
      birthday_banner: true,
      birthday_lights: true,
      night_shooting_stars: true,
      night_wishstar: true,
      night_comet: true,
      santa_sensor: "",
      dinner_sensor: "",
      person_entities: "",
      custom_wagon_text: "",
      custom_wagon_entity: "",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const weatherEntity = this._config?.weather_entity;
    const oldWeatherState = weatherEntity ? this._hass?.states?.[weatherEntity]?.state : undefined;

    // Also watch santa_sensor/dinner_sensor for changes - otherwise the card
    // would never re-render when ONLY one of these changes (e.g. the dinner
    // switch on/off) without the weather state changing at the same time.
    const santaEntity = this._config?.santa_sensor;
    const oldSantaState = santaEntity ? this._hass?.states?.[santaEntity]?.state : undefined;
    const dinnerEntity = this._config?.dinner_sensor;
    const oldDinnerState = dinnerEntity ? this._hass?.states?.[dinnerEntity]?.state : undefined;
    // Also watch sun.sun - otherwise the moon (or the sun) would not appear
    // right at sunset/sunrise, but only at the next re-render for some
    // unrelated reason (e.g. the next weather update) - you would have to
    // reload the page manually for it to show up in time.
    const oldSunState = this._hass?.states?.["sun.sun"]?.state;

    // Also watch ALL configured person_entities for changes - otherwise the
    // train would not notice when someone comes home or leaves, unless
    // weather/sensors happened to change at the same time.
    const personEntitiesForWatch = typeof this._config?.person_entities === "string"
      ? this._config.person_entities.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const oldPersonStates = personEntitiesForWatch.map((eid) => this._hass?.states?.[eid]?.state);

    // Watch the guest sensor as well - otherwise newly entered names would only
    // show up at the next re-render for some other reason.
    const guestEntity = this._config?.custom_wagon_entity;
    const oldGuestState = guestEntity ? this._hass?.states?.[guestEntity]?.state : undefined;

    this._hass = hass;
    const newWeatherState = weatherEntity ? hass?.states?.[weatherEntity]?.state : undefined;
    const newSantaState = santaEntity ? hass?.states?.[santaEntity]?.state : undefined;
    const newDinnerState = dinnerEntity ? hass?.states?.[dinnerEntity]?.state : undefined;
    const newSunState = hass?.states?.["sun.sun"]?.state;
    const newGuestState = guestEntity ? hass?.states?.[guestEntity]?.state : undefined;
    const newPersonStates = personEntitiesForWatch.map((eid) => hass?.states?.[eid]?.state);
    const personsChanged = oldPersonStates.some((s, i) => s !== newPersonStates[i]);

    const weatherChanged = oldWeatherState !== newWeatherState;
    const sensorChanged = oldSantaState !== newSantaState || oldDinnerState !== newDinnerState || oldSunState !== newSunState || oldGuestState !== newGuestState || personsChanged;

    // Smooth fade-out only on a REAL automatic weather change (not on the very
    // first render - there is nothing to fade from yet).
    const isRealWeatherChange = this._hasRenderedOnce && weatherChanged;

    if (!this._hasRenderedOnce || weatherChanged || sensorChanged) {
      this._render(isRealWeatherChange);
      this._hasRenderedOnce = true;
    }
    this._syncPortalVisibility();
  }

  _resolveEvents() {
    const cfg = this._config || {};
    if (cfg.event === "weather_auto") {
      let events;
      if (cfg.weather_entity && this._hass) {
        const entityState = this._hass.states?.[cfg.weather_entity];
        events = entityState ? mapWeatherStateToEvents(entityState.state) : ["off"];
      } else {
        events = ["off"];
      }
      // Also show the moon as soon as the sun has set - independent of the
      // actual weather state (so also on a cloudy night, not only on
      // "clear-night"). Uses the built-in sun.sun entity present in every Home
      // Assistant installation, no extra sensor or configuration needed.
      const sunState = this._hass?.states?.["sun.sun"]?.state;
      if (sunState === "below_horizon") {
        // The sun must not stay up at night: some weather integrations report
        // the DAYTIME condition and stay on "sunny" even after sunset. Without
        // this line sun and moon would sit exactly on top of each other (both
        // are in the top right) and create a strange mixed image.
        events = events.filter((e) => e !== "off" && e !== "sun");
        if (!events.includes("moon")) events.push("moon");
      }
      return events.length > 0 ? events : ["off"];
    }
    return [cfg.event || "off"];
  }

  getCardSize() { return 0; }

  static getStubConfig() {
    // Must be an effect that can be SELECTED in the dropdown (see
    // EVENT_CAPABILITIES), otherwise a newly added card would show no selection
    // and no controls. "night_sky" runs immediately without any further
    // settings.
    return { event: "night_sky", count_preset: "medium", opacity_preset: "medium", color: "auto" };
  }

  static getConfigElement() {
    return document.createElement("ambient-overlay-card-editor");
  }

  _updateSnowAccumulation(events) {
    const snowActive = events.includes("snow");
    if (snowActive) {
      if (!this._snowTimer) {
        this._snowTimer = setInterval(() => {
          this._snowLevel = Math.min(100, this._snowLevel + 1);
          this._render();
        }, 15000);
      }
    } else {
      if (this._snowTimer) {
        clearInterval(this._snowTimer);
        this._snowTimer = null;
      }
      this._snowLevel = 0;
    }
  }

  _updateWishstar(events) {
    // The wishing star is now part of the combined "night sky" effect and only
    // runs when it is ticked there.
    const wishstarActive = events.includes("night_sky") && this._config?.night_wishstar !== false;
    if (wishstarActive) {
      if (!this._wishstarTimer) {
        const cycle = { low: 12000, medium: 8000, high: 5000 }[this._config?.opacity_preset || "medium"] || 8000;
        const regen = () => {
          this._wishstarPos = {
            top: Math.random() * 60 + 8,
            left: Math.random() * 80 + 10,
          };
          this._render();
        };
        this._wishstarTimer = setInterval(regen, cycle);
        regen();
      }
    } else {
      if (this._wishstarTimer) {
        clearInterval(this._wishstarTimer);
        this._wishstarTimer = null;
      }
      this._wishstarPos = null;
    }
  }

  // Improvement (resources): instead of checking every second which star is
  // "due", this timer reshuffles the positions of all stars AT ONCE every 4
  // minutes (cache clear + re-render). Between reshuffles everything runs
  // purely in CSS without any JavaScript - that saves 239 of 240 seconds of
  // timer work compared with a per-second check.
  _updateStarsReshuffle(events) {
    if (events.includes("stars")) {
      if (!this._starsReshuffleTimer) {
        this._starsReshuffleTimer = setInterval(() => {
          const count = getParticleCount(this._config?.count_preset || "medium", "stars");
          _randomCache.delete(`stars:${count}`);
          this._render();
        }, 240000);
      }
    } else {
      if (this._starsReshuffleTimer) {
        clearInterval(this._starsReshuffleTimer);
        this._starsReshuffleTimer = null;
      }
    }
  }

  // Improvement: makes sure an effect does not disappear immediately when it
  // ends, but is first marked as "fading out" and only removed for good after
  // the fade duration (FADE_DURATION_MS). If an effect is re-activated while
  // fading out (e.g. rapidly changing weather), it jumps straight back to fully
  // visible.
  _updateEffectLayers(events, allowFade) {
    for (const ev of events) {
      const existing = this._effectLayers.get(ev);
      if (!existing || existing.fadeStartedAt !== null) {
        this._effectLayers.set(ev, { fadeStartedAt: null });
      }
    }
    for (const [key, state] of this._effectLayers.entries()) {
      if (!events.includes(key) && state.fadeStartedAt === null) {
        if (!allowFade) {
          // Manual change (editor dropdown) or internal timer - remove
          // immediately, no fade-out. Smooth fading only happens when the
          // weather changes by itself (see set hass() above) - in that case you
          // are not necessarily looking at the screen.
          this._effectLayers.delete(key);
          if (this._fadeRemovalTimers.has(key)) {
            clearTimeout(this._fadeRemovalTimers.get(key));
            this._fadeRemovalTimers.delete(key);
          }
          continue;
        }
        state.fadeStartedAt = Date.now();
        if (this._fadeRemovalTimers.has(key)) {
          clearTimeout(this._fadeRemovalTimers.get(key));
        }
        const timer = setTimeout(() => {
          const cur = this._effectLayers.get(key);
          if (cur && cur.fadeStartedAt !== null) {
            this._effectLayers.delete(key);
            this._fadeRemovalTimers.delete(key);
            this._render();
          }
        }, FADE_DURATION_MS + 150);
        this._fadeRemovalTimers.set(key, timer);
      }
    }
  }

  _render(allowFade = false) {
    if (!this._config) return;
    if (!this._portalShadow) return;
    this._applyPortalZIndex();

    const events = this._resolveEvents();
    this._updateSnowAccumulation(events);

    this._updateWishstar(events);

    this._updateStarsReshuffle(events);
    this._updateEffectLayers(events, allowFade);

    // Improvement: only clear the start times of periodic effects (dog, Santa,
    // comet) once the effect is REALLY completely gone (including the fade
    // layers) - otherwise the position/start time would suddenly reset during
    // the smooth fade-out and the effect would visibly "jump" while fading.
    for (const key of Object.keys(this._periodicStartTimes)) {
      if (!this._effectLayers.has(key)) delete this._periodicStartTimes[key];
    }

    let combinedCss = `
      @keyframes fx-fade-out { from { opacity: 1; } to { opacity: 0; } }
    `;
    let combinedHtml = "";
    for (const [event, state] of this._effectLayers.entries()) {
      const renderer = RENDERERS[event];
      if (!renderer) continue;
      let cfgForRender = this._config;
      if (event === "snow") {
        cfgForRender = { ...this._config, _snowLevel: this._snowLevel };
      } else if (event === "night_sky") {
        // The wishing star is part of the combined "night sky" effect - so the
        // random position must be passed through under THAT name, otherwise the
        // star always lands on the default value.
        cfgForRender = { ...this._config, _wishstarPos: this._wishstarPos };
      } else if (event === "dog") {
        if (!this._periodicStartTimes[event]) {
          const ranges = {
            dog: [10, 80],
          };
          const [min, max] = ranges[event] || [10, 80];
          this._periodicStartTimes[event] = {
            startHeight: Math.random() * (max - min) + min,
            drift: Math.random() * 16 - 8,
          };
        }
        const pState = this._periodicStartTimes[event];
        cfgForRender = {
          ...this._config,
          _startHeight: pState.startHeight,
          _drift: pState.drift,
        };
      }
      const { css, html } = renderer(cfgForRender, this._hass, this);
      combinedCss += css;
      // Fading layers get a "resume mid-animation" delay like santa/dog/comet:
      // a negative animation-delay from the fade time already elapsed, so a
      // re-render during the fade (e.g. caused by other running timers) does
      // not restart the fade from the beginning.
      const layerStyle = state.fadeStartedAt !== null
        ? `animation: fx-fade-out ${(FADE_DURATION_MS / 1000).toFixed(2)}s linear forwards; animation-delay: -${((Date.now() - state.fadeStartedAt) / 1000).toFixed(2)}s;`
        : "opacity: 1;";
      combinedHtml += `<div style="${layerStyle}">${html}</div>`;
    }

    this._portalShadow.innerHTML = `<style>${combinedCss}</style>${combinedHtml}`;
    this._onVisibilityChange();
  }
}

/* ============================== VISUAL EDITOR ============================== */

class AmbientOverlayCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "auto",
      color_mode: "auto",
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      weather_entity: "",
      birthday_text: "Happy Birthday!",
      birthday_balloons: true,
      birthday_confetti: true,
      birthday_banner: true,
      birthday_lights: true,
      night_shooting_stars: true,
      night_wishstar: true,
      night_comet: true,
      santa_sensor: "",
      dinner_sensor: "",
      person_entities: "",
      custom_wagon_text: "",
      custom_wagon_entity: "",
      ...config,
    };
    if (this._suppressNextRender) {
      this._suppressNextRender = false;
      return;
    }
    this._render();
  }

  set hass(hass) {
    const oldKey = this._weatherEntityListKey || "";
    const newEntities = hass && hass.states
      ? Object.keys(hass.states).filter((eid) => eid.startsWith("weather."))
      : [];
    const newKey = newEntities.sort().join(",");
    this._hass = hass;

    if (newKey !== oldKey) {
      this._weatherEntityListKey = newKey;
      this._render();
    }
  }
  connectedCallback() { this._render(); }

  _row(labelText, inputHTML, hint) {
    const hintHtml = hint
      ? `<div style="font-size:11px; opacity:0.65; margin-top:3px; line-height:1.4;">${hint}</div>`
      : "";
    return `<div style="padding:8px 0;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <label style="flex:1; color:var(--primary-text-color, #222);">${labelText}</label>
        <div style="flex:1;">${inputHTML}</div>
      </div>
      ${hintHtml}
    </div>`;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const colorMode = c.color_mode || (c.color === "auto" ? "auto" : "custom");
    const caps = EVENT_CAPABILITIES[c.event] || { count: false, opacity: false, color: false };
    const isWeatherAuto = c.event === "weather_auto";
    const isBirthday = c.event === "birthday";
    const isNightSky = c.event === "night_sky";
    const isTrain = c.event === "train";
    const isDog = c.event === "dog";

    const weatherEntities = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) => eid.startsWith("weather."))
      : [];

    const booleanEntities = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) => eid.startsWith("input_boolean.") || eid.startsWith("binary_sensor."))
      : [];

    const personEntitiesAvailable = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) => eid.startsWith("person."))
      : [];

    const textEntities = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) =>
          eid.startsWith("input_text.") || eid.startsWith("input_select.") || eid.startsWith("sensor.")
        ).sort()
      : [];

    this.innerHTML = `
      <div style="padding:8px 16px;">
        <div id="live-preview" style="position:relative; width:100%; height:150px; overflow:hidden; border-radius:10px; margin-bottom:10px; background:linear-gradient(180deg, #16202e, #2c3e50); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);">
          <div id="live-preview-stage" style="position:absolute; top:0; left:0; width:100vw; height:100vh; transform: scale(0.16); transform-origin: top left;"></div>
          <div id="live-preview-msg" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.55); font-size:12px; text-align:center; padding:0 16px;"></div>
        </div>
        ${this._row("Effect", `
          <select id="event" style="width:100%; padding:6px;">
            <option value="off" ${c.event === "off" ? "selected" : ""}>Off</option>
            <option value="weather_auto" ${isWeatherAuto ? "selected" : ""}>🌦️ Automatic (follows weather)</option>
            <option value="night_sky" ${c.event === "night_sky" ? "selected" : ""}>🌠 Night sky</option>
            <option value="owl_birdhouse" ${c.event === "owl_birdhouse" ? "selected" : ""}>🦉🐦 Owl &amp; birdhouse</option>
            <option value="birthday" ${isBirthday ? "selected" : ""}>🎂 Birthday mode</option>
            <option value="leaves" ${c.event === "leaves" ? "selected" : ""}>🍂 Autumn leaves</option>
            <option value="santa" ${c.event === "santa" ? "selected" : ""}>🎅 Santa Claus</option>
            <option value="train" ${c.event === "train" ? "selected" : ""}>🚂 Steam train</option>
            <option value="dog" ${c.event === "dog" ? "selected" : ""}>🐕 Golden Labrador</option>
            <option value="spider" ${c.event === "spider" ? "selected" : ""}>🕷️ Spider with web</option>
            <option value="bats" ${c.event === "bats" ? "selected" : ""}>🦇 Bats</option>
            <option value="bee" ${c.event === "bee" ? "selected" : ""}>🐝 Bees</option>
          </select>
        `, isWeatherAuto
          ? "With 'Automatic', the state of your weather entity below decides which effect runs."
          : "Which effect is shown permanently."
        )}

        ${isBirthday ? this._row("What should be shown?", `
          <div style="border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px;">
            ${[["birthday_balloons","Balloons"],["birthday_confetti","Confetti"],["birthday_banner","Sign / bunting"],["birthday_lights","Fairy lights"]].map(([key,label]) =>
              `<label style="display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer;"><input type="checkbox" class="part-toggle" data-key="${key}" ${c[key] !== false ? "checked" : ""} /> ${label}</label>`
            ).join("")}
          </div>
        `, "Each part can be switched on or off. Tick at least one, otherwise the screen stays empty.") : ""}

        ${isNightSky ? this._row("What should be shown?", `
          <div style="border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px;">
            ${[["night_shooting_stars","Shooting stars"],["night_wishstar","Twinkling wishing star"],["night_comet","Comet"]].map(([key,label]) =>
              `<label style="display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer;"><input type="checkbox" class="part-toggle" data-key="${key}" ${c[key] !== false ? "checked" : ""} /> ${label}</label>`
            ).join("")}
          </div>
        `, "Each part can be switched on or off. The starry sky itself still runs automatically on clear nights via the weather automation.") : ""}

        ${isBirthday ? this._row("Banner text", `
          <input id="birthday_text" type="text" value="${c.birthday_text ? c.birthday_text.replace(/"/g, "&quot;") : ""}" placeholder="Happy Birthday!" style="width:100%; padding:6px; box-sizing:border-box;" />
        `, "Text on the banner at the top - e.g. 'Happy Birthday, Max!' for a personal touch.") : ""}

        ${isTrain ? (
          booleanEntities.length > 0
            ? this._row("Christmas sensor (optional)", `
                <select id="santa_sensor" style="width:100%; padding:6px;">
                  <option value="" ${!c.santa_sensor ? "selected" : ""}>-- none (always firewood) --</option>
                  ${booleanEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.santa_sensor === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "Optional: when this switch/sensor is 'on', three wagons get a festive load - a snowman, Santa and a red sack of presents instead of fruit, toy blocks and firewood.")
            : this._row("Christmas sensor (optional)", `<input id="santa_sensor" type="text" placeholder="input_boolean.christmas_season" value="${c.santa_sensor || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "Optional: when this switch/sensor is 'on', three wagons get a festive load - a snowman, Santa and a red sack of presents instead of fruit, toy blocks and firewood.")
        ) : ""}

        ${isTrain ? (
          booleanEntities.length > 0
            ? this._row("Dinner sensor (optional)", `
                <select id="dinner_sensor" style="width:100%; padding:6px;">
                  <option value="" ${!c.dinner_sensor ? "selected" : ""}>-- none (normal load) --</option>
                  ${booleanEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.dinner_sensor === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "Optional: when this switch/sensor is 'on', three wagons carry dishes, a roast and drinks instead of fruit, toy blocks and firewood. Christmas takes precedence if both sensors are on at the same time.")
            : this._row("Dinner sensor (optional)", `<input id="dinner_sensor" type="text" placeholder="input_boolean.dinner_switch" value="${c.dinner_sensor || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "Optional: when this switch/sensor is 'on', three wagons carry dishes, a roast and drinks instead of fruit, toy blocks and firewood.")
        ) : ""}

        ${isTrain ? this._row(
          "Person wagons (optional)",
          personEntitiesAvailable.length > 0
            ? `
              <div id="person_entities_group" style="border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px; max-height:140px; overflow-y:auto;">
                ${personEntitiesAvailable.map((eid) => {
                  const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                  const selected = (c.person_entities || "").split(",").map((s) => s.trim()).includes(eid);
                  return `<label style="display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer;"><input type="checkbox" class="person-entity-checkbox" value="${eid}" ${selected ? "checked" : ""} /> ${friendly}</label>`;
                }).join("")}
              </div>
            `
            : `<input id="person_entities" type="text" placeholder="person.marco, person.sandra" value="${(c.person_entities || "").replace(/"/g, "&quot;")}" style="width:100%; padding:6px; box-sizing:border-box;" />`,
          "Optional: for every ticked person who is currently at home, a wagon with their profile picture (if available) or initial is attached at the back."
        ) : ""}

        ${isTrain ? (
          textEntities.length > 0
            ? this._row("Guest wagons from sensor (optional)", `
                <select id="custom_wagon_entity" style="width:100%; padding:6px;">
                  <option value="" ${!c.custom_wagon_entity ? "selected" : ""}>-- none --</option>
                  ${textEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.custom_wagon_entity === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "Optional: a sensor (e.g. input_text) containing comma-separated names (\"Marcel, Rudolf\"). A wagon is attached at the back for each name. Takes precedence over the fixed free text below.")
            : this._row("Guest wagons from sensor (optional)", `<input id="custom_wagon_entity" type="text" placeholder="input_text.guests" value="${c.custom_wagon_entity || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "Optional: a sensor with comma-separated names - one wagon per name.")
        ) : ""}

        ${isTrain ? this._row(
          "Free-text wagon (optional)",
          `<input id="custom_wagon_text" type="text" placeholder="e.g. Grandma" value="${(c.custom_wagon_text || "").replace(/"/g, "&quot;")}" style="width:100%; padding:6px; box-sizing:border-box;" maxlength="60" />`,
          "Optional: fixed text if no sensor is selected above. Separate several names with commas to get several wagons. Attached at the very back."
        ) : ""}

        ${isWeatherAuto ? (
          weatherEntities.length > 0
            ? this._row("Weather sensor", `
                <select id="weather_entity" style="width:100%; padding:6px;">
                  <option value="" ${!c.weather_entity ? "selected" : ""}>-- please select --</option>
                  ${weatherEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.weather_entity === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "This weather entity provides the current condition (raining, snowing, ...) that the effect above follows.")
            : this._row("Weather sensor", `<input id="weather_entity" type="text" placeholder="weather.home" value="${c.weather_entity || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "No weather entity found in HA - enter the entity ID here manually, e.g. weather.home.")
        ) : ""}

        ${isDog ? (
          weatherEntities.length > 0
            ? this._row("Weather sensor (optional)", `
                <select id="weather_entity" style="width:100%; padding:6px;">
                  <option value="" ${!c.weather_entity ? "selected" : ""}>-- none (no shaking) --</option>
                  ${weatherEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.weather_entity === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "Optional: if you select your real weather entity here, the dog shakes itself briefly whenever it reports rain.")
            : this._row("Weather sensor (optional)", `<input id="weather_entity" type="text" placeholder="weather.home" value="${c.weather_entity || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "Optional: if you enter your real weather entity here, the dog shakes itself briefly whenever it reports rain.")
        ) : ""}

        ${caps.count ? this._row("Amount / frequency", `
          <select id="count_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.count_preset === "low" ? "selected" : ""}>🔹 Low / rare</option>
            <option value="medium" ${c.count_preset === "medium" ? "selected" : ""}>🔷 Medium</option>
            <option value="high" ${c.count_preset === "high" ? "selected" : ""}>🔷 High / frequent</option>
          </select>
        `, isWeatherAuto
          ? "⚠️ One value shared by ALL automatically detected effects (rain, snow, hail, lightning, fog, storm) - cannot be set per effect."
          : (COUNT_IS_INTERVAL_TEXT[c.event] || "How many particles are visible at the same time.")
        ) : ""}

        ${caps.opacity ? this._row("Opacity / brightness", `
          <select id="opacity_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.opacity_preset === "low" ? "selected" : ""}>👻 Subtle (30%)</option>
            <option value="medium" ${c.opacity_preset === "medium" ? "selected" : ""}>👁️ Moderate (60%)</option>
            <option value="high" ${c.opacity_preset === "high" ? "selected" : ""}>✨ Strong (100%)</option>
          </select>
        `, isWeatherAuto
          ? "Also ONE value shared by ALL automatically detected effects."
          : "How strongly/clearly the effect is visible."
        ) : ""}

        ${caps.color ? this._row("Colour mode", `
          <select id="color_mode" style="width:100%; padding:6px;">
            <option value="auto" ${colorMode === "auto" ? "selected" : ""}>🌗 Auto (match theme)</option>
            <option value="custom" ${colorMode === "custom" ? "selected" : ""}>🎨 Custom colour</option>
          </select>
        `, isWeatherAuto
          ? "Only applies while rain, snow, hail, fog or storm is active (not lightning - it always has white light)."
          : "Pick the colour automatically from light/dark mode or set it yourself."
        ) : ""}

        ${caps.color && colorMode === "custom" ? `
        <div id="custom_color_picker">
          ${this._row("Colour", `<input id="color" type="color" value="${c.color === "auto" ? "#ffffff" : c.color}" style="width:100%; height:36px;" />`)}
        </div>` : ""}
      </div>
    `;

    this.querySelector("#event").addEventListener("change", (e) => this._update("event", e.target.value, true));

    // Checkboxes for the combined effects (birthday, night sky)
    this.querySelectorAll(".part-toggle").forEach((box) => {
      box.addEventListener("change", (e) => {
        this._update(e.target.dataset.key, e.target.checked, false);
      });
    });

    const birthdayTextInput = this.querySelector("#birthday_text");
    if (birthdayTextInput) {
      birthdayTextInput.addEventListener("input", (e) => this._update("birthday_text", e.target.value, false));
      birthdayTextInput.addEventListener("change", (e) => this._update("birthday_text", e.target.value, false));
    }

    const weatherEntitySel = this.querySelector("#weather_entity");
    if (weatherEntitySel) {
      weatherEntitySel.addEventListener("change", (e) => this._update("weather_entity", e.target.value.trim(), false));
    }

    const santaSensorSel = this.querySelector("#santa_sensor");
    if (santaSensorSel) {
      santaSensorSel.addEventListener("change", (e) => this._update("santa_sensor", e.target.value.trim(), false));
    }

    const dinnerSensorSel = this.querySelector("#dinner_sensor");
    if (dinnerSensorSel) {
      dinnerSensorSel.addEventListener("change", (e) => this._update("dinner_sensor", e.target.value.trim(), false));
    }

    const personEntitiesInput = this.querySelector("#person_entities");
    if (personEntitiesInput) {
      personEntitiesInput.addEventListener("change", (e) => this._update("person_entities", e.target.value.trim(), false));
    }
    const personCheckboxes = this.querySelectorAll(".person-entity-checkbox");
    if (personCheckboxes.length > 0) {
      personCheckboxes.forEach((box) => {
        box.addEventListener("change", () => {
          const current = (this._config.person_entities || "").split(",").map((s) => s.trim()).filter(Boolean);
          if (box.checked) {
            if (!current.includes(box.value)) current.push(box.value);
          } else {
            const idx = current.indexOf(box.value);
            if (idx !== -1) current.splice(idx, 1);
          }
          this._update("person_entities", current.join(", "), false);
        });
      });
    }

    const customWagonEntitySel = this.querySelector("#custom_wagon_entity");
    if (customWagonEntitySel) {
      customWagonEntitySel.addEventListener("change", (e) => this._update("custom_wagon_entity", e.target.value, false));
    }

    const customWagonInput = this.querySelector("#custom_wagon_text");
    if (customWagonInput) {
      customWagonInput.addEventListener("change", (e) => this._update("custom_wagon_text", e.target.value.trim(), false));
    }

    const countSel = this.querySelector("#count_preset");
    if (countSel) countSel.addEventListener("change", (e) => this._update("count_preset", e.target.value, true));

    const opacitySel = this.querySelector("#opacity_preset");
    if (opacitySel) opacitySel.addEventListener("change", (e) => this._update("opacity_preset", e.target.value, true));

    const colorModeSel = this.querySelector("#color_mode");
    if (colorModeSel) {
      colorModeSel.addEventListener("change", (e) => {
        const mode = e.target.value;
        if (mode === "auto") {
          this._updateConfig({ color_mode: "auto", color: "auto" }, true);
        } else {
          this._updateConfig({ color_mode: "custom", color: "#ffffff" }, true);
        }
      });
    }

    const colorPicker = this.querySelector("#color");
    if (colorPicker) {
      colorPicker.addEventListener("change", (e) => this._update("color", e.target.value, true));
      colorPicker.addEventListener("input", (e) => this._update("color", e.target.value, false));
    }

    this._updatePreview();
  }

  _updatePreview() {
    const stage = this.querySelector("#live-preview-stage");
    const msg = this.querySelector("#live-preview-msg");
    if (!stage || !msg) return;
    const c = this._config;
    if (!c || c.event === "off") {
      stage.innerHTML = "";
      msg.textContent = "No effect selected.";
      return;
    }
    if (c.event === "weather_auto") {
      stage.innerHTML = "";
      msg.textContent = "Preview not available for 'Automatic' - it depends on the current live weather.";
      return;
    }
    const renderer = RENDERERS[c.event];
    if (!renderer) {
      stage.innerHTML = "";
      msg.textContent = "";
      return;
    }
    msg.textContent = "";
    // Improvement (bugfix): in "auto" colour mode the effect would otherwise
    // take the colour of the REAL Home Assistant editor window (which can be
    // light) - but our preview box always has a dark background. Without this
    // correction e.g. black raindrops would be invisible on the dark
    // background. The preview therefore forces a light colour, regardless of
    // the real dashboard theme.
    const caps = EVENT_CAPABILITIES[c.event] || {};
    const previewCfg = (caps.color && (c.color_mode || "auto") === "auto")
      ? { ...c, color: "#ffffff" }
      : c;
    const { css, html } = renderer(previewCfg, this._hass, this);
    stage.innerHTML = `<style>${css}</style>${html}`;
  }

  _update(key, value, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, [key]: value };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) {
      this._render();
    } else {
      this._updatePreview();
    }
  }

  _updateConfig(newValues, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, ...newValues };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) {
      this._render();
    } else {
      this._updatePreview();
    }
  }
}

/* ============================== REGISTRATION ============================== */

if (!customElements.get("ambient-overlay-card")) {
  customElements.define("ambient-overlay-card", AmbientOverlayCard);
}
if (!customElements.get("ambient-overlay-card-editor")) {
  customElements.define("ambient-overlay-card-editor", AmbientOverlayCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ambient-overlay-card",
  name: "Ambient Overlay Card",
  description: "Atmospheric overlay effects for your dashboard: weather, sky, animals, decorations and occasions - with universal theme support.",
  preview: false,
});
