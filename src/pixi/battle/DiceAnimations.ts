/**
 * DiceAnimations.ts - Dice interaction animations (PixiJS)
 *
 * Replicates from PlayerHudView.tsx:
 * - Dice select bounce (selected -> float up 18px)
 * - Dice deselect drop
 * - Dice roll tumble animation
 * - Dice play (fly toward enemy)
 * - Dice discard (fly to discard pile)
 * - Dice draw (fly from bag)
 * - Reroll spin animation
 * - Hand hint glow pulse
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { TweenManager, Ease } from '../animation/Tween';
import { ParticleEmitter, PARTICLE_PRESETS } from '../animation/Particles';

const W = 720;

// ===== Dice Select/Deselect =====

/** Bounce dice up when selected (replicates CSS transform translateY(-18px)) */
export function animateDiceSelect(dieContainer: Container, baseY: number): void {
  TweenManager.killTweensOf(dieContainer);
  TweenManager.to(dieContainer, { y: baseY - 18, scaleX: 1.05, scaleY: 1.05 }, {
    duration: 0.2,
    ease: Ease.easeOutBack,
  });
}

/** Drop dice back when deselected */
export function animateDiceDeselect(dieContainer: Container, baseY: number): void {
  TweenManager.killTweensOf(dieContainer);
  TweenManager.to(dieContainer, { y: baseY, scaleX: 1, scaleY: 1 }, {
    duration: 0.15,
    ease: Ease.easeOut,
  });
}

// ===== Dice Roll =====

/** Tumble animation when dice are being rolled */
export function animateDiceRoll(dieContainer: Container, delay: number = 0): void {
  TweenManager.killTweensOf(dieContainer);
  const baseY = dieContainer.y;
  const baseRotation = dieContainer.rotation;

  // Phase 1: Jump up + spin
  TweenManager.to(dieContainer, { y: baseY - 30, rotation: Math.PI * 2 }, {
    duration: 0.3,
    delay,
    ease: Ease.easeOut,
  });

  // Phase 2: Fall back + settle
  TweenManager.to(dieContainer, { y: baseY, rotation: 0 }, {
    duration: 0.25,
    delay: delay + 0.3,
    ease: Ease.easeOutBounce,
  });
}

/** Reroll spin (selected dice spin in place) */
export function animateRerollSpin(dieContainer: Container, delay: number = 0): void {
  TweenManager.killTweensOf(dieContainer);
  const baseScale = dieContainer.scale.x;

  // Shrink + spin + grow back
  TweenManager.to(dieContainer, { scaleX: 0.1, scaleY: 0.1, rotation: Math.PI * 3 }, {
    duration: 0.3,
    delay,
    ease: Ease.easeIn,
  });
  TweenManager.to(dieContainer, { scaleX: baseScale, scaleY: baseScale, rotation: 0 }, {
    duration: 0.3,
    delay: delay + 0.3,
    ease: Ease.easeOutBack,
  });
}

// ===== Dice Play (fly to enemy) =====

/** Fly dice toward target position (enemy) */
export function animateDicePlay(
  dieContainer: Container,
  targetX: number,
  targetY: number,
  delay: number = 0,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(dieContainer);

  TweenManager.to(dieContainer, {
    x: targetX,
    y: targetY,
    scaleX: 0.3,
    scaleY: 0.3,
    alpha: 0,
    rotation: Math.PI * 1.5,
  }, {
    duration: 0.4,
    delay,
    ease: Ease.easeIn,
    onComplete,
  });
}

// ===== Dice Discard =====

/** Fly dice to discard pile (bottom right) */
export function animateDiceDiscard(
  dieContainer: Container,
  delay: number = 0,
  onComplete?: () => void,
): void {
  TweenManager.killTweensOf(dieContainer);

  TweenManager.to(dieContainer, {
    x: W - 40,
    y: 30,
    scaleX: 0.2,
    scaleY: 0.2,
    alpha: 0,
  }, {
    duration: 0.35,
    delay,
    ease: Ease.easeIn,
    onComplete,
  });
}

// ===== Dice Draw (from bag) =====

/** Animate dice appearing from bag (left side) */
export function animateDiceDraw(
  dieContainer: Container,
  finalX: number,
  finalY: number,
  delay: number = 0,
): void {
  // Start from bag position (left side)
  dieContainer.x = 40;
  dieContainer.y = finalY - 20;
  dieContainer.scale.set(0.2);
  dieContainer.alpha = 0;

  TweenManager.to(dieContainer, {
    x: finalX,
    y: finalY,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
  }, {
    duration: 0.35,
    delay,
    ease: Ease.easeOutBack,
  });
}

// ===== Hand Hint Glow =====

/** Pulse glow on dice that form a valid hand */
export function animateHandHintGlow(glowGraphic: Graphics): void {
  glowGraphic.alpha = 0;
  // Pulse in/out
  TweenManager.to(glowGraphic as any, { alpha: 0.4 }, {
    duration: 0.6,
    ease: Ease.easeInOut,
    repeat: -1,
    yoyo: true,
  });
}

// ===== Dice Shuffle =====

/** Shuffle animation - all dice scatter and reform */
export function animateDiceShuffle(
  diceContainers: Container[],
  finalPositions: { x: number; y: number }[],
  onComplete?: () => void,
): void {
  const centerX = W / 2;
  const centerY = 0;

  // Phase 1: All dice fly to center
  diceContainers.forEach((dc, i) => {
    TweenManager.to(dc, {
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY + (Math.random() - 0.5) * 20,
      rotation: Math.random() * Math.PI * 2,
      scaleX: 0.6,
      scaleY: 0.6,
    }, {
      duration: 0.2,
      delay: i * 0.03,
      ease: Ease.easeIn,
    });
  });

  // Phase 2: Redistribute to new positions
  diceContainers.forEach((dc, i) => {
    const final = finalPositions[i] || { x: centerX, y: centerY };
    TweenManager.to(dc, {
      x: final.x,
      y: final.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }, {
      duration: 0.3,
      delay: 0.25 + i * 0.04,
      ease: Ease.easeOutBack,
      onComplete: i === diceContainers.length - 1 ? onComplete : undefined,
    });
  });
}

// ===== Selection Glow Ring =====

/** Create animated selection glow ring (like EnemySelectionFx) */
export function createSelectionRing(radius: number = 40): Container {
  const c = new Container();

  // Outer ring
  const ring = new Graphics();
  ring.drawEllipse(0, 0, radius, radius * 0.3);
  ring.lineStyle(2, 0xff6600, 0.6);
  ring.beginFill(0xff6600, 0.06);
  ring.drawEllipse(0, 0, radius - 2, radius * 0.3 - 1);
  ring.endFill();
  c.addChild(ring);

  // Rotating dots
  for (let i = 0; i < 4; i++) {
    const dot = new Graphics();
    dot.beginFill(0xffaa00, 0.8);
    dot.drawCircle(0, 0, 2);
    dot.endFill();
    const angle = (i / 4) * Math.PI * 2;
    dot.x = Math.cos(angle) * radius;
    dot.y = Math.sin(angle) * radius * 0.3;
    c.addChild(dot);
  }

  return c;
}