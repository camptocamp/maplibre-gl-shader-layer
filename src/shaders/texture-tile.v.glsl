precision highp float;
precision highp int;

#define PI 3.14159265359

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional
uniform vec3 tileIndex; // tile index
uniform bool isGlobe;

// Both position and vPosition are in [-0.5., 0.5.]
in vec3 position;
in vec2 uv;

// This vPositionUnit is in [0., 1.] to make it easier to map textures
out vec2 vPositionUnit;


vec2 getMercatorCoords(vec2 uv, vec3 tileIndex) {
  float scale = 1.0 / float(1 << int(tileIndex.z));
  return vec2(
    uv.x * scale + tileIndex.x * scale,
    uv.y * scale + tileIndex.y * scale
  );
}

vec3 projectTileCoordinatesToSphere(vec2 uv, vec3 tileIndex) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  float sphericalX = mod(mercator.x * PI * 2.0 + PI, PI * 2.0);
  float sphericalY = 2.0 * atan(exp(PI - (mercator.y * PI * 2.0))) - PI * 0.5;
  float len = cos(sphericalY);
  return vec3(
    sin(sphericalX) * len,
    sin(sphericalY),
    cos(sphericalX) * len
  );
}

vec3 projectTileCoordinatesToMercator(vec2 uv, vec3 tileIndex) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  return vec3(mercator.x, mercator.y, 0.);
}

void main()	{
  vPositionUnit = position.xy + 0.5;
 
  // Place the vertices of the tile planes (subdivided in many triangles)
  // directly in shader using the UV from ThreeJS
  vec3 worldPos = isGlobe ? projectTileCoordinatesToSphere(uv, tileIndex) : projectTileCoordinatesToMercator(uv, tileIndex);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( worldPos, 1.0 );
}


