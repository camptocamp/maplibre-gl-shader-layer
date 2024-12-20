precision highp float;
precision highp int;

#define PI 3.14159265359

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional
uniform vec3 tileIndex; // tile index

// Both position and vPosition are in [-0.5., 0.5.]
in vec3 position;
in vec3 globe_pos_world;
in vec2 uv;

// This vPositionUnit is in [0., 1.] to make it easier to map textures
out vec2 vPositionUnit;


vec3 projectTileCoordinatesToSphereUV(vec2 uv, vec3 tileIndex) {
  float scale = 1.0 / float(1 << int(tileIndex.z));
  float mercatorX = uv.x * scale + tileIndex.x * scale;
  float mercatorY = uv.y * scale + tileIndex.y * scale;
  float sphericalX = mod(mercatorX * PI * 2.0 + PI, PI * 2.0);
  float sphericalY = 2.0 * atan(exp(PI - (mercatorY * PI * 2.0))) - PI * 0.5;
  float len = cos(sphericalY);
  return vec3(
    sin(sphericalX) * len,
    sin(sphericalY),
    cos(sphericalX) * len
  );
}

void main()	{
  vPositionUnit = position.xy + 0.5;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); // the mercator way
 
  // The globe way
  vec3 globeWorldPos = projectTileCoordinatesToSphereUV(uv, tileIndex);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( globeWorldPos, 1.0 );
}


