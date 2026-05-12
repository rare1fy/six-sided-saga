/**
 * EnemyAnimations.ts - Enemy visual animations (PixiJS)
 *
 * Replicates from EnemyStageView.tsx:
 * - Breathing idle animation (per combat type)
 * - Hit reaction (shake + flash)
 * - Death animation (expand + dissolve)
 * - Boss death ritual (golden glow + explosion)
 * - Boss entrance (dramatic scale-in)
 * - Boss low HP roar (red pulse + shake)
 * - Attack animation (lunge forward)
 * - Defend animation (pulse shield)
 * - Skill animation (spin + glow)
 * - Speaking animation (subtle bounce)
 * - Enemy shadow (ground ellipse)
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { TweenManager, Ease } from '../animation/Tween';

// ===== Breathing Animations =====
// Original CSS: animate-enemy-breathe-{type}
// Each combat type has a slightly different idle rhythm

export interface BreathingConfig {
  scaleAmplitude: number;  // how much to scale up/down
  yAmplitude: number;      // how much to bob up/down
  period: number;          // seconds per cycle
  rotationAmplitude: number;
}

const BREATHING_CONFIGS: Record<string, BreathingConfig> = {
  warrior: { scaleAmplitude: 0.02, yAmplitude: 2, period: 2.5, rotationAmplitude: 0.01 },
  guardian: { scaleAmplitude: 0.015, yAmplitude: 1.5, period: 3.0, rotationAmplitude: 0.005 },
  ranger: { scaleAmplitude: 0.025, yAmplitude: 3, period: 2.0, rotationAmplitude: 0.015 },
  caster: { scaleAmplitude: 0.03, yAmplitude: 4, period: 2.8, rotationAmplitude: 0.02 },
  priest: { scaleAmplitude: 0.02, yAmplitude: 2.5, period: 3.2, rotationAmplitude: 0.008 },
  default: { scaleAmplitude: 0.02, yAmplitude: 2, period: 2.5, rotationAmplitude: 0.01 },
};

/** Apply breathing animation to enemy sprite (called each frame) */
export function applyBreathing(
  sprite: Container,
  combatType: string,
  time: number,
  phaseOffset: number = 0,
): void {
  const config = BREATHING_CONFIGS[combatType] || BREATHING_CONFIGS.default;
  const t = time + phaseOffset;
  const breathPhase = Math.sin(t * Math.PI * 2 / config.period);
  const breathPhase2 = Math.cos(t * Math.PI * 2 / config.period * 0.7);

  sprite.scale.set(
    1 + breathPhase * config.scaleAmplitude,
    1 + breathPhase * config.scaleAmplitude * 0.5,
  );
  sprite.y += breathPhase2 * config.yAmplitude * 0.016; // delta-based
  sprite.rotation = breathPhase * config.rotationAmplitude;
}

// ===== Hit Reaction =====

/** Enemy hit: shake + brief white flash */
export function animateEnemyHit(
  enemyContainer: Container,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);
  const baseX = enemyContainer.x;

  // Shake left-right
  TweenManager.to(enemyContainer, { x: baseX - 10 }, { duration: 0.05, ease: Ease.linear });
  TweenManager.to(enemyContainer, { x: baseX + 12 }, { duration: 0.05, delay: 0.05, ease: Ease.linear });
  TweenManager.to(enemyContainer, { x: baseX - 6 }, { duration: 0.05, delay: 0.1, ease: Ease.linear });
  TweenManager.to(enemyContainer, { x: baseX + 3 }, { duration: 0.05, delay: 0.15, ease: Ease.linear });
  TweenManager.to(enemyContainer, { x: baseX }, { duration: 0.1, delay: 0.2, ease: Ease.easeOut, onComplete });

  // Flash (alpha pulse simulating brightness)
  TweenManager.flash(enemyContainer, 0.4);
}

// ===== Death Animation =====

/** Normal enemy death: expand + spin + dissolve */
export function animateEnemyDeath(
  enemyContainer: Container,
  duration: number = 0.8,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);

  // Phase 1: Brief expand + flash (0-40%)
  TweenManager.to(enemyContainer, { scaleX: 1.1, scaleY: 1.1 }, {
    duration: duration * 0.15,
    ease: Ease.easeOut,
  });

  // Phase 2: Shrink + spin + fade (40-100%)
  TweenManager.to(enemyContainer, {
    scaleX: 0.5, scaleY: 0.5,
    alpha: 0,
    rotation: Math.PI * 0.5,
    y: enemyContainer.y + 10,
  }, {
    duration: duration * 0.6,
    delay: duration * 0.15,
    ease: Ease.easeIn,
    onComplete,
  });
}

/** Boss death ritual: golden glow + dramatic explosion (2000ms) */
export function animateBossDeath(
  enemyContainer: Container,
  duration: number = 2.0,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);

  // Phase 1 (0-50%): Expand + golden glow (rage/defiance)
  TweenManager.to(enemyContainer, { scaleX: 1.35, scaleY: 1.35 }, {
    duration: duration * 0.5,
    ease: Ease.easeOut,
  });

  // Phase 2 (50-100%): Shrink + spin + dissolve
  TweenManager.to(enemyContainer, {
    scaleX: 0, scaleY: 0,
    alpha: 0,
    rotation: Math.PI * 0.8,
    y: enemyContainer.y + 5,
  }, {
    duration: duration * 0.5,
    delay: duration * 0.5,
    ease: Ease.easeIn,
    onComplete,
  });
}

// ===== Boss Entrance =====

/** Boss dramatic entrance: scale from small + bounce */
export function animateBossEntrance(
  enemyContainer: Container,
  duration: number = 1.5,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);
  enemyContainer.scale.set(0.3);
  enemyContainer.alpha = 0;
  enemyContainer.y += 60;

  const targetY = enemyContainer.y - 60;

  // Scale up dramatically
  TweenManager.to(enemyContainer, {
    scaleX: 1.3, scaleY: 1.3,
    alpha: 1,
    y: targetY - 15,
  }, {
    duration: duration * 0.5,
    ease: Ease.easeOut,
  });

  // Settle to final position
  TweenManager.to(enemyContainer, {
    scaleX: 1, scaleY: 1,
    y: targetY,
  }, {
    duration: duration * 0.5,
    delay: duration * 0.5,
    ease: Ease.easeOutBounce,
    onComplete,
  });
}

// ===== Boss Low HP Roar =====

/** Boss rage: shake + red pulse when HP drops below threshold */
export function animateBossLowHpRoar(
  enemyContainer: Container,
  duration: number = 2.0,
): void {
  TweenManager.killTweensOf(enemyContainer);
  const baseX = enemyContainer.x;

  // Violent shake
  for (let i = 0; i < 12; i++) {
    const dx = (Math.random() - 0.5) * 8;
    TweenManager.to(enemyContainer, { x: baseX + dx }, {
      duration: duration / 12,
      delay: i * (duration / 12),
      ease: Ease.linear,
    });
  }
  TweenManager.to(enemyContainer, { x: baseX }, {
    duration: 0.1,
    delay: duration,
    ease: Ease.easeOut,
  });

  // Scale pulse
  TweenManager.to(enemyContainer, { scaleX: 1.3, scaleY: 1.3 }, {
    duration: duration * 0.3,
    ease: Ease.easeOut,
  });
  TweenManager.to(enemyContainer, { scaleX: 1, scaleY: 1 }, {
    duration: duration * 0.3,
    delay: duration * 0.7,
    ease: Ease.easeOut,
  });
}

// ===== Attack Animation =====

/** Enemy attack: lunge forward toward player */
export function animateEnemyAttack(
  enemyContainer: Container,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);
  const baseY = enemyContainer.y;

  // Wind up
  TweenManager.to(enemyContainer, { y: baseY - 8, scaleX: 1.05, scaleY: 1.05 }, {
    duration: 0.15,
    ease: Ease.easeOut,
  });

  // Lunge forward
  TweenManager.to(enemyContainer, { y: baseY + 30, scaleX: 1.12, scaleY: 1.12 }, {
    duration: 0.12,
    delay: 0.15,
    ease: Ease.easeIn,
  });

  // Return
  TweenManager.to(enemyContainer, { y: baseY, scaleX: 1, scaleY: 1 }, {
    duration: 0.2,
    delay: 0.27,
    ease: Ease.easeOut,
    onComplete,
  });
}

// ===== Defend Animation =====

/** Enemy defend: brief scale pulse */
export function animateEnemyDefend(
  enemyContainer: Container,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);
  TweenManager.to(enemyContainer, { scaleX: 1.08, scaleY: 1.08 }, {
    duration: 0.2,
    ease: Ease.easeOut,
  });
  TweenManager.to(enemyContainer, { scaleX: 1, scaleY: 1 }, {
    duration: 0.2,
    delay: 0.2,
    ease: Ease.easeOut,
    onComplete,
  });
}

// ===== Skill Animation =====

/** Enemy skill: spin + scale burst */
export function animateEnemySkill(
  enemyContainer: Container,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(enemyContainer);
  TweenManager.to(enemyContainer, { scaleX: 1.2, scaleY: 1.2, rotation: Math.PI * 0.15 }, {
    duration: 0.2,
    ease: Ease.easeOut,
  });
  TweenManager.to(enemyContainer, { rotation: -Math.PI * 0.15 }, {
    duration: 0.15,
    delay: 0.2,
    ease: Ease.linear,
  });
  TweenManager.to(enemyContainer, { scaleX: 1, scaleY: 1, rotation: 0 }, {
    duration: 0.2,
    delay: 0.35,
    ease: Ease.easeOut,
    onComplete,
  });
}

// ===== Speaking Animation =====

/** Enemy speaking: subtle bounce */
export function animateEnemySpeaking(
  enemyContainer: Container,
): void {
  TweenManager.to(enemyContainer, { scaleX: 1.02, scaleY: 0.98 }, {
    duration: 0.15,
    ease: Ease.easeOut,
  });
  TweenManager.to(enemyContainer, { scaleX: 0.98, scaleY: 1.02 }, {
    duration: 0.15,
    delay: 0.15,
    ease: Ease.easeOut,
  });
  TweenManager.to(enemyContainer, { scaleX: 1, scaleY: 1 }, {
    duration: 0.2,
    delay: 0.3,
    ease: Ease.easeOut,
  });
}

// ===== Ground Shadow =====

/** Create enemy ground shadow ellipse */
export function createEnemyShadow(width: number = 60): Graphics {
  const shadow = new Graphics();
  shadow.beginFill(0x000000, 0.5);
  shadow.drawEllipse(0, 0, width * 0.75, width * 0.15);
  shadow.endFill();
  // Blur simulation with outer ring
  shadow.beginFill(0x000000, 0.2);
  shadow.drawEllipse(0, 0, width * 0.85, width * 0.18);
  shadow.endFill();
  return shadow;
}

// ===== Debuff Visual Overlays on Enemy =====

/** Create burn overlay (red glow around enemy) */
export function createBurnOverlay(size: number): Graphics {
  const g = new Graphics();
  g.beginFill(0xff4400, 0.08);
    g.drawCircle(0, 0, size * 0.6);
    g.endFill();
  g.lineStyle(1, 0xff6600, 0.15);
    g.drawCircle(0, 0, size * 0.5);
    g.lineStyle(0);
  return g;
}

/** Create poison overlay (green drip around enemy) */
export function createPoisonOverlay(size: number): Graphics {
  const g = new Graphics();
  g.beginFill(0x22aa22, 0.06);
    g.drawCircle(0, 0, size * 0.6);
    g.endFill();
  g.lineStyle(1, 0x44cc44, 0.12);
    g.drawCircle(0, 0, size * 0.5);
    g.lineStyle(0);
  return g;
}

/** Create weak overlay (purple dim) */
export function createWeakOverlay(size: number): Graphics {
  const g = new Graphics();
  g.beginFill(0x6644aa, 0.08);
    g.drawCircle(0, 0, size * 0.55);
    g.endFill();
  return g;
}

/** Create vulnerable overlay (red cracks) */
export function createVulnerableOverlay(size: number): Graphics {
  const g = new Graphics();
  g.beginFill(0xcc3333, 0.06);
    g.drawCircle(0, 0, size * 0.55);
    g.endFill();
  // Crack lines
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = size * 0.3;
    g.lineStyle(1, 0xcc3333, 0.2);
    g.moveTo(Math.cos(angle) * r * 0.3, Math.sin(angle) * r * 0.3);
    g.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  return g;
}