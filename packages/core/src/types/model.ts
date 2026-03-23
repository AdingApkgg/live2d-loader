/** Supported Cubism SDK versions */
export type CubismVersion = 'cubism2' | 'cubism4' | 'cubism5';

/** Source for loading a model — URL string, JSON object, or settings instance */
export type ModelSource = string | ModelSettingsJSON | ModelSettings;

/** Raw JSON for Cubism 2 model.json */
export interface Cubism2ModelJSON {
  type?: 'Live2D Model Setting';
  name?: string;
  model: string;
  textures: string[];
  motions?: Record<string, Cubism2MotionEntry[]>;
  expressions?: Cubism2ExpressionEntry[];
  physics?: string;
  pose?: string;
  hit_areas?: Cubism2HitArea[];
  layout?: Record<string, number>;
  init_param?: Array<{ id: string; value: number }>;
  init_opacities?: Array<{ id: string; value: number }>;
}

export interface Cubism2MotionEntry {
  file: string;
  sound?: string;
  fade_in?: number;
  fade_out?: number;
}

export interface Cubism2ExpressionEntry {
  name: string;
  file: string;
}

export interface Cubism2HitArea {
  name: string;
  id: string;
}

/** Raw JSON for Cubism 3/4/5 model3.json */
export interface Cubism3ModelJSON {
  Version: number;
  FileReferences: {
    Moc: string;
    Textures: string[];
    Motions?: Record<string, Cubism3MotionEntry[]>;
    Expressions?: Cubism3ExpressionEntry[];
    Physics?: string;
    Pose?: string;
    UserData?: string;
  };
  Groups?: Cubism3Group[];
  HitAreas?: Cubism3HitArea[];
}

export interface Cubism3MotionEntry {
  File: string;
  Sound?: string;
  FadeInTime?: number;
  FadeOutTime?: number;
}

export interface Cubism3ExpressionEntry {
  Name: string;
  File: string;
}

export interface Cubism3Group {
  Target: string;
  Name: string;
  Ids: string[];
}

export interface Cubism3HitArea {
  Id: string;
  Name: string;
}

export type ModelSettingsJSON = Cubism2ModelJSON | Cubism3ModelJSON;

/**
 * Model list / catalog format used by stevenjoezhang/live2d-widget and similar.
 * Contains groups of model paths and corresponding display messages.
 */
export interface ModelListJSON {
  models: string[][];
  messages?: string[];
}

/** Normalized model settings, version-agnostic */
export interface ModelSettings {
  version: CubismVersion;
  url: string;
  name?: string;
  moc: string;
  textures: string[];
  motionGroups: Record<string, MotionDefinition[]>;
  expressions: ExpressionDefinition[];
  physics?: string;
  pose?: string;
  hitAreas: HitAreaDefinition[];
  layout?: Record<string, number>;
}

export interface MotionDefinition {
  file: string;
  sound?: string;
  fadeInTime?: number;
  fadeOutTime?: number;
}

export interface ExpressionDefinition {
  name: string;
  file: string;
}

export interface HitAreaDefinition {
  name: string;
  id: string;
}
