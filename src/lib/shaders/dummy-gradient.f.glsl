precision highp float;
precision highp int;

uniform float zoom;
in vec3 vPosition;
in vec2 vPositionUnit;
out vec4 fragColor;

void main()  {
  vec2 tileCenter = vec2(0.5, 0.5);
  float distanceToCenter = sqrt(pow(vPositionUnit.x - tileCenter.x, 2.) + pow(vPositionUnit.y - tileCenter.y, 2.));

  fragColor = vec4(vPositionUnit.x, vPositionUnit.y, 1., 0.6);

	float radius = fract(zoom + 0.5) / 2.;

  if (distanceToCenter < radius) {
    fragColor.a = 0.0;
  }
}