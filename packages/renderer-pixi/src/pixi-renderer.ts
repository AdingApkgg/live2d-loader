import type {
  IRenderer,
  IModelRenderer,
  DrawableMesh,
  TextureData,
  BlendMode,
} from '@live2d-loader/core';
import { Application, Container, Mesh, MeshGeometry, Texture, ImageSource } from 'pixi.js';

/**
 * PixiJS 8 renderer implementation.
 * Each model is represented as a Container of Mesh children.
 */
export class PixiRenderer implements IRenderer {
  private app: Application | null = null;
  private stage: Container | null = null;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      width: canvas.width,
      height: canvas.height,
    });

    this.stage = this.app.stage;
  }

  createModelRenderer(): IModelRenderer {
    if (!this.app || !this.stage) {
      throw new Error('[PixiRenderer] Not initialized.');
    }
    const container = new Container();
    this.stage.addChild(container);
    return new PixiModelRenderer(container);
  }

  beginFrame(): void {
    // PixiJS handles frame management internally via its ticker
  }

  endFrame(): void {
    if (this.app) {
      this.app.render();
    }
  }

  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
    }
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
      this.stage = null;
    }
  }
}

class PixiModelRenderer implements IModelRenderer {
  private textures: Texture[] = [];
  private meshPool: Mesh[] = [];

  constructor(private container: Container) {}

  setTextures(textures: TextureData[]): void {
    this.textures = textures.map((tex) => {
      const source = new ImageSource({ resource: tex.image });
      return new Texture({ source });
    });
  }

  draw(drawables: DrawableMesh[], _modelMatrix: Float32Array): void {
    // Remove old meshes beyond what we need
    while (this.container.children.length > drawables.length) {
      const child = this.container.removeChildAt(this.container.children.length - 1);
      if (child instanceof Mesh) {
        child.destroy();
      }
    }

    for (let i = 0; i < drawables.length; i++) {
      const d = drawables[i]!;

      if (!d.visible || d.opacity < 0.001) {
        if (i < this.container.children.length) {
          this.container.children[i]!.visible = false;
        }
        continue;
      }

      const texture = this.textures[d.textureIndex];
      if (!texture) continue;

      const geometry = new MeshGeometry({
        positions: d.vertexPositions,
        uvs: d.uvs,
        indices: new Uint32Array(d.indices),
        topology: 'triangle-list',
      });

      let mesh: Mesh;
      if (i < this.meshPool.length) {
        mesh = this.meshPool[i]!;
        mesh.geometry = geometry;
        mesh.texture = texture;
      } else {
        mesh = new Mesh({ geometry, texture });
        this.meshPool.push(mesh);
        this.container.addChild(mesh);
      }

      mesh.visible = true;
      mesh.alpha = d.opacity;

      switch (d.blendMode as BlendMode) {
        case 1: // Additive
          mesh.blendMode = 'add';
          break;
        case 2: // Multiplicative
          mesh.blendMode = 'multiply';
          break;
        default:
          mesh.blendMode = 'normal';
          break;
      }
    }
  }

  destroy(): void {
    for (const mesh of this.meshPool) {
      mesh.destroy();
    }
    this.meshPool = [];

    for (const tex of this.textures) {
      tex.destroy(true);
    }
    this.textures = [];

    this.container.destroy({ children: true });
  }
}
