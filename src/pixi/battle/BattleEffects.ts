/**
 * BattleEffects.ts - Battle visual effects layer (PixiJS)
 *
 * Replicates from BattleSceneView.tsx / EnemyStageView.tsx:
 * - Screen shake (screenShake)
 * - Attack flash overlay (white/red flash)
 * - Vengeance red pulse
 * - Debuff screen effects (burn/poison/weak/vulnerable)
 * - Damage overlay (fullscreen damage number burst)
 * - Wave announcement
 * - Slash effect on enemy hit
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { TweenManager, Ease } from '../animation/Tween';
import { createText, COLORS } from '../UIFactory';
import { ParticleEmitter, PARTICLE_PRESETS } from '../animation/Particles';

const W = 720;
const H = 1280;
const STAGE_H = H * 0.52;

/**
 * BattleEffectsLayer - manages all transient visual effects
 */
export class BattleEffectsLayer {
  container: Container;
  private flashOverlay: Graphics;
  private debuffOverlays: Map<string, Graphics> = new Map();
  private particleEmitters: ParticleEmitter[] = [];

  constructor() {
    this.container = new Container();
    this.container.zIndex = 100;

    // Flash overlay (covers entire stage)
    this.flashOverlay = new Graphics();
    this.flashOverlay.beginFill(0xffffff, 1);
    this.flashOverlay.drawRect(0, 0, W, H);
    this.flashOverlay.endFill();
    this.flashOverlay.alpha = 0;
    this.flashOverlay.visible = false;
    this.container.addChild(this.flashOverlay);
  }

  // ===== Screen Shake =====
  /** Apply screen shake to a target container */
  screenShake(target: Container, intensity: number = 8): void {
    TweenManager.shake(target, intensity, 0.55);
  }

  /** Vengeance shake (shorter, red-tinted) */
  vengeanceShake(target: Container): void {
    TweenManager.shake(target, 5, 0.38);
    this.flashColor(0xdc2828, 0.28, 0.4);
  }

  // ===== Flash Effects =====
  /** White flash (player attack hits enemy) */
  attackFlash(): void {
    this.flashColor(0xffffff, 0.12, 0.3);
  }

  /** Red flash (enemy attacks player) */
  enemyAttackFlash(): void {
    this.flashColor(0xff3333, 0.12, 0.3);
  }

  /** Custom color flash */
  flashColor(color: number, maxAlpha: number, duration: number): void {
    this.flashOverlay.clear();
    this.flashOverlay.beginFill(color, 1);
    this.flashOverlay.drawRect(0, 0, W, H);
    this.flashOverlay.endFill();
    this.flashOverlay.alpha = 0;
    this.flashOverlay.visible = true;

    TweenManager.killTweensOf(this.flashOverlay);
    TweenManager.to(this.flashOverlay, { alpha: maxAlpha }, {
      duration: duration * 0.2,
      ease: Ease.linear,
      onComplete: () => {
        TweenManager.to(this.flashOverlay, { alpha: 0 }, {
          duration: duration * 0.8,
          ease: Ease.easeOut,
          onComplete: () => { this.flashOverlay.visible = false; },
        });
      },
    });
  }

  // ===== Debuff Screen Effects =====
  /** Show/hide debuff screen overlay */
  setDebuffOverlay(type: string, active: boolean): void {
    if (active && !this.debuffOverlays.has(type)) {
      const overlay = this.createDebuffOverlay(type);
      this.debuffOverlays.set(type, overlay);
      this.container.addChild(overlay);
    } else if (!active && this.debuffOverlays.has(type)) {
      const overlay = this.debuffOverlays.get(type)!;
      this.container.removeChild(overlay);
      overlay.destroy();
      this.debuffOverlays.delete(type);
    }
  }

  private createDebuffOverlay(type: string): Graphics {
    const g = new Graphics();
    switch (type) {
      case 'burn':
        // Red-orange edge glow
        g.beginFill(0xff4400, 0.04);
    g.drawRect(0, 0, W, H);
    g.endFill();
        // Edge vignette
        g.beginFill(0xff2200, 0.08);
    g.drawRect(0, 0, W * 0.08, H);
    g.endFill();
        g.beginFill(0xff2200, 0.08);
    g.drawRect(W * 0.92, 0, W * 0.08, H);
    g.endFill();
        break;
      case 'poison':
        // Green tint
        g.beginFill(0x22aa22, 0.03);
    g.drawRect(0, 0, W, H);
    g.endFill();
        g.beginFill(0x22cc22, 0.06);
    g.drawRect(0, H * 0.9, W, H * 0.1);
    g.endFill();
        break;
      case 'weak':
        // Purple desaturation
        g.beginFill(0x6644aa, 0.04);
    g.drawRect(0, 0, W, H);
    g.endFill();
        break;
      case 'vulnerable':
        // Red cracks
        g.beginFill(0xcc3333, 0.03);
    g.drawRect(0, 0, W, H);
    g.endFill();
        // Crack lines
        for (let i = 0; i < 5; i++) {
          const sx = Math.random() * W;
          const sy = Math.random() * H;
          g.lineStyle(1, 0xcc3333, 0.15);
          g.moveTo(sx, sy);
          g.lineTo(sx + (Math.random() - 0.5) * 60, sy + Math.random() * 40);
        }
        break;
    }
    return g;
  }

  // ===== Particle Effects =====
  /** Spawn damage burst particles at position */
  spawnDamageBurst(x: number, y: number, intensity: number = 1): void {
    const config = PARTICLE_PRESETS.damageBurst(intensity);
    const emitter = new ParticleEmitter(x, y, config);
    this.particleEmitters.push(emitter);
    this.container.addChild(emitter.container);
  }

  /** Spawn heal particles */
  spawnHealParticles(x: number, y: number): void {
    const config = PARTICLE_PRESETS.heal();
    const emitter = new ParticleEmitter(x, y, config);
    this.particleEmitters.push(emitter);
    this.container.addChild(emitter.container);
  }

  /** Spawn death particles */
  spawnDeathParticles(x: number, y: number): void {
    const config = PARTICLE_PRESETS.death();
    const emitter = new ParticleEmitter(x, y, config);
    this.particleEmitters.push(emitter);
    this.container.addChild(emitter.container);
  }

  /** Spawn critical hit particles */
  spawnCriticalParticles(x: number, y: number): void {
    const config = PARTICLE_PRESETS.critical();
    const emitter = new ParticleEmitter(x, y, config);
    this.particleEmitters.push(emitter);
    this.container.addChild(emitter.container);
  }

  /** Spawn element-specific particles */
  spawnElementParticles(x: number, y: number, element: string): void {
    const presetMap: Record<string, () => any> = {
      fire: PARTICLE_PRESETS.fire,
      ice: PARTICLE_PRESETS.ice,
      poison: PARTICLE_PRESETS.poison,
    };
    const preset = presetMap[element];
    if (!preset) return;
    const emitter = new ParticleEmitter(x, y, preset());
    this.particleEmitters.push(emitter);
    this.container.addChild(emitter.container);
  }

  // ===== Slash Effect =====
  /** Diagonal slash line across enemy (player attack visual) */
  spawnSlashEffect(x: number, y: number): void {
    const slash = new Graphics();
    slash.lineStyle(3, 0xffffff, 0.9);
    slash.moveTo(-30, 20);
    slash.lineTo(30, -20);
    slash.lineStyle(2, 0xffaa44, 0.6);
    slash.moveTo(-25, 22);
    slash.lineTo(25, -18);
    slash.x = x;
    slash.y = y;
    slash.alpha = 1;
    slash.scale.set(0.3);
    this.container.addChild(slash);

    TweenManager.to(slash, { scaleX: 1.5, scaleY: 1.5, alpha: 0 }, {
      duration: 0.35,
      ease: Ease.easeOut,
      onComplete: () => {
        this.container.removeChild(slash);
        slash.destroy();
      },
    });
  }

  // ===== Wave Announcement =====
  /** Show wave number announcement overlay */
  showWaveAnnouncement(waveNum: number, onComplete?: () => void): void {
    const announceContainer = new Container();
    announceContainer.alpha = 0;

    // Background dim
    const bg = new Graphics();
    bg.beginFill(0x000000, 0.5);
    bg.drawRect(0, 0, W, STAGE_H);
    bg.endFill();
    announceContainer.addChild(bg);

    // Wave text (using Graphics for pixel-art text feel)
    // Uses createText/COLORS imported at top
    const waveText = createText(`\u7b2c ${waveNum} \u6ce2`, {
      size: 36, color: COLORS.orange, bold: true,
    });
    waveText.anchor.set(0.5);
    waveText.x = W / 2;
    waveText.y = STAGE_H * 0.4;
    announceContainer.addChild(waveText);

    const subText = createText('\u654c\u4eba\u6765\u88ad\uff01', {
      size: 16, color: 0xffcc88, bold: true,
    });
    subText.anchor.set(0.5);
    subText.x = W / 2;
    subText.y = STAGE_H * 0.4 + 44;
    announceContainer.addChild(subText);

    this.container.addChild(announceContainer);

    // Animate: fade in -> hold -> fade out
    TweenManager.to(announceContainer, { alpha: 1, scale: 1.2 }, {
      duration: 0.3,
      ease: Ease.easeOutBack,
      onComplete: () => {
        TweenManager.to(announceContainer, { scale: 1 }, {
          duration: 0.2,
          delay: 0.1,
          ease: Ease.easeOut,
        });
        TweenManager.to(announceContainer, { alpha: 0, y: -30 }, {
          duration: 0.5,
          delay: 1.8,
          ease: Ease.easeIn,
          onComplete: () => {
            this.container.removeChild(announceContainer);
            announceContainer.destroy({ children: true });
            onComplete?.();
          },
        });
      },
    });
  }

  // ===== Damage Number Overlay (fullscreen) =====
  /** Show big damage number in center of screen */
  showDamageOverlay(damage: number, armor: number = 0, heal: number = 0): void {
    const overlay = new Container();
    overlay.alpha = 0;

    // Radial red glow background
    const bg = new Graphics();
    bg.beginFill(0xff2828, 0.15);
    bg.drawCircle(W / 2, H * 0.35, 120);
    bg.endFill();
    bg.beginFill(0xffffff, 0.1);
    bg.drawCircle(W / 2, H * 0.35, 60);
    bg.endFill();
    overlay.addChild(bg);

    // Uses createText/COLORS imported at top

    if (damage > 0) {
      const color = damage >= 40 ? COLORS.gold : damage >= 20 ? COLORS.orange : COLORS.red;
      const size = damage >= 40 ? 64 : damage >= 20 ? 52 : 42;
      const dmgText = createText(String(damage), { size, color, bold: true });
      dmgText.anchor.set(0.5);
      dmgText.x = W / 2;
      dmgText.y = H * 0.35;
      overlay.addChild(dmgText);
    }

    if (armor > 0) {
      const armorText = createText(`+${armor} \u62a4\u7532`, { size: 22, color: COLORS.blue, bold: true });
      armorText.anchor.set(0.5);
      armorText.x = W / 2 - 50;
      armorText.y = H * 0.35 + 50;
      overlay.addChild(armorText);
    }

    if (heal > 0) {
      const healText = createText(`+${heal} \u6cbb\u7597`, { size: 22, color: COLORS.green, bold: true });
      healText.anchor.set(0.5);
      healText.x = W / 2 + 50;
      healText.y = H * 0.35 + 50;
      overlay.addChild(healText);
    }

    this.container.addChild(overlay);

    // Burst particles
    this.spawnDamageBurst(W / 2, H * 0.35, damage >= 20 ? 2 : 1);

    // Animate
    TweenManager.from(overlay, { alpha: 0, scale: 0.3 }, {
      duration: 0.4,
      ease: Ease.easeOutBack,
    });
    TweenManager.to(overlay, { alpha: 0 }, {
      duration: 0.6,
      delay: 1.0,
      ease: Ease.easeIn,
      onComplete: () => {
        this.container.removeChild(overlay);
        overlay.destroy({ children: true });
      },
    });
  }

  // ===== Update (call each frame) =====
  update(dt: number): void {
    // Update particle emitters
    for (let i = this.particleEmitters.length - 1; i >= 0; i--) {
      const emitter = this.particleEmitters[i];
      const done = emitter.update(dt);
      if (done) {
        this.container.removeChild(emitter.container);
        emitter.destroy();
        this.particleEmitters.splice(i, 1);
      }
    }
  }

  // ===== Cleanup =====
  destroy(): void {
    for (const emitter of this.particleEmitters) {
      emitter.destroy();
    }
    this.particleEmitters = [];
    for (const overlay of this.debuffOverlays.values()) {
      overlay.destroy();
    }
    this.debuffOverlays.clear();
    this.container.destroy({ children: true });
  }
}
