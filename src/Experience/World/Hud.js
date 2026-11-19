export default class Hud {
  constructor(terrainMap) {
    this.terrainMap = terrainMap;

    this.element = document.querySelector(".hud");
    this.wireframe = this.element.querySelector(".hud-wireframe");

    this.setWireframe();

    this.element.hidden = false;
  }

  setWireframe() {
    this.wireframe.checked = this.terrainMap.wireframe;
    this.onWireframeChange = () => {
      this.terrainMap.setWireframe(this.wireframe.checked);
      this.wireframe.blur();
    };
    this.wireframe.addEventListener("change", this.onWireframeChange);
  }

  destroy() {
    this.wireframe.removeEventListener("change", this.onWireframeChange);
    this.element.hidden = true;
  }
}
