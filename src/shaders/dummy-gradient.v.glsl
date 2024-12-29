precision highp float;
precision highp int;

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional

// Both position and vPosition are in [-0.5., 0.5.]
in vec3 position;
out vec3 vPosition;

// This vPositionUnit is in [0., 1.] to make it easier to map textures
out vec3 vPositionUnit;


void main()	{
  vPosition = position;
  vPositionUnit = position + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}