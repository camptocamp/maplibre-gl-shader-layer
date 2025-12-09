precision highp float;
precision highp int;

uniform sampler2D tex;
in vec2 vPositionUnit;
out vec4 fragColor;

void main()  {
  fragColor = texture(tex, vPositionUnit);
}