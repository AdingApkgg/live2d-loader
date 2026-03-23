import type {
  ICubismAdapter,
  CubismVersion,
  ModelSettings,
  InternalModel,
  InternalModelOptions,
  DrawableMesh,
} from '@live2d-loader/core';

declare global {
  interface Window {
    Live2D?: Live2DNamespace;
    Live2DModelWebGL?: Live2DModelWebGLConstructor;
  }
}

interface Live2DNamespace {
  init(): void;
  dispose(): void;
  setGL(gl: WebGLRenderingContext): void;
}

interface Live2DModelWebGLConstructor {
  loadModel(buf: ArrayBuffer): Live2DCubism2Model;
}

interface Live2DCubism2Model {
  setTexture(index: number, texture: WebGLTexture): void;
  setGL(gl: WebGLRenderingContext): void;
  setMatrix(matrix: number[] | Float32Array): void;
  setParamFloat(id: string, value: number, weight?: number): void;
  getParamFloat(id: string): number;
  addToParamFloat(id: string, value: number, weight?: number): void;
  saveParam(): void;
  loadParam(): void;
  getCanvasWidth(): number;
  getCanvasHeight(): number;
  getDrawDataCount(): number;
  getDrawDataIndex(id: string): number;
  getTransformedPoints(index: number): Float32Array;
  getIndexArray(index: number): Uint16Array;
  getUvArray(index: number): Float32Array;
  getDrawDataTextureNo(index: number): number;
  getDrawDataOpacity(index: number): number;
  getDrawDataOrder(index: number): number;
  update(): void;
  draw(): void;
}

const DEFAULT_CUBISM2_CORE_PATH =
  'https://cdn.jsdelivr.net/npm/live2d-widgets@1.0.0/dist/live2d.min.js';

export class Cubism2Adapter implements ICubismAdapter {
  readonly version: CubismVersion = 'cubism2';
  readonly defaultCorePath = DEFAULT_CUBISM2_CORE_PATH;

  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private cubism2Matrix: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  private startTime = performance.now();
  private eyeBlinkTimer = 0;
  private nextBlinkTime = 2 + Math.random() * 3;

  isCoreLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.Live2D;
  }

  async loadCore(corePath?: string): Promise<void> {
    if (this.isCoreLoaded()) return;

    const url = corePath ?? this.defaultCorePath;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        if (this.isCoreLoaded()) {
          resolve();
        } else {
          reject(
            new Error('[Cubism2Adapter] Core script loaded but Live2D not found in global scope.'),
          );
        }
      };
      script.onerror = () =>
        reject(new Error(`[Cubism2Adapter] Failed to load Cubism 2 Core from: ${url}`));
      document.head.appendChild(script);
    });
  }

  canHandle(json: unknown): boolean {
    if (typeof json !== 'object' || json === null) return false;
    return 'model' in json && !('FileReferences' in json);
  }

  async createModel(
    settings: ModelSettings,
    options?: InternalModelOptions,
  ): Promise<InternalModel> {
    if (!window.Live2D || !window.Live2DModelWebGL) {
      throw new Error('[Cubism2Adapter] Live2D / Live2DModelWebGL is not available.');
    }

    const gl = options?.gl;
    if (!gl) {
      throw new Error(
        '[Cubism2Adapter] WebGL context is required for Cubism 2 models. ' +
          'Ensure the renderer exposes getGL().',
      );
    }

    this.gl = gl;
    window.Live2D.setGL(gl as WebGLRenderingContext);

    const mocResponse = await fetch(settings.moc);
    if (!mocResponse.ok) {
      throw new Error(`[Cubism2Adapter] Failed to fetch .moc file: ${settings.moc}`);
    }
    const mocBuffer = await mocResponse.arrayBuffer();

    const coreModel = window.Live2DModelWebGL.loadModel(mocBuffer);
    coreModel.setGL(gl as WebGLRenderingContext);
    coreModel.saveParam();

    const cw = coreModel.getCanvasWidth();
    const ch = coreModel.getCanvasHeight();

    // Build a 4x4 column-major matrix that maps model pixel coords → clip space.
    // Same logic as L2DModelMatrix: setWidth(2) + setCenterPosition(0, 0)
    const sx = 2 / cw;
    const sy = -sx; // negative to flip Y, maintain aspect ratio based on width
    const tx = -1; // shift so left edge is at clip x = -1
    const ty = (-sy * ch) / 2; // center vertically

    // Column-major 4x4
    const mat = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1];

    // Apply layout overrides from model JSON
    const layout = settings.layout;
    if (layout) {
      if (layout.width != null) {
        const s = layout.width / cw;
        mat[0] = s;
        mat[5] = -s;
      }
      if (layout.height != null) {
        const s = layout.height / ch;
        mat[0] = s;
        mat[5] = -s;
      }
      // Recalculate translation after scale changes
      const curSx = mat[0];
      const curSy = mat[5];
      // Default: center at (0, 0)
      mat[12] = -(cw * curSx) / 2;
      mat[13] = -(ch * curSy) / 2;

      if (layout.center_x != null) mat[12] = layout.center_x - (cw * curSx) / 2;
      if (layout.center_y != null) mat[13] = layout.center_y - (ch * curSy) / 2;
      if (layout.x != null) mat[12] = layout.x;
      if (layout.y != null) mat[13] = layout.y;
    }

    this.cubism2Matrix = mat;

    const modelMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    return {
      id: '',
      version: 'cubism2',
      settings,
      coreModel,
      textures: [],
      modelMatrix,
      ready: false,
    };
  }

  setupTextures(model: InternalModel, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    const cm = model.coreModel as Live2DCubism2Model;

    for (let i = 0; i < model.textures.length; i++) {
      const img = model.textures[i]!.image;
      const tex = gl.createTexture()!;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);

      cm.setTexture(i, tex);
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  }

  updateModel(model: InternalModel, deltaTime: number): void {
    const cm = model.coreModel as Live2DCubism2Model;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const t = elapsed * 2 * Math.PI;

    cm.loadParam();

    // Eye blink
    this.eyeBlinkTimer += deltaTime;
    let eyeOpen = 1;
    if (this.eyeBlinkTimer >= this.nextBlinkTime) {
      const blinkPhase = this.eyeBlinkTimer - this.nextBlinkTime;
      if (blinkPhase < 0.06) {
        eyeOpen = 1 - blinkPhase / 0.06;
      } else if (blinkPhase < 0.12) {
        eyeOpen = (blinkPhase - 0.06) / 0.06;
      } else {
        this.eyeBlinkTimer = 0;
        this.nextBlinkTime = 2 + Math.random() * 4;
        eyeOpen = 1;
      }
    }
    cm.setParamFloat('PARAM_EYE_L_OPEN', eyeOpen);
    cm.setParamFloat('PARAM_EYE_R_OPEN', eyeOpen);

    cm.saveParam();

    // Idle head/body sway
    cm.addToParamFloat('PARAM_ANGLE_X', 15 * Math.sin(t / 6.5345), 0.5);
    cm.addToParamFloat('PARAM_ANGLE_Y', 8 * Math.sin(t / 3.5345), 0.5);
    cm.addToParamFloat('PARAM_ANGLE_Z', 10 * Math.sin(t / 5.5345), 0.5);
    cm.addToParamFloat('PARAM_BODY_ANGLE_X', 4 * Math.sin(t / 15.5345), 0.5);

    // Breathing
    cm.setParamFloat('PARAM_BREATH', 0.5 + 0.5 * Math.sin(t / 3.2345));

    cm.update();
  }

  drawModel(model: InternalModel): boolean {
    const cm = model.coreModel as Live2DCubism2Model;
    const gl = this.gl;
    if (!gl || !window.Live2D) return false;

    const gl2 = gl as WebGL2RenderingContext;
    if (gl2.bindVertexArray) gl2.bindVertexArray(null);
    gl.useProgram(null);

    for (let i = 0; i < 8; i++) {
      gl.disableVertexAttribArray(i);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);

    window.Live2D.setGL(gl as WebGLRenderingContext);
    cm.setGL(gl as WebGLRenderingContext);
    cm.setMatrix(this.cubism2Matrix);
    cm.draw();

    return true;
  }

  getDrawables(_model: InternalModel): DrawableMesh[] {
    // Cubism 2 uses self-rendering via drawModel(), so this is unused
    return [];
  }

  hitTest(model: InternalModel, x: number, y: number): string | null {
    const settings = model.settings;
    if (!settings.hitAreas || settings.hitAreas.length === 0) return null;

    const cm = model.coreModel as Live2DCubism2Model;

    for (const area of settings.hitAreas) {
      const drawIndex = cm.getDrawDataIndex(area.id);
      if (drawIndex < 0) continue;

      const vertices = cm.getTransformedPoints(drawIndex);
      if (!vertices || vertices.length === 0) continue;

      if (isPointInBounds(x, y, vertices)) {
        return area.name;
      }
    }

    return null;
  }

  destroyModel(model: InternalModel): void {
    // Cubism 2 models have no standard destroy/release API.
    // Just null the reference and let GC handle it.
    model.coreModel = null;
    model.ready = false;
  }
}

function isPointInBounds(px: number, py: number, vertices: Float32Array): boolean {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (let i = 0; i < vertices.length; i += 2) {
    const vx = vertices[i]!;
    const vy = vertices[i + 1]!;
    if (vx < minX) minX = vx;
    if (vx > maxX) maxX = vx;
    if (vy < minY) minY = vy;
    if (vy > maxY) maxY = vy;
  }

  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}
