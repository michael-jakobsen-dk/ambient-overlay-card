// halloween-bats-card: full-screen flying bats overlay with configurable size and speed.
// Bat shape and flight path adapted from ambient-overlay-card by misterm2310
// (https://github.com/misterm2310/ambient-overlay-card).
// Options: count (8), size px (60), min_duration s (14), max_duration s (22), color (#cbc4d9), opacity (0.7)
class HalloweenBatsCard extends HTMLElement {
  setConfig(config) {
    this._config = {
      count: 8, size: 60, min_duration: 14, max_duration: 22, color: "#cbc4d9", opacity: 0.7,
      ...config,
    };
    this._render();
  }

  set hass(_hass) {}

  getCardSize() { return 0; }

  _render() {
    const c = this._config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const span = Math.max(c.max_duration - c.min_duration, 0);
    const bats = Array.from({ length: c.count }, () => {
      const dur = c.min_duration + Math.random() * span;
      const top = (Math.random() * 80).toFixed(2);
      const delay = (-Math.random() * dur).toFixed(2);
      const flap = (Math.random() * 0.2 + 0.35).toFixed(2);
      const op = ((Math.random() * 0.3 + 0.7) * c.opacity).toFixed(2);
      const wobble = Math.floor(Math.random() * 10) + 6;
      return `<div class="bat" style="top:${top}vh;animation-duration:${dur.toFixed(2)}s;animation-delay:${delay}s;opacity:${op};--wobble:${wobble}vh">
        <svg viewBox="0 0 40 20" class="wings" style="animation-duration:${flap}s">
          <path d="M20,10 L2,0 L9,7 L0,10 L9,13 L2,20 Z" fill="${c.color}"/>
          <path d="M20,10 L38,0 L31,7 L40,10 L31,13 L38,20 Z" fill="${c.color}"/>
          <ellipse cx="20" cy="10" rx="3" ry="4" fill="${c.color}"/>
          <path d="M17,7 L14,3 M23,7 L26,3" stroke="${c.color}" stroke-width="1.5" stroke-linecap="round"/>
        </svg></div>`;
    }).join("");
    this.shadowRoot.innerHTML = `<style>
      .wrap { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              pointer-events: none; z-index: 9999; overflow: hidden; }
      .bat { position: absolute; left: -${c.size * 2}px; width: ${c.size}px;
             animation: bat-fly linear infinite; will-change: transform; }
      .wings { width: 100%; height: auto; display: block; transform-origin: center;
               animation: bat-flap ease-in-out infinite alternate; }
      @keyframes bat-fly {
        0%   { transform: translateX(0) translateY(0); }
        25%  { transform: translateX(30vw) translateY(calc(-1 * var(--wobble))); }
        50%  { transform: translateX(60vw) translateY(var(--wobble)); }
        75%  { transform: translateX(90vw) translateY(calc(-1 * var(--wobble))); }
        100% { transform: translateX(calc(100vw + ${c.size * 3}px)) translateY(0); }
      }
      @keyframes bat-flap { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.4); } }
    </style><div class="wrap" aria-hidden="true">${bats}</div>`;
  }
}

if (!customElements.get("halloween-bats-card")) {
  customElements.define("halloween-bats-card", HalloweenBatsCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "halloween-bats-card", name: "Halloween Bats", description: "Flying bats overlay" });
}
