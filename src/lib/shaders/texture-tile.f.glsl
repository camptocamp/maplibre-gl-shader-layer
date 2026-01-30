precision highp float;
precision highp int;

uniform sampler2D u_tex;
uniform float u_opacity;
in vec2 v_uv;
out vec4 fragColor;

void main()  {
  fragColor = texture(u_tex, v_uv);
  fragColor.a *= u_opacity;
}