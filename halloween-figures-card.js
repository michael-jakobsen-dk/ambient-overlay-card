// halloween-figures-card: a large Halloween figure crosses the screen at random intervals.
// Companion to ambient-overlay-card by misterm2310 (https://github.com/misterm2310/ambient-overlay-card).
// Options: min_interval s (180), max_interval s (480), size px (600, longest side, capped at 80vh),
//          speed_factor (0.5 = half the speed of halloween-bats-card; each figure scales it by its own
//          speed, then by a random 0.7–1.4), opacity (0.95),
//          figures (list, default all), first_delay s (optional, for testing).
const BONE = "#ece6d4";
const INK = "#1a1a1a";

const FIGURES = {
  skeleton: {
    speed: 1.0,
    vb: [60, 100], ground: true,
    svg: `
      <g class="bob" fill="none" stroke="${BONE}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
        <g class="leg-a" style="transform-origin:27px 60px"><path d="M27,60 L26,78 L26,95 L32,96"/></g>
        <g class="leg-b" style="transform-origin:33px 60px"><path d="M33,60 L34,78 L34,95 L40,96"/></g>
        <path d="M30,21 L30,58"/>
        <path d="M21,28 Q30,25 39,28 M20,34 Q30,31 40,34 M21,40 Q30,37 39,40 M23,46 Q30,44 37,46"/>
        <path d="M23,56 Q30,65 37,56 Z" fill="${BONE}"/>
        <path d="M20,25 L40,25"/>
        <g class="arm-a" style="transform-origin:20px 25px"><path d="M20,25 L18,42 L20,56"/></g>
        <g class="arm-b" style="transform-origin:40px 25px"><path d="M40,25 L42,42 L40,56"/></g>
        <circle cx="30" cy="11" r="9" fill="${BONE}" stroke="none"/>
        <rect x="25" y="16" width="10" height="5" rx="1.5" fill="${BONE}" stroke="none"/>
        <circle cx="26.5" cy="10.5" r="2.6" fill="${INK}" stroke="none"/>
        <circle cx="33.5" cy="10.5" r="2.6" fill="${INK}" stroke="none"/>
        <path d="M30,13.5 L29,16 L31,16 Z" fill="${INK}" stroke="none"/>
        <path d="M27,18.5 L33,18.5 M28.5,17.5 L28.5,20 M30,17.5 L30,20 M31.5,17.5 L31.5,20" stroke="${INK}" stroke-width="0.6"/>
      </g>`,
  },

  ghost: {
    speed: 0.7,
    vb: [100, 100], ground: false,
    svg: `
      <g class="float" style="transform-origin:50px 50px">
        <path d="M20,88 L20,45 C20,20 35,8 50,8 C65,8 80,20 80,45 L80,88
                 Q75,80 70,88 Q65,96 60,88 Q55,80 50,88 Q45,96 40,88 Q35,80 30,88 Q25,96 20,88 Z"
              fill="#f4f4ff" fill-opacity="0.88"/>
        <path d="M20,50 Q8,52 10,62 Q16,58 21,60 Z M80,50 Q92,52 90,62 Q84,58 79,60 Z" fill="#f4f4ff" fill-opacity="0.88"/>
        <ellipse cx="40" cy="38" rx="5.5" ry="8" fill="#1d1d2b"/>
        <ellipse cx="60" cy="38" rx="5.5" ry="8" fill="#1d1d2b"/>
        <ellipse class="mouth" cx="50" cy="58" rx="6" ry="8" fill="#1d1d2b" style="transform-origin:50px 58px"/>
      </g>`,
  },

  skull: {
    speed: 0.9,
    vb: [100, 100], ground: false,
    svg: `
      <g class="float" style="transform-origin:50px 50px">
        <path d="M50,8 C24,8 12,26 12,44 C12,58 20,66 30,70 L70,70 C80,66 88,58 88,44 C88,26 76,8 50,8 Z" fill="${BONE}"/>
        <ellipse cx="35" cy="44" rx="10" ry="11" fill="${INK}"/>
        <ellipse cx="65" cy="44" rx="10" ry="11" fill="${INK}"/>
        <circle class="glow-eye" cx="35" cy="46" r="2.6" fill="#ff3b3b"/>
        <circle class="glow-eye" cx="65" cy="46" r="2.6" fill="#ff3b3b"/>
        <path d="M50,54 L45,64 L55,64 Z" fill="${INK}"/>
        <path d="M36,70 L36,76 M42,70 L42,77 M48,70 L48,77 M54,70 L54,77 M60,70 L60,76" stroke="${INK}" stroke-width="1.4"/>
        <g class="jaw" style="transform-origin:50px 76px">
          <path d="M30,76 L30,84 Q50,94 70,84 L70,76 Z" fill="${BONE}"/>
          <path d="M36,76 L36,82 M42,76 L42,84 M48,76 L48,85 M54,76 L54,85 M60,76 L60,83 M30,76 L70,76" stroke="${INK}" stroke-width="1.4"/>
        </g>
      </g>`,
  },

  zombie: {
    speed: 0.55,
    vb: [60, 100], ground: true,
    svg: `
      <g class="sway" style="transform-origin:30px 96px">
        <g class="leg-a" style="transform-origin:27px 60px" stroke-linecap="round">
          <path d="M27,60 L26,93" stroke="#3d405b" stroke-width="7"/>
          <path d="M25,95 L32,95" stroke="#222" stroke-width="4"/>
        </g>
        <g class="leg-b" style="transform-origin:33px 60px" stroke-linecap="round">
          <path d="M33,60 L35,93" stroke="#3d405b" stroke-width="7"/>
          <path d="M34,95 L41,95" stroke="#222" stroke-width="4"/>
        </g>
        <path d="M19,26 L41,26 L42,60 L37,56 L33,62 L29,56 L24,62 L18,60 Z" fill="#6b5b95"/>
        <path d="M26,34 L30,40 M34,46 L37,50" stroke="#4a3f6b" stroke-width="1.2"/>
        <g class="arm-z" style="transform-origin:22px 30px" stroke-linecap="round">
          <path d="M22,30 L50,32" stroke="#7fb069" stroke-width="5.5"/>
          <path d="M22,30 L33,31" stroke="#6b5b95" stroke-width="7.5"/>
        </g>
        <g class="arm-z2" style="transform-origin:38px 30px" stroke-linecap="round">
          <path d="M38,30 L57,29" stroke="#7fb069" stroke-width="5.5"/>
          <path d="M38,30 L46,30" stroke="#6b5b95" stroke-width="7.5"/>
        </g>
        <circle cx="30" cy="15" r="10" fill="#7fb069"/>
        <path d="M21,12 Q24,3 31,5 Q38,3 39,11 L36,8 L33,10 L30,7 L26,10 Z" fill="#2e2a24"/>
        <circle cx="34.5" cy="14" r="2.3" fill="#ff4d4d"/>
        <path d="M24,12 L28,16 M28,12 L24,16" stroke="#222" stroke-width="1.2"/>
        <path d="M27,20.5 L34,20 L32,22.5" stroke="#222" stroke-width="1" fill="none"/>
        <path d="M21,17 L25,19 M22,16 L22,18.5 M23.5,17 L23.5,19.5" stroke="#3f5f30" stroke-width="0.7"/>
      </g>`,
  },

  pumpkin: {
    speed: 1.3,
    vb: [100, 100], ground: true,
    svg: `
      <g class="hop" style="transform-origin:50px 96px">
        <path d="M50,24 Q48,14 54,8" stroke="#4a7c2a" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M54,18 Q66,10 72,18 Q62,20 56,22 Z" fill="#5c9a33"/>
        <ellipse cx="50" cy="60" rx="44" ry="36" fill="#ff7518"/>
        <ellipse cx="50" cy="60" rx="30" ry="36" fill="none" stroke="#d35400" stroke-width="2.5"/>
        <ellipse cx="50" cy="60" rx="13" ry="36" fill="none" stroke="#d35400" stroke-width="2.5"/>
        <g class="lit" fill="#ffd166">
          <path d="M26,52 L36,38 L44,54 Z"/>
          <path d="M56,54 L64,38 L74,52 Z"/>
          <path d="M47,62 L50,56 L53,62 Z"/>
          <path d="M24,68 Q50,92 76,68 L70,72 L66,68 L60,75 L54,69 L48,76 L42,69 L36,75 L32,69 L28,72 Z"/>
        </g>
      </g>`,
  },

  witch: {
    speed: 2.0,
    vb: [120, 80], ground: false,
    svg: `
      <g class="float" style="transform-origin:60px 45px">
        <path d="M8,60 L112,46" stroke="#7a4a22" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M14,59 L0,52 L3,60 L-1,67 L3,66 L2,72 L16,63 Z" fill="#c9a227"/>
        <path d="M12,58 L16,63" stroke="#7a4a22" stroke-width="2.5"/>
        <path class="cape" d="M54,28 Q38,32 30,50 Q42,46 48,54 Z" fill="#4b2a7b" style="transform-origin:54px 30px"/>
        <path d="M48,57 L74,54 L68,26 Q60,20 54,28 Z" fill="#1b1b2f"/>
        <path d="M66,54 L74,66 L80,66" stroke="#1b1b2f" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M66,32 L84,49" stroke="#1b1b2f" stroke-width="4" stroke-linecap="round"/>
        <circle cx="84" cy="49" r="2.6" fill="#9bc53d"/>
        <path d="M57,18 Q50,28 47,36 M59,19 Q54,28 52,34" stroke="#ff7518" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="63" cy="20" r="7.5" fill="#9bc53d"/>
        <path d="M69,19 L76,23 L69,24 Z" fill="#8ab52d"/>
        <circle cx="66" cy="18" r="1.3" fill="#111"/>
        <path d="M64,25 Q66,26.5 68,25" stroke="#111" stroke-width="0.8" fill="none"/>
        <ellipse cx="62" cy="14" rx="14" ry="3" fill="#1b1b2f"/>
        <path d="M54,14 L71,14 L48,0 Z" fill="#1b1b2f"/>
        <path d="M55,12.5 L69,12.5 L67.5,10 L56.5,10 Z" fill="#7b2cbf"/>
      </g>`,
  },

  cat: {
    speed: 1.6,
    vb: [100, 60], ground: true,
    svg: `
      <g class="bob" fill="#111" stroke="#111" stroke-linecap="round">
        <g class="tail" style="transform-origin:26px 28px"><path d="M26,28 Q8,26 10,10 Q12,2 18,6" stroke-width="4" fill="none"/></g>
        <g class="leg-a" style="transform-origin:34px 38px"><path d="M34,38 L32,56" stroke-width="4"/></g>
        <g class="leg-b" style="transform-origin:40px 38px"><path d="M40,38 L42,56" stroke-width="4"/></g>
        <g class="leg-b" style="transform-origin:60px 38px"><path d="M60,38 L58,56" stroke-width="4"/></g>
        <g class="leg-a" style="transform-origin:66px 38px"><path d="M66,38 L68,56" stroke-width="4"/></g>
        <ellipse cx="50" cy="32" rx="26" ry="11" stroke="none"/>
        <circle cx="78" cy="22" r="10" stroke="none"/>
        <path d="M70,16 L72,3 L79,13 Z M80,13 L86,3 L87,17 Z" stroke="none"/>
        <ellipse cx="75" cy="21" rx="1.9" ry="2.8" fill="#ffd60a" stroke="none"/>
        <ellipse cx="82.5" cy="21" rx="1.9" ry="2.8" fill="#ffd60a" stroke="none"/>
        <path d="M85,25 L95,23 M85,26.5 L95,27" stroke="#888" stroke-width="0.5"/>
      </g>`,
  },

  mummy: {
    speed: 0.45,
    vb: [60, 100], ground: true,
    svg: `
      <g class="sway" style="transform-origin:30px 96px">
        <g class="leg-a" style="transform-origin:27px 60px" stroke-linecap="round">
          <path d="M27,60 L26,95" stroke="#e8dcc0" stroke-width="7"/>
          <path d="M23,70 L30,72 M23,80 L30,82 M23,89 L30,91" stroke="#b8a888" stroke-width="0.9"/>
        </g>
        <g class="leg-b" style="transform-origin:33px 60px" stroke-linecap="round">
          <path d="M33,60 L35,95" stroke="#e8dcc0" stroke-width="7"/>
          <path d="M31,69 L38,71 M31,79 L38,81 M32,88 L39,90" stroke="#b8a888" stroke-width="0.9"/>
        </g>
        <path d="M19,26 L41,26 L42,61 L18,61 Z" fill="#e8dcc0"/>
        <path d="M18,31 L42,35 M18,38 L42,33 M18,44 L42,48 M18,51 L42,47 M18,57 L42,59" stroke="#b8a888" stroke-width="1"/>
        <path d="M40,52 Q48,60 44,70" stroke="#e8dcc0" stroke-width="2" fill="none"/>
        <g class="arm-z" style="transform-origin:22px 30px" stroke-linecap="round">
          <path d="M22,30 L50,32" stroke="#e8dcc0" stroke-width="5.5"/>
          <path d="M28,28 L29,33 M35,29 L36,34 M42,30 L43,35" stroke="#b8a888" stroke-width="0.8"/>
        </g>
        <g class="arm-z2" style="transform-origin:38px 30px" stroke-linecap="round">
          <path d="M38,30 L57,29" stroke="#e8dcc0" stroke-width="5.5"/>
          <path d="M44,27 L45,32 M51,27 L52,32" stroke="#b8a888" stroke-width="0.8"/>
        </g>
        <circle cx="30" cy="15" r="10" fill="#e8dcc0"/>
        <path d="M20,10 L40,13 M20,19 L40,16 M21,22 L38,23 M22,7 L37,6" stroke="#b8a888" stroke-width="1"/>
        <rect x="23" y="12" width="15" height="4" fill="#2a2418"/>
        <circle class="glow-eye" cx="27.5" cy="14" r="1.5" fill="#ffde59"/>
        <circle class="glow-eye" cx="34" cy="14" r="1.5" fill="#ffde59"/>
      </g>`,
  },

  vampire: {
    speed: 0.8,
    vb: [70, 100], ground: true,
    svg: `
      <g class="glide" style="transform-origin:35px 96px">
        <path class="cape" d="M20,24 Q4,60 8,96 L62,96 Q66,60 50,24 Z" fill="#1b1b2f" style="transform-origin:35px 24px"/>
        <path d="M22,24 Q10,60 14,94 L56,94 Q60,60 48,24 Z" fill="#8b0000"/>
        <path d="M26,26 L44,26 L46,94 L24,94 Z" fill="#111"/>
        <path d="M30,26 L35,40 L40,26 Z" fill="#f2f2f2"/>
        <path d="M35,30 L33,34 L35,38 L37,34 Z" fill="#c1121f"/>
        <path d="M18,22 L26,30 L35,24 L44,30 L52,22 L44,14 L26,14 Z" fill="#1b1b2f"/>
        <ellipse cx="35" cy="14" rx="9" ry="10.5" fill="#dfe3ea"/>
        <path d="M26,10 Q35,0 44,10 L40,8 L35,13 L30,8 Z" fill="#111"/>
        <path d="M30,12 L33,13.5 M40,12 L37,13.5" stroke="#111" stroke-width="1.2" stroke-linecap="round"/>
        <circle class="glow-eye" cx="31.5" cy="15" r="1.4" fill="#ff1f3d"/>
        <circle class="glow-eye" cx="38.5" cy="15" r="1.4" fill="#ff1f3d"/>
        <path d="M31,20.5 Q35,22.5 39,20.5" stroke="#7a1020" stroke-width="1" fill="none"/>
        <path d="M32.5,21 L33.2,23.4 L34,21.3 Z M36,21.3 L36.8,23.4 L37.5,21 Z" fill="#fff"/>
      </g>`,
  },
};

const CSS = `
  .wrap { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none; z-index: 9998; overflow: hidden; }
  .fig { position: absolute; left: 0; will-change: transform; }
  .flip, .flip svg { width: 100%; height: 100%; display: block; overflow: visible; }
  svg * { transform-box: view-box; }

  .leg-a { animation: swing 1.4s ease-in-out infinite alternate; }
  .leg-b { animation: swing 1.4s ease-in-out infinite alternate-reverse; }
  .arm-a { animation: swing-s 1.4s ease-in-out infinite alternate-reverse; }
  .arm-b { animation: swing-s 1.4s ease-in-out infinite alternate; }
  .bob   { animation: bob 0.7s ease-in-out infinite alternate; }
  .float { animation: float 3s ease-in-out infinite alternate; }
  .jaw   { animation: chatter 0.35s ease-in-out infinite alternate; }
  .mouth { animation: moan 2.2s ease-in-out infinite alternate; }
  .hop   { animation: hop 1.1s cubic-bezier(.3,0,.7,1) infinite; }
  .sway  { animation: sway 1.8s ease-in-out infinite alternate; }
  .glide { animation: bob 2.4s ease-in-out infinite alternate; }
  .tail  { animation: tail 1s ease-in-out infinite alternate; }
  .cape  { animation: flutter 0.9s ease-in-out infinite alternate; }
  .arm-z { animation: reach 1.8s ease-in-out infinite alternate; }
  .arm-z2 { animation: reach 1.8s ease-in-out infinite alternate-reverse; }
  .lit, .glow-eye { animation: flicker 1.3s steps(6) infinite; }

  .zombie .leg-a, .zombie .leg-b { animation-duration: 2.2s; }
  .mummy .leg-a, .mummy .leg-b { animation-duration: 2.6s; }
  .cat .leg-a, .cat .leg-b { animation-duration: 0.5s; }
  .cat .bob { animation-duration: 0.5s; }

  .ghost svg { filter: drop-shadow(0 0 18px rgba(200, 200, 255, 0.6)); }
  .skull svg { filter: drop-shadow(0 0 12px rgba(255, 60, 60, 0.35)); }
  .pumpkin svg { filter: drop-shadow(0 0 22px rgba(255, 140, 0, 0.55)); }
  .witch svg, .cat svg, .vampire svg { filter: drop-shadow(0 0 6px rgba(190, 150, 255, 0.7)); }
  .zombie svg { filter: drop-shadow(0 0 8px rgba(127, 176, 105, 0.5)); }
  .mummy svg, .skeleton svg { filter: drop-shadow(0 0 8px rgba(255, 245, 220, 0.4)); }

  @keyframes swing   { from { transform: rotate(-20deg); } to { transform: rotate(20deg); } }
  @keyframes swing-s { from { transform: rotate(-12deg); } to { transform: rotate(12deg); } }
  @keyframes bob     { from { transform: translateY(0); } to { transform: translateY(-1.5px); } }
  @keyframes float   { from { transform: translateY(-4px) rotate(-3deg); } to { transform: translateY(4px) rotate(3deg); } }
  @keyframes chatter { from { transform: translateY(0); } to { transform: translateY(4px); } }
  @keyframes moan    { from { transform: scale(0.8, 0.7); } to { transform: scale(1.1, 1.15); } }
  @keyframes hop     { 0%, 100% { transform: translateY(0) scaleY(0.92); } 50% { transform: translateY(-14px) scaleY(1.04); } }
  @keyframes sway    { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
  @keyframes tail    { from { transform: rotate(-10deg); } to { transform: rotate(12deg); } }
  @keyframes flutter { from { transform: skewX(-4deg); } to { transform: skewX(5deg); } }
  @keyframes reach   { from { transform: rotate(-6deg); } to { transform: rotate(4deg); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 30% { opacity: 0.75; } 55% { opacity: 0.95; } 80% { opacity: 0.7; } }
`;

class HalloweenFiguresCard extends HTMLElement {
  setConfig(config) {
    this._config = {
      min_interval: 180, max_interval: 480, size: 600, speed_factor: 0.5, opacity: 0.95,
      figures: Object.keys(FIGURES), first_delay: null,
      ...config,
    };
    this._figures = this._config.figures.filter((f) => FIGURES[f]);
    if (!this._figures.length) throw new Error(`figures must include one of: ${Object.keys(FIGURES).join(", ")}`);
  }

  set hass(_hass) {}

  getCardSize() { return 0; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="wrap" aria-hidden="true"></div>`;
    }
    this._schedule(this._config.first_delay);
  }

  disconnectedCallback() {
    clearTimeout(this._timer);
    this._timer = null;
    if (this._anim) this._anim.cancel();
  }

  _schedule(delay) {
    clearTimeout(this._timer);
    const c = this._config;
    const sec = delay ?? c.min_interval + Math.random() * (c.max_interval - c.min_interval);
    this._timer = setTimeout(() => this._spawn(), sec * 1000);
  }

  _pick() {
    // Random, but never the same figure twice in a row.
    const pool = this._figures.length > 1 ? this._figures.filter((f) => f !== this._last) : this._figures;
    this._last = pool[Math.floor(Math.random() * pool.length)];
    return this._last;
  }

  _spawn() {
    this._schedule();
    if (document.hidden) return;
    const c = this._config;
    const name = this._pick();
    const fig = FIGURES[name];
    const [vbW, vbH] = fig.vb;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = Math.min((c.size * vbH) / Math.max(vbW, vbH), vh * 0.8);
    const w = (h * vbW) / vbH;
    const ltr = Math.random() < 0.5;

    const el = document.createElement("div");
    el.className = `fig ${name}`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.opacity = c.opacity;
    if (fig.ground) el.style.bottom = "0";
    else el.style.top = `${3 + Math.random() * Math.max(0, 92 - (100 * h) / vh)}vh`;
    el.innerHTML = `<div class="flip" style="transform:scaleX(${ltr ? 1 : -1})">
      <svg viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">${fig.svg}</svg></div>`;
    this.shadowRoot.querySelector(".wrap").appendChild(el);

    // Bats cross (100vw + 180px) in ~18 s on average; figures move at speed_factor of that.
    const batSpeed = (vw + 180) / 18;
    const speed = batSpeed * c.speed_factor * fig.speed * (0.7 + Math.random() * 0.7);
    const startX = ltr ? -w : vw;
    const endX = ltr ? vw : -w;
    this._anim = el.animate(
      [{ transform: `translateX(${startX}px)` }, { transform: `translateX(${endX}px)` }],
      { duration: (Math.abs(endX - startX) / speed) * 1000, easing: "linear" },
    );
    this._anim.onfinish = () => el.remove();
    this._anim.oncancel = () => el.remove();
  }
}

if (!customElements.get("halloween-figures-card")) {
  customElements.define("halloween-figures-card", HalloweenFiguresCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "halloween-figures-card",
    name: "Halloween Figures",
    description: "Large Halloween figures crossing the screen at random intervals",
  });
}
