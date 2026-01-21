precision highp float;
precision highp int;

#define PI 3.14159265359
#define EARTH_RADIUS 6371008.8

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 u_tileIndex;
uniform bool u_isGlobe;
uniform bool u_relativeTilePosition;
uniform float u_altitude;

in vec3 position;
in vec2 uv;

// This v_uv is in [0., 1.] to make it easier to map textures
out vec2 v_uv;

// Longitude / latitude in degrees: (lon, lat)
out highp vec2 v_lonLat;

vec2 mercatorToLonLat(vec2 mercator) {
  float y = mercator.y;
  float lon = mercator.x * 360.0 - 180.0;  // degrees
  float lat = (2.0 * atan(exp(PI - 2.0 * PI * y)) - PI * 0.5) * 180.0 / PI;  // degrees
  return vec2(lon, lat);
}


vec2 getMercatorCoords(vec2 uv, vec3 u_tileIndex) {
  float scale = 1.0 / float(1 << int(u_tileIndex.z));
  return vec2(
    uv.x * scale + u_tileIndex.x * scale,
    uv.y * scale + u_tileIndex.y * scale
  );
}

vec3 projectTileCoordinatesToSphere(vec2 uv, vec3 u_tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, u_tileIndex);
  lonLat = mercatorToLonLat(mercator);
  float sphericalX = mod(mercator.x * PI * 2.0 + PI, PI * 2.0);
  float sphericalY = 2.0 * atan(exp(PI - (mercator.y * PI * 2.0))) - PI * 0.5;
  float len = cos(sphericalY);

  // Add a small offset to make the vertices float above the surface
  float u_altitudeUnit = u_altitude / EARTH_RADIUS;
  return vec3(
    sin(sphericalX) * len * (1.0 + u_altitudeUnit),
    sin(sphericalY) * (1.0 + u_altitudeUnit),
    cos(sphericalX) * len * (1.0 + u_altitudeUnit)
  );
}

vec3 projectTileCoordinatesToMercator(vec2 uv, vec3 u_tileIndex, out vec2 lonLat) {
  vec2 mercator = getMercatorCoords(uv, u_tileIndex);
  lonLat = mercatorToLonLat(mercator);
  // Add a small offset to make the vertices float above the surface
  float u_altitudeUnit =  u_altitude / EARTH_RADIUS / (2. * PI);
  return vec3(mercator.x, mercator.y, u_altitudeUnit);
}

void main()	{
  v_uv = uv;
  vec2 lonLat;

  if (u_relativeTilePosition) {
    projectTileCoordinatesToMercator(uv, u_tileIndex, lonLat);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  } else {
    // Place the vertices of the tile planes (subdivided in many triangles)
    // directly in shader using the UV from ThreeJS
    vec3 worldPos = u_isGlobe ? projectTileCoordinatesToSphere(uv, u_tileIndex, lonLat) : projectTileCoordinatesToMercator(uv, u_tileIndex, lonLat);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4( worldPos, 1.0 );
  }

  v_lonLat = lonLat;
}


