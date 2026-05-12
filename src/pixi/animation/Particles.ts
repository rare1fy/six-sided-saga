/**
 * Particles.ts - @pixi/particle-emitter backed particle system
 *
 * Wraps the official @pixi/particle-emitter library (v5) with the same
 * API surface that consumer files expect (ParticleEmitter class + PARTICLE_PRESETS).
 *
 * Uses the Emitter class from @pixi/particle-emitter for GPU-optimized
 * particle rendering instead of hand-rolled CPU particles.
 */
import { Container, Texture } from 'pixi.js';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';

export interface ParticleConfig {
  count: number;
  lifetime: number;
  speed: number;
  size: number;
  color: number;
  alpha?: number;
  gravity?: number;
  spread?: number;
  direction?: number;
  fadeOut?: boolean;
  shrink?: boolean;
  colors?: number[];
}

/** Convert our simplified ParticleConfig to @pixi/particle-emitter format */
function toEmitterConfig(config: ParticleConfig) {
  const direction = config.direction ?? -Math.PI / 2;
  const spread = config.spread ?? Math.PI * 2;
  const startAngle = ((direction - spread / 2) * 180) / Math.PI;
  const endAngle = ((direction + spread / 2) * 180) / Math.PI;
  const colors = config.colors ?? [config.color];
  const colorList = colors.map((c) => {
    const r = ((c >> 16) & 0xff) / 255;
    const g = ((c >> 8) & 0xff) / 255;
    const b = (c & 0xff) / 255;
    return { r, g, b };
  });

  // Use the v3 config format and let upgradeConfig convert it
  const v3Config = {
    alpha: {
      start: config.alpha ?? 1,
      end: config.fadeOut ? 0 : (config.alpha ?? 1),
    },
    scale: {
      start: config.size / 10,
      end: config.shrink ? 0 : config.size / 10,
    },
    color: {
      start: colorToHex(colors[0]),
      end: colorToHex(colors[colors.length - 1]),
    },
    speed: {
      start: config.speed,
      end: config.speed * 0.3,
    },
    acceleration: {
      x: 0,
      y: config.gravity ?? 0,
    },
    maxSpeed: 0,
    startRotation: {
      min: startAngle,
      max: endAngle,
    },
    noRotation: true,
    rotationSpeed: { min: 0, max: 0 },
    lifetime: {
      min: config.lifetime * 0.5,
      max: config.lifetime,
    },
    frequency: 0.001, // emit all at once
    emitterLifetime: 0.01, // burst mode
    maxParticles: config.count,
    pos: { x: 0, y: 0 },
    addAtBack: false,
    spawnType: 'point',
  };

  return upgradeConfig(v3Config, [Texture.WHITE]);
}

function colorToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class ParticleEmitter {
  container: Container;
  private emitter: Emitter;
  private elapsed = 0;
  private duration: number;
  private completed = false;

  constructor(x: number, y: number, config: ParticleConfig, duration?: number) {
    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.duration = duration || config.lifetime + 0.5;

    const emitterConfig = toEmitterConfig(config);
    this.emitter = new Emitter(this.container, emitterConfig);
    this.emitter.emit = true;
  }

  get isComplete(): boolean {
    return this.completed;
  }

  update(dt: number): boolean {
    this.elapsed += dt;
    this.emitter.update(dt);

    if (this.elapsed >= this.duration) {
      this.completed = true;
      this.emitter.emit = false;
      this.emitter.destroy();
      return true;
    }
    return false;
  }

  destroy(): void {
    this.emitter.destroy();
    this.container.destroy({ children: true });
  }
}

// ===== Preset Particle Configs =====

export const PARTICLE_PRESETS = {
  damageBurst: (intensity = 1): ParticleConfig => ({
    count: Math.round(8 * intensity),
    lifetime: 0.6,
    speed: 120 * intensity,
    size: 3,
    color: 0xff4444,
    colors: [0xff4444, 0xff6633, 0xffaa22, 0xff2222],
    gravity: 200,
    spread: Math.PI * 2,
    fadeOut: true,
    shrink: true,
  }),

  heal: (): ParticleConfig => ({
    count: 6,
    lifetime: 1.0,
    speed: 40,
    size: 2,
    color: 0x44ff66,
    colors: [0x44ff66, 0x88ffaa, 0x22cc44],
    gravity: -30,
    direction: -Math.PI / 2,
    spread: Math.PI * 0.6,
    fadeOut: true,
  }),

  armor: (): ParticleConfig => ({
    count: 5,
    lifetime: 0.8,
    speed: 30,
    size: 2,
    color: 0x4488ff,
    colors: [0x4488ff, 0x66aaff, 0x3366cc],
    gravity: -20,
    direction: -Math.PI / 2,
    spread: Math.PI * 0.8,
    fadeOut: true,
  }),

  death: (): ParticleConfig => ({
    count: 12,
    lifetime: 1.2,
    speed: 60,
    size: 3,
    color: 0x333333,
    colors: [0x222222, 0x444444, 0x111111, 0x553333],
    gravity: -80,
    spread: Math.PI * 1.5,
    direction: -Math.PI / 2,
    fadeOut: true,
    shrink: true,
  }),

  critical: (): ParticleConfig => ({
    count: 14,
    lifetime: 0.8,
    speed: 150,
    size: 3,
    color: 0xffd700,
    colors: [0xffd700, 0xffaa00, 0xffe066, 0xff8800],
    gravity: 150,
    spread: Math.PI * 2,
    fadeOut: true,
    shrink: true,
  }),

  fire: (): ParticleConfig => ({
    count: 8,
    lifetime: 0.7,
    speed: 50,
    size: 2,
    color: 0xff6600,
    colors: [0xff6600, 0xff4400, 0xffaa00, 0xff2200],
    gravity: -60,
    direction: -Math.PI / 2,
    spread: Math.PI * 0.5,
    fadeOut: true,
  }),

  ice: (): ParticleConfig => ({
    count: 8,
    lifetime: 0.9,
    speed: 40,
    size: 2,
    color: 0x88ccff,
    colors: [0x88ccff, 0xaaddff, 0x66bbff, 0xffffff],
    gravity: 30,
    spread: Math.PI * 1.2,
    fadeOut: true,
  }),

  poison: (): ParticleConfig => ({
    count: 6,
    lifetime: 1.0,
    speed: 25,
    size: 2,
    color: 0x44cc44,
    colors: [0x44cc44, 0x22aa22, 0x66ff66],
    gravity: -15,
    direction: -Math.PI / 2,
    spread: Math.PI * 0.4,
    fadeOut: true,
  }),

  selectionGlow: (): ParticleConfig => ({
    count: 4,
    lifetime: 2.0,
    speed: 15,
    size: 2,
    color: 0xffaa00,
    colors: [0xffaa00, 0xffd700],
    gravity: 0,
    spread: Math.PI * 2,
    fadeOut: false,
  }),
} as const;