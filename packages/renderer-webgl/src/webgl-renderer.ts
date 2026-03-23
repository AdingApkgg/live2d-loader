import type {
  IRenderer,
  IModelRenderer,
  DrawableMesh,
  TextureData,
  BlendMode,
} from '@live2d-loader/core';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js';

export class WebGLRenderer implements IRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private projectionMatrix = new Float32Array(16);

  private locations: {
    aPosition: number;
    aTexCoord: number;
    uModelMatrix: WebGLUniformLocation;
    uProjectionMatrix: WebGLUniformLocation;
    uTexture: WebGLUniformLocation;
    uOpacity: WebGLUniformLocation;
  } | null = null;

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });

    if (!gl) {
      throw new Error('[WebGLRenderer] WebGL2 is not supported.');
    }

    this.gl = gl;
    this.program = this.createShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

    this.locations = {
      aPosition: gl.getAttribLocation(this.program, 'a_position'),
      aTexCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
      uModelMatrix: gl.getUniformLocation(this.program, 'u_modelMatrix')!,
      uProjectionMatrix: gl.getUniformLocation(this.program, 'u_projectionMatrix')!,
      uTexture: gl.getUniformLocation(this.program, 'u_texture')!,
      uOpacity: gl.getUniformLocation(this.program, 'u_opacity')!,
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.updateProjection();
  }

  createModelRenderer(): IModelRenderer {
    if (!this.gl || !this.program || !this.locations) {
      throw new Error('[WebGLRenderer] Not initialized. Call initialize() first.');
    }
    return new WebGLModelRenderer(this.gl, this.program, this.locations, this.projectionMatrix);
  }

  beginFrame(): void {
    const gl = this.gl;
    if (!gl || !this.canvas) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  endFrame(): void {
    const gl = this.gl;
    if (!gl) return;
    gl.flush();
  }

  resize(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.updateProjection();
  }

  getGL(): WebGL2RenderingContext | null {
    return this.gl;
  }

  destroy(): void {
    const gl = this.gl;
    if (gl && this.program) {
      gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.canvas = null;
    this.program = null;
    this.locations = null;
  }

  private updateProjection(): void {
    // Orthographic projection: maps [-1, 1] range to viewport
    identity4(this.projectionMatrix);
  }

  private createShaderProgram(
    gl: WebGL2RenderingContext,
    vertSrc: string,
    fragSrc: string,
  ): WebGLProgram {
    const vert = this.compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`[WebGLRenderer] Shader program link failed: ${info}`);
    }

    gl.deleteShader(vert);
    gl.deleteShader(frag);

    return program;
  }

  private compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`[WebGLRenderer] Shader compile failed: ${info}`);
    }

    return shader;
  }
}

class WebGLModelRenderer implements IModelRenderer {
  private textures: WebGLTexture[] = [];
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;

  constructor(
    private gl: WebGL2RenderingContext,
    private program: WebGLProgram,
    private locations: {
      aPosition: number;
      aTexCoord: number;
      uModelMatrix: WebGLUniformLocation;
      uProjectionMatrix: WebGLUniformLocation;
      uTexture: WebGLUniformLocation;
      uOpacity: WebGLUniformLocation;
    },
    private projectionMatrix: Float32Array,
  ) {
    this.vao = gl.createVertexArray();
    this.positionBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
  }

  setTextures(textures: TextureData[]): void {
    const gl = this.gl;

    for (const old of this.textures) {
      gl.deleteTexture(old);
    }
    this.textures = [];

    for (const tex of textures) {
      const glTex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, glTex);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
      gl.generateMipmap(gl.TEXTURE_2D);

      this.textures.push(glTex);
    }
  }

  draw(drawables: DrawableMesh[], modelMatrix: Float32Array): void {
    const gl = this.gl;
    const loc = this.locations;

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(loc.uProjectionMatrix, false, this.projectionMatrix);
    gl.uniformMatrix4fv(loc.uModelMatrix, false, modelMatrix);

    for (const mesh of drawables) {
      if (!mesh.visible || mesh.opacity < 0.001) continue;
      if (!mesh.vertexPositions || mesh.vertexPositions.length === 0) continue;

      this.applyBlendMode(mesh.blendMode as BlendMode);

      // Bind texture
      const tex = this.textures[mesh.textureIndex];
      if (tex) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(loc.uTexture, 0);
      }

      gl.uniform1f(loc.uOpacity, mesh.opacity);

      // Upload vertex data
      gl.bindVertexArray(this.vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexPositions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(loc.aPosition);
      gl.vertexAttribPointer(loc.aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(loc.aTexCoord);
      gl.vertexAttribPointer(loc.aTexCoord, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);

      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);

      gl.bindVertexArray(null);
    }
  }

  destroy(): void {
    const gl = this.gl;

    for (const tex of this.textures) {
      gl.deleteTexture(tex);
    }
    this.textures = [];

    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
  }

  private applyBlendMode(mode: BlendMode): void {
    const gl = this.gl;
    switch (mode) {
      case 1: // Additive
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        break;
      case 2: // Multiplicative
        gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
        break;
      default: // Normal
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        break;
    }
  }
}

function identity4(out: Float32Array): Float32Array {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
