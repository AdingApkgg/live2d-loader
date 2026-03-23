# Angular

## Install

```bash
npm install @live2d-loader/core @live2d-loader/element @live2d-loader/renderer-webgl @live2d-loader/adapter-cubism2
```

## Configure Angular to Recognize Custom Elements

Add `CUSTOM_ELEMENTS_SCHEMA` to your module or standalone component so Angular doesn't reject unknown element tags.

### Module-based (`app.module.ts`)

```ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Standalone component

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-live2d',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `...`,
})
export class Live2DComponent {}
```

## Web Component Usage

```ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import '@live2d-loader/element';
import type { Live2DModelElement } from '@live2d-loader/element';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

@Component({
  selector: 'app-live2d',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <live2d-model
      #modelEl
      [attr.src]="src"
      [attr.width]="300"
      [attr.height]="400"
      (load)="onLoad($event)"
    ></live2d-model>
  `,
})
export class Live2DComponent implements AfterViewInit {
  @ViewChild('modelEl') modelEl!: ElementRef<Live2DModelElement>;
  src = 'https://cdn.example.com/model/index.json';

  ngAfterViewInit() {
    this.modelEl.nativeElement.configure({
      adapters: [new Cubism2Adapter()],
    });
  }

  onLoad(e: Event) {
    console.log('Model loaded:', (e as CustomEvent).detail.modelId);
  }
}
```

## Core API Usage

```ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { createLive2DLoader } from '@live2d-loader/core';
import { WebGLRenderer } from '@live2d-loader/renderer-webgl';
import { Cubism2Adapter } from '@live2d-loader/adapter-cubism2';

@Component({
  selector: 'app-live2d-canvas',
  standalone: true,
  template: `<canvas #canvas width="300" height="400"></canvas>`,
})
export class Live2DCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private loader?: ReturnType<typeof createLive2DLoader>;

  async ngAfterViewInit() {
    this.loader = createLive2DLoader({
      adapters: [new Cubism2Adapter()],
      renderer: new WebGLRenderer(),
    });

    this.loader.mount(this.canvasRef.nativeElement);
    await this.loader.loadModel('https://cdn.example.com/model/index.json');
  }

  ngOnDestroy() {
    this.loader?.destroy();
  }
}
```

## Notes

- `CUSTOM_ELEMENTS_SCHEMA` is required so Angular doesn't throw errors for `<live2d-model>`.
- Use `[attr.src]` for attribute binding on custom elements.
- For Angular SSR (`@angular/ssr`), guard the component with `isPlatformBrowser` check.
