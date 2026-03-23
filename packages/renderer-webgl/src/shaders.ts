export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = u_projectionMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform float u_opacity;

out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_texCoord);
  fragColor = color * u_opacity;
}
`;

export const MASK_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
  float alpha = texture(u_texture, v_texCoord).a;
  fragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;
