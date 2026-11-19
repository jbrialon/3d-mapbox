import * as THREE from "three/webgpu";
import {
  Fn,
  float,
  int,
  ivec2,
  positionLocal,
  texture,
  textureLoad,
  uv,
  vec3,
} from "three/tsl";

export function createTerrainMaterial({
  heightTexture,
  satelliteTexture,
  size,
  metersToWorld,
  exaggeration,
}) {
  const lastTexel = size - 1;

  // Vertex shader
  const vertexShader = Fn(() => {
    // Each point of the grid has its own pixel in the height image, row 0 is the north edge
    const texelX = int(uv().x.mul(lastTexel).round());
    const texelY = int(float(1).sub(uv().y).mul(lastTexel).round());

    // Read that exact pixel, any blending with its neighbors would scramble the height
    const pixel = textureLoad(heightTexture, ivec2(texelX, texelY))
      .rgb.mul(255)
      .round();

    // Mapbox hides the height in meters inside the red, green and blue values
    // height = -10000 + ((R × 256 × 256 + G × 256 + B) × 0.1), same as decodeHeight in heights.js
    const elevation = pixel.r
      .mul(65536)
      .add(pixel.g.mul(256))
      .add(pixel.b)
      .mul(0.1)
      .sub(10000);

    // Turn meters into scene units and lift the point by that much
    const lift = elevation.mul(exaggeration).mul(metersToWorld);
    return positionLocal.add(vec3(0, lift, 0));
  });

  // Fragment shader
  const fragmentShader = Fn(() => {
    return texture(satelliteTexture, uv());
  });

  const material = new THREE.MeshBasicNodeMaterial();
  material.positionNode = vertexShader();
  material.colorNode = fragmentShader();

  return material;
}
