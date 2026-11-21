import Experience from "../Experience";
import Hud from "./Hud";
import Loader from "./Loader";
import Sky from "./Sky";
import Topography from "./Topography";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.resources = this.experience.resources;

    this.loader = new Loader();

    // Resources may already be done by the time the renderer is ready
    if (this.resources.isReady) {
      this.setup();
    } else {
      this.resources.on("ready", () => this.setup());
    }
  }

  async setup() {
    this.topography = new Topography();
    this.sky = new Sky();
    await this.topography.ready;

    // Show Experience
    this.loader.hideLoader();
    this.setHud();
  }

  setHud() {
    const terrainMap = this.topography.terrainMap;

    this.hud = new Hud({
      style: terrainMap.style,
      exaggeration: terrainMap.exaggeration.value,
    });

    this.hud.on("style", (style) => {
      terrainMap.setStyle(style);
    });

    // terrainMap.update() notices the new value and resizes the tile bounds
    this.hud.on("exaggeration", (exaggeration) => {
      terrainMap.exaggeration.value = exaggeration;
    });
  }

  update() {
    if (this.topography) this.topography.update();
  }
}
