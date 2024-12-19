precision highp float;
precision highp int;

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional

// Both position and vPosition are in [-0.5., 0.5.]
in vec3 position;
in vec3 globe_pos_world;

// This vPositionUnit is in [0., 1.] to make it easier to map textures
out vec2 vPositionUnit;

void main()	{
  vPositionUnit = position.xy + 0.5;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( globe_pos_world, 1.0 );
}