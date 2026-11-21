import EventEmitter from "../Utils/EventEmitter";

export default class Hud extends EventEmitter {
  constructor(options) {
    super();

    // Options
    this.options = {
      style: options.style,
      exaggeration: options.exaggeration,
    };

    this.element = document.querySelector(".hud");
    this.styles = this.element.querySelector(".hud-styles");
    this.exaggeration = this.element.querySelector(".hud-exaggeration");
    this.exaggerationValue = this.element.querySelector(
      ".hud-exaggeration-value",
    );

    // Setup
    this.setStyles();
    this.setExaggeration();

    this.element.hidden = false;
  }

  setStyles() {
    this.styles.querySelector(`[value="${this.options.style}"]`).checked = true;

    this.onStyleChange = (event) => {
      this.trigger("style", event.target.value);
      // Gives the keyboard back to the fly controls
      event.target.blur();
    };
    this.styles.addEventListener("change", this.onStyleChange);
  }

  setExaggeration() {
    this.exaggeration.value = this.options.exaggeration;
    this.exaggerationValue.textContent = `${this.options.exaggeration}×`;

    this.onExaggerationInput = () => {
      const exaggeration = Number(this.exaggeration.value);
      this.exaggerationValue.textContent = `${exaggeration}×`;
      this.trigger("exaggeration", exaggeration);
    };
    this.exaggeration.addEventListener("input", this.onExaggerationInput);

    // Gives the keyboard back to the fly controls after dragging
    this.onExaggerationChange = () => {
      this.exaggeration.blur();
    };
    this.exaggeration.addEventListener("change", this.onExaggerationChange);
  }

  destroy() {
    this.styles.removeEventListener("change", this.onStyleChange);
    this.exaggeration.removeEventListener("input", this.onExaggerationInput);
    this.exaggeration.removeEventListener("change", this.onExaggerationChange);
    this.element.hidden = true;
  }
}
