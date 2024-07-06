precision highp float;
precision highp int;

uniform mat4 modelViewMatrix; // optional
uniform mat4 projectionMatrix; // optional

uniform mat4 basicProjMatrix;
uniform mat4 highProjMatrix;
uniform mat4 lowProjMatrix;

attribute vec3 position;

varying vec3 vPosition;


void main()	{
  vPosition = position;

//   mat4 myMatrix = mat4(
//     1.0, 0.0, 0.0, 0.0, // Column 1
//     0.0, 1.0, 0.0, 0.0, // Column 2
//     0.0, 0.0, 1.0, 0.0, // Column 3
//     0.0, 0.0, 0.0, 1.0  // Column 4
// );

  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  // vec4 posSpace = modelViewMatrix * vec4( position, 1.0 );
  // gl_Position = projectionMatrix * posSpace;


  // vec4 posSpace = modelViewMatrix * vec4( position, 1.0 );
  // gl_Position = basicProjMatrix * posSpace;


  vec4 posSpace = modelViewMatrix * vec4( position, 1.0 );

  vec4 highPosition = highProjMatrix * posSpace;
  vec4 lowPosition = lowProjMatrix * posSpace;
  gl_Position = highPosition + lowPosition;


}