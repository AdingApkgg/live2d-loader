/** All events emitted by the Live2D loader system */
export interface Live2DEventMap {
  /** Model loading progress */
  'load:start': { source: string };
  'load:progress': { stage: LoadStage; progress: number; total: number };
  'load:complete': { modelId: string };
  'load:error': { source: string; error: Error };

  /** Model lifecycle */
  'model:ready': { modelId: string };
  'model:destroy': { modelId: string };

  /** Interaction */
  hit: { modelId: string; hitArea: string; x: number; y: number };
  'pointer:enter': { modelId: string };
  'pointer:leave': { modelId: string };

  /** Motion / Expression */
  'motion:start': { modelId: string; group: string; index: number };
  'motion:end': { modelId: string; group: string; index: number };
  'expression:set': { modelId: string; name: string };

  /** Renderer */
  'render:frame': { deltaTime: number };
  'render:error': { error: Error };
}

export type Live2DEventName = keyof Live2DEventMap;

/** Loading pipeline stages */
export type LoadStage =
  | 'resolve'
  | 'fetch-json'
  | 'detect-version'
  | 'load-core'
  | 'load-moc'
  | 'load-textures'
  | 'load-motions'
  | 'load-physics'
  | 'create-model';
