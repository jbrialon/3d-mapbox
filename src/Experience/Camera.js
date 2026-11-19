import * as THREE from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

import Experience from "./Experience";

export default class Camera {
  constructor() {
    this.experience = new Experience();

    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.debug = this.experience.debug;

    this.options = {
      speed: 40, // units per second
      sprint: 4, // multiplier while holding shift
      damping: 12, // higher = snappier start/stop
      pointerSpeed: 0.6,
      maxHeight: 200,
    };

    this.target = new THREE.Vector3(19.2, 21.18, 33.66);

    this.setInstance();
    this.setOrbitControls();
    this.setFlyControls();
    this.setDebug();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      60,
      this.sizes.width / this.sizes.height,
      0.1,
      300,
    );
    this.instance.position.set(-12.9, 26.69, -4.27);
    this.instance.lookAt(this.target);
    this.scene.add(this.instance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.target.copy(this.target);
    this.controls.update();
  }

  // F toggles fly mode, WASD move, E/Space up, Q/C down, Shift sprint, wheel = speed
  setFlyControls() {
    this.fly = new PointerLockControls(this.instance, this.canvas);
    this.fly.pointerSpeed = this.options.pointerSpeed;

    this.keys = new Set();
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.fly.addEventListener("lock", () => {
      this.controls.enabled = false;
      this.velocity.set(0, 0, 0);
    });

    this.fly.addEventListener("unlock", () => {
      this.keys.clear();
      // orbit around whatever is in front of the camera now
      this.instance.getWorldDirection(this.direction);
      this.target
        .copy(this.instance.position)
        .addScaledVector(this.direction, 50);
      this.controls.target.copy(this.target);
      this.controls.enabled = true;
      this.controls.update();
    });

    this.onKeyDown = (event) => {
      // leave keys alone while typing in tweakpane inputs
      if (event.target instanceof HTMLInputElement) return;

      if (event.code === "KeyF" && !event.repeat) {
        if (this.fly.isLocked) this.fly.unlock();
        else this.fly.lock();
      } else if (this.fly.isLocked) {
        this.keys.add(event.code);
      }
    };

    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
    };

    this.onWheel = (event) => {
      if (!this.fly.isLocked) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      this.options.speed = THREE.MathUtils.clamp(
        this.options.speed * factor,
        1,
        500,
      );
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  setDebug() {
    if (!this.debug.active) return;

    this.debugFolder = this.debug.ui.addFolder({
      title: "Camera",
      expanded: false,
    });

    const pointSettings = (label) => ({
      label,
      x: { step: 0.01 },
      y: { step: 0.01 },
      z: { step: 0.01 },
    });

    this.debugFolder
      .addBinding(this.instance, "position", pointSettings("pos"))
      .on("change", () => {
        if (!this.fly.isLocked) this.controls.update();
      });

    this.debugFolder
      .addBinding(this, "target", pointSettings("look"))
      .on("change", () => {
        this.controls.target.copy(this.target);
        if (this.fly.isLocked) this.instance.lookAt(this.target);
        else this.controls.update();
      });

    this.debugFolder
      .addBinding(this.instance, "fov", { min: 20, max: 120, step: 1 })
      .on("change", () => this.instance.updateProjectionMatrix());

    this.debugFolder
      .addBinding(this.instance, "far", { min: 10, max: 2000, step: 10 })
      .on("change", () => this.instance.updateProjectionMatrix());

    const range = (min, max, step) => ({ min, max, step });
    this.debugFolder.addBinding(this.options, "speed", range(1, 500, 1));
    this.debugFolder.addBinding(this.options, "sprint", range(1, 20, 0.5));
    this.debugFolder.addBinding(this.options, "damping", range(1, 40, 1));
    this.debugFolder
      .addBinding(this.options, "pointerSpeed", {
        label: "mouse",
        min: 0.1,
        max: 2,
        step: 0.05,
      })
      .on("change", (event) => (this.fly.pointerSpeed = event.value));

    this.debugFolder
      .addButton({ title: "Fly mode (F)" })
      .on("click", () => this.fly.lock());

    this.debugFolder.addButton({ title: "Copy setup" }).on("click", () => {
      const format = (vector) =>
        `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`;
      const snippet = `this.target = new THREE.Vector3(${format(this.target)});\nthis.instance.position.set(${format(this.instance.position)});`;
      navigator.clipboard?.writeText(snippet);
      console.log(snippet);
    });
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  axis(positiveKeys, negativeKeys) {
    const isPressed = (code) => this.keys.has(code);
    return (
      (positiveKeys.some(isPressed) ? 1 : 0) -
      (negativeKeys.some(isPressed) ? 1 : 0)
    );
  }

  updateFly(deltaSeconds) {
    const sprinting = this.axis(["ShiftLeft", "ShiftRight"], []) > 0;
    const speed = this.options.speed * (sprinting ? this.options.sprint : 1);

    const forward = this.axis(["KeyW"], ["KeyS"]);
    const strafe = this.axis(["KeyD"], ["KeyA"]);
    const rise = this.axis(["Space", "KeyE"], ["KeyC", "KeyQ"]);

    // move along the camera's own axes, so looking down and pushing forward dives
    this.direction
      .set(strafe, 0, -forward)
      .applyQuaternion(this.instance.quaternion);
    this.direction.y += rise;
    if (this.direction.lengthSq() > 0) this.direction.normalize();

    // smooth start and stop, same feel at any frame rate
    const blend = 1 - Math.exp(-this.options.damping * deltaSeconds);
    this.velocity.lerp(this.direction.multiplyScalar(speed), blend);

    this.instance.position.addScaledVector(this.velocity, deltaSeconds);
  }

  update() {
    // capped so a frozen tab doesn't teleport the camera
    const deltaSeconds = Math.min(this.time.delta / 1000, 0.1);

    if (this.fly.isLocked) {
      this.updateFly(deltaSeconds);
      this.debugFolder?.refresh();
    } else {
      this.controls.update();
    }

    const position = this.instance.position;
    position.y = Math.min(position.y, this.options.maxHeight);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.fly.dispose();
    this.controls.dispose();
  }
}
