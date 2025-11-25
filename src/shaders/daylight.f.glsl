precision highp float;
precision highp int;

#define PI 3.141592653589793
#define RAD (PI / 180.0)

uniform float colormapRangeMin;
uniform float colormapRangeMax;
uniform sampler2D colormapTex;
uniform float date;
uniform float zoom;

uniform vec3 tileIndex;

uniform float days;
uniform float sunCoordDec;
uniform float sunCoordRa;

in vec2 vPositionUnit;
in vec2 vLonLat;
out vec4 fragColor;

// Date/time constants
const float DAY_MS = 1000.0 * 60.0 * 60.0 * 24.0;
const float J1970 = 2440588.0;
const float J2000 = 2451545.0;

// Obliquity of Earth
const float E = RAD * 23.4397;

// Convert timestamp (seconds) to Julian date
float toJulian(float timestamp) {
    float dateMs = timestamp * 1000.0;
    return dateMs / DAY_MS - 0.5 + J1970;
}

// Convert Julian date to days since J2000
float toDays(float timestamp) {
    return toJulian(timestamp) - J2000;
}

// Solar mean anomaly
float solarMeanAnomaly(float d) {
    return RAD * (357.5291 + 0.98560028 * d);
}

// Ecliptic longitude
float eclipticLongitude(float M) {
    float C = RAD * (1.9148 * sin(M) + 0.02 * sin(2.0 * M) + 0.0003 * sin(3.0 * M));
    float P = RAD * 102.9372;
    return M + C + P + PI;
}

// Right ascension
float rightAscension(float l, float b) {
    return atan(sin(l) * cos(E) - tan(b) * sin(E), cos(l));
}

// Declination
float declination(float l, float b) {
    return asin(sin(b) * cos(E) + cos(b) * sin(E) * sin(l));
}

// Sun coordinates (declination and right ascension)
void sunCoords(float d, out float dec, out float ra) {
    float M = solarMeanAnomaly(d);
    float L = eclipticLongitude(M);
    dec = declination(L, 0.0);
    ra = rightAscension(L, 0.0);
}

// Sidereal time
float siderealTime(float d, float lw) {
    return RAD * (280.16 + 360.9856235 * d) - lw;
}

// Azimuth
float azimuth(float H, float phi, float dec) {
    return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
}

// Altitude
float altitude(float H, float phi, float dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

// Main function to get sun position
// Input: vLonLat (vec2 with longitude, latitude in degrees)
//        timestamp (float in seconds since Unix epoch)
// Output: vec2(azimuth, altitude) in radians
vec2 getSunPosition(vec2 lonLat, float timestamp) {
    float lng = lonLat.x;
    float lat = lonLat.y;
    
    float lw = RAD * -lng;
    float phi = RAD * lat;
    float d = toDays(timestamp);
    
    float dec, ra;
    sunCoords(d, dec, ra);
    
    float H = siderealTime(d, lw) - ra;
    
    return vec2(
        azimuth(H, phi, dec),
        altitude(H, phi, dec)
    );
}




vec2 getSunPosition_2(vec2 lonLat) {
    float lng = lonLat.x;
    float lat = lonLat.y;
    
    float lw = RAD * -lng;
    float phi = RAD * lat;
    float d = days;
    
    float dec = sunCoordDec;
    float ra = sunCoordRa;
    
    float H = siderealTime(d, lw) - ra;
    
    return vec2(
        azimuth(H, phi, dec),
        altitude(H, phi, dec)
    );
}




vec2 tileToLonLat(vec3 tileIndex, vec2 positionUnit) {
    highp float zoom = tileIndex.z;
    highp float tileX = tileIndex.x;
    highp float tileY = tileIndex.y;
    
    // Calculate global position in [0, 1] range across all tiles at this zoom
    highp float numTiles = pow(2.0, zoom);
    highp float globalX = (tileX + positionUnit.x) / numTiles;
    highp float globalY = (tileY + positionUnit.y) / numTiles;
    
    // Convert to lon/lat (Web Mercator projection)
    highp float lon = globalX * 360.0 - 180.0;
    
    // Inverse Mercator formula for latitude
    highp float mercatorY = PI - 2.0 * PI * globalY;
    highp float lat = atan(sinh(mercatorY)) * 180.0 / PI;
    // highp float lat = (2.0 * atan(exp(mercatorY)) - PI * 0.5) * 180.0 / PI;
    // Alternative formula (equivalent):
    // highp float lat = (2.0 * atan(exp(mercatorY)) - PI * 0.5) * 180.0 / PI;
    
    return vec2(lon, lat);
}


// Scales a value from the colormap range (in real-world unit)
// to [0, 1]
float rescaleToTexture(float realWorldValue) {
  return (realWorldValue - colormapRangeMin) / (colormapRangeMax - colormapRangeMin);
}

// Looks up the colormaps color from a given real world unit
vec4 getTextureColor(float realWorldValue) {
  float unitPosition = rescaleToTexture(realWorldValue);
  return texture(colormapTex, vec2(unitPosition, 0.5));
}



void main()  {
  // vec2 sunPos = getSunPosition(vLonLat, date);
  highp vec2 lonLat = tileToLonLat(tileIndex, vPositionUnit);

  vec2 sunPos = getSunPosition_2(lonLat);


  float sunAzimuth = sunPos.x;   // in radians
  float sunAltitude = sunPos.y;  // in radians
  float azimuthDeg = sunAzimuth * 180.0 / PI;
  float altitudeDeg = sunAltitude * 180.0 / PI; // 90° is zenith, 0° is at horizon level
  fragColor = getTextureColor(altitudeDeg);

//   fragColor = vec4(lonLat.x + 45., 0., 0., 0.8);
}