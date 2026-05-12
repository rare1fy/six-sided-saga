/**
 * FloatingText.ts - Floating damage/heal/status text (PixiJS)
 *
 * Replicates from EnemyStageView.tsx / PlayerHudView.tsx:
 * - Damage numbers (red, scale up, float up, fade out)
 * - Heal numbers (green, float up)
 * - Armor gain (blue)
 * - Critical hit (gold, larger, with particles)
 * - Status text (buff/debuff applied)
 * - Skill trigger text (green, with icon)
 *
 * Original animation:
 *   initial: opacity 0, y +20, scale 0.5
 *   animate: opacity [0,1,1,0], y -120, scale [0.5, 1.4, 1.1, 1.6]
 *   duration: 2.0s, times: [0, 0.12, 0.75, 1]
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface FloatingTextConfig {
  text: string;
  x: number;
  y: number;
  color?: number;
  size?: number;
  bold?: boolean;
  duration?: number;
  icon?: string;       // emoji prefix
  critical?: boolean;  // gold + larger + particles
  large?: boolean;     // fullscreen centered
}

/** Managed collection of floating texts */
export class FloatingTextManager {
  container: Container;
  private activeTexts: { c: Container; elapsed: number; duration: number }[] = [];

  constructor() {
    this.container = new Container();
    this.container.zIndex = 50;
  }

  /** Spawn a floating text */
  spawn(config: FloatingTextConfig): void {
    const c = new Container();
    const duration = config.duration || 2.0;
    const size = config.critical ? 28 : config.large ? 24 : config.size || 18;
    const color = config.critical ? COLORS.gold : config.color || COLORS.red;

    // Icon prefix
    if (config.icon) {
      const iconText = createText(config.icon, { size: size * 0.8 });
      iconText.x = 0;
      iconText.y = 0;
      c.addChild(iconText);
    }

    // Main text
    const textObj = createText(config.text, {
      size,
      color,
      bold: config.bold !== false,
    });
    textObj.anchor.set(0.5, 0.5);
    textObj.x = config.icon ? size * 0.6 : 0;
    textObj.y = 0;
    c.addChild(textObj);

    // Position
    c.x = config.x + (Math.random() - 0.5) * 20;
    c.y = config.y;
    c.alpha = 0;
    c.scale.set(0.5);

    this.container.addChild(c);

    // Animate: replicate original framer-motion keyframes
    // Phase 1: Appear + scale up (0-12%)
    TweenManager.to(c, { alpha: 1, scaleX: 1.4, scaleY: 1.4, y: config.y - 30 }, {
      duration: duration * 0.12,
      ease: Ease.easeOut,
    });

    // Phase 2: Hold + slight shrink (12-75%)
    TweenManager.to(c, { scaleX: 1.1, scaleY: 1.1, y: config.y - 80 }, {
      duration: duration * 0.63,
      delay: duration * 0.12,
      ease: Ease.linear,
    });

    // Phase 3: Fade out + scale up (75-100%)
    TweenManager.to(c, { alpha: 0, scaleX: 1.6, scaleY: 1.6, y: config.y - 120 }, {
      duration: duration * 0.25,
      delay: duration * 0.75,
      ease: Ease.easeIn,
      onComplete: () => {
        this.container.removeChild(c);
        c.destroy({ children: true });
      },
    });

    this.activeTexts.push({ c, elapsed: 0, duration });
  }

  /** Convenience: spawn damage number on enemy */
  spawnDamage(x: number, y: number, damage: number, critical: boolean = false): void {
    this.spawn({
      text: String(damage),
      x, y,
      color: critical ? COLORS.gold : damage >= 20 ? COLORS.orange : COLORS.red,
      critical,
      size: critical ? 28 : damage >= 20 ? 22 : 18,
    });
  }

  /** Convenience: spawn heal number */
  spawnHeal(x: number, y: number, amount: number): void {
    this.spawn({
      text: `+${amount}`,
      x, y,
      color: COLORS.green,
      icon: '\u2764',
    });
  }

  /** Convenience: spawn armor gain */
  spawnArmor(x: number, y: number, amount: number): void {
    this.spawn({
      text: `+${amount}`,
      x, y,
      color: COLORS.blue,
      icon: '\ud83d\udee1',
    });
  }

  /** Convenience: spawn status text */
  spawnStatus(x: number, y: number, statusName: string, color: number = COLORS.purple): void {
    this.spawn({
      text: statusName,
      x, y,
      color,
      size: 14,
      duration: 1.5,
    });
  }

  /** Convenience: spawn skill trigger text */
  spawnSkillTrigger(x: number, y: number, skillName: string): void {
    this.spawn({
      text: skillName,
      x, y,
      color: COLORS.green,
      size: 14,
      duration: 1.8,
      icon: '\u2728',
    });
  }

  /** Cleanup */
  update(dt: number): void {
    // Cleanup handled by TweenManager callbacks
    this.activeTexts = this.activeTexts.filter(t => {
      t.elapsed += dt;
      return t.elapsed < t.duration + 0.5;
    });
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
