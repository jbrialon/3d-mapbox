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
    this.modes = this.element.querySelector(".hud-modes");

    // Setup
    this.setStyles();
    this.setExaggeration();
    this.setModes();

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
    this.showExaggeration(this.options.exaggeration);

    this.onExaggerationInput = () => {
      const exaggeration = Number(this.exaggeration.value);
      this.showExaggeration(exaggeration);
      this.trigger("exaggeration", exaggeration);
    };
    this.exaggeration.addEventListener("input", this.onExaggerationInput);

    this.onExaggerationChange = () => {
      this.exaggeration.blur();
    };
    this.exaggeration.addEventListener("change", this.onExaggerationChange);
  }

  // Value label + filled part of the slider track
  showExaggeration(exaggeration) {
    const { min, max } = this.exaggeration;
    const fill = ((exaggeration - min) / (max - min)) * 100;
    this.exaggeration.style.setProperty("--fill", `${fill}%`);
    this.exaggerationValue.textContent = `${Number(exaggeration.toFixed(2))}×`;
  }

  // Orbit / Fly switch
  setModes() {
    this.onModeClick = (event) => {
      const button = event.target.closest(".hud-mode");
      if (!button) return;
      if (button.dataset.mode === "fly") this.trigger("fly");
      button.blur();
    };
    this.modes.addEventListener("click", this.onModeClick);
  }

  setMode(mode) {
    this.element.dataset.mode = mode;
    for (const button of this.modes.querySelectorAll(".hud-mode")) {
      button.setAttribute("aria-pressed", button.dataset.mode === mode);
    }
  }

  destroy() {
    this.modes.removeEventListener("click", this.onModeClick);
    this.styles.removeEventListener("change", this.onStyleChange);
    this.exaggeration.removeEventListener("input", this.onExaggerationInput);
    this.exaggeration.removeEventListener("change", this.onExaggerationChange);
    this.element.hidden = true;
  }
}
