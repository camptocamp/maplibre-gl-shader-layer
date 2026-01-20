precision highp float;
precision highp int;

uniform sampler2D tex;
uniform float opacity;
in vec2 v_uv;
out vec4 fragColor;

void main()  {
  fragColor = texture(tex, v_uv);
  fragColor.a *= opacity;
}