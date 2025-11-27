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

// Longitude / latitude in radians: (lon, lat)
out highp vec2 vLonLat;


vec2 mercatorToLonLat(vec2 mercator) {
  float y = mercator.y;
  float lon = mercator.x * 360.0 - 180.0;  // degrees
  float lat = (2.0 * atan(exp(PI - 2.0 * PI * y)) - PI * 0.5) * 180.0 / PI;  // degrees
  return vec2(lon, lat);
}


vec2 getMercatorCoords(vec2 uv, vec3 tileIndex) {
  float scale = 1.0 / float(1 << int(tileIndex.z));
  return vec2(
    uv.x * scale + tileIndex.x * scale,
    uv.y * scale + tileIndex.y * scale
  );
}

vec3 projectTileCoordinatesToSphere(vec2 uv, vec3 tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  lonLat = mercatorToLonLat(mercator);
  float sphericalX = mod(mercator.x * PI * 2.0 + PI, PI * 2.0);
  float sphericalY = 2.0 * atan(exp(PI - (mercator.y * PI * 2.0))) - PI * 0.5;
  float len = cos(sphericalY);
  return vec3(
    sin(sphericalX) * len,
    sin(sphericalY),
    cos(sphericalX) * len
  );
}

vec3 projectTileCoordinatesToMercator(vec2 uv, vec3 tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, tileIndex);
  lonLat = mercatorToLonLat(mercator);
  return vec3(mercator.x, mercator.y, 0.);
}

void main()	{
  vPositionUnit = position.xy + 0.5;
  vec2 lonLat;
 
  // Place the vertices of the tile planes (subdivided in many triangles)
  // directly in shader using the UV from ThreeJS
  vec3 worldPos = isGlobe ? projectTileCoordinatesToSphere(uv, tileIndex, lonLat) : projectTileCoordinatesToMercator(uv, tileIndex, lonLat);
  vLonLat = lonLat;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( worldPos, 1.0 );
}


