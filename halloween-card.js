// halloween-card: the complete Halloween theme from a single card.
// Runs halloween-bats-card, halloween-figures-card and three ambient-overlay-card effects
// (spider web, autumn leaves, night sky) as one. Those cards must be loaded as resources too.
// Companion to ambient-overlay-card by misterm2310 (https://github.com/misterm2310/ambient-overlay-card).
//
// Every part is on by default. Per part: `false` turns it off, an object overrides its options.
//   type: custom:halloween-card
//   bats: { size: 80 }
//   figures: { min_interval: 120, figures: [ghost, pumpkin, spiders] }
//   leaves: false
const PARTS = {
  bats: {
    tag: "halloween-bats-card",
    defaults: { size: 60, min_duration: 22, max_duration: 34 },
  },
  figures: {
    tag: "halloween-figures-card",
    defaults: {},
  },
  spider_web: {
    tag: "ambient-overlay-card",
    defaults: { event: "spider", opacity_preset: "medium" },
  },
  leaves: {
    tag: "ambient-overlay-card",
    defaults: { event: "leaves", count_preset: "low", opacity_preset: "medium", leaf_colors: ["#ff7518", "#7b2cbf", "#e85d04"] },
  },
  night_sky: {
    tag: "ambient-overlay-card",
    defaults: { event: "night_sky", count_preset: "low", opacity_preset: "low" },
  },
};

// How long to wait for a part's card to be registered before giving up on it.
const DEFINE_TIMEOUT_MS = 15000;

class HalloweenCard extends HTMLElement {
  setConfig(config) {
    for (const key of Object.keys(config)) {
      if (key !== "type" && !PARTS[key]) {
        throw new Error(`Unknown option '${key}'. Use: ${Object.keys(PARTS).join(", ")}`);
      }
    }
    this._config = config;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    for (const child of this._children || []) child.hass = hass;
  }

  getCardSize() { return 0; }

  async _build() {
    const build = (this._buildId = (this._buildId || 0) + 1);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.replaceChildren();
    this._children = [];

    const parts = Object.entries(PARTS).filter(([key]) => this._config[key] !== false);
    const tags = [...new Set(parts.map(([, part]) => part.tag))];
    const loaded = await Promise.all(tags.map((tag) => Promise.race([
      customElements.whenDefined(tag).then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), DEFINE_TIMEOUT_MS)),
    ])));
    // A newer setConfig started its own build while we were waiting.
    if (build !== this._buildId) return;
    const ready = Object.fromEntries(tags.map((tag, i) => [tag, loaded[i]]));

    for (const [key, part] of parts) {
      const opts = this._config[key];
      if (!ready[part.tag]) {
        console.warn(`halloween-card: '${part.tag}' is not loaded, skipping '${key}'. Add it as a dashboard resource.`);
        continue;
      }
      const child = document.createElement(part.tag);
      const own = typeof opts === "object" && opts !== null ? opts : {};
      try {
        // The event of an ambient-overlay-card part is fixed; everything else can be overridden.
        child.setConfig({ type: `custom:${part.tag}`, ...part.defaults, ...own, ...(part.defaults.event && { event: part.defaults.event }) });
      } catch (err) {
        console.error(`halloween-card: invalid options for '${key}':`, err);
        continue;
      }
      if (this._hass) child.hass = this._hass;
      this._children.push(child);
      this.shadowRoot.appendChild(child);
    }
  }
}

if (!customElements.get("halloween-card")) {
  customElements.define("halloween-card", HalloweenCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "halloween-card",
    name: "Halloween",
    description: "The complete Halloween theme in one card: bats, figures, spiders, a web, leaves and a night sky",
  });
}
