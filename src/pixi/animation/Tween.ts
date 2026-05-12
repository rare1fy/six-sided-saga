/**
 * Tween.ts - gsap-backed animation facade for PixiJS 7
 *
 * Provides the same API surface as the original TweenManager,
 * but delegates all work to gsap (industry-standard, battle-tested).
 *
 * Why a facade instead of using gsap directly?
 *   - All 15+ consumer files already import { TweenManager, Ease } from here
 *   - Keeps gsap as a swappable implementation detail
 *   - Adds PixiJS-specific helpers (shake, flash, bounce, deathDissolve)
 */
import { Container, Ticker } from 'pixi.js';
import gsap from 'gsap';

// ===== Easing =====
export type EaseFn = string;

export const Ease = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  easeOutBack: 'back.out(1.7)',
  easeOutElastic: 'elastic.out(1, 0.3)',
  easeOutBounce: 'bounce.out',
} as const;

// ===== Types =====

export interface TweenProps {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  scale?: number;
  alpha?: number;
  rotation?: number;
}

export interface TweenConfig {
  duration: number;
  delay?: number;
  ease?: EaseFn;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  repeat?: number;
  yoyo?: boolean;
}

export interface TweenInstance {
  kill: () => void;
}

// ===== Internal =====

function applyProxy(target: Container, proxy: Record<string, number>): void {
  if ('x' in proxy) target.x = proxy.x;
  if ('y' in proxy) target.y = proxy.y;
  if ('alpha' in proxy) target.alpha = proxy.alpha;
  if ('rotation' in proxy) target.rotation = proxy.rotation;
  if ('scaleX' in proxy) target.scale.x = proxy.scaleX;
  if ('scaleY' in proxy) target.scale.y = proxy.scaleY;
}

function createProxy(target: Container, props: TweenProps): Record<string, number> {
  const proxy: Record<string, number> = {};
  if (props.x !== undefined) proxy.x = target.x;
  if (props.y !== undefined) proxy.y = target.y;
  if (props.alpha !== undefined) proxy.alpha = target.alpha;
  if (props.rotation !== undefined) proxy.rotation = target.rotation;
  if (props.scale !== undefined) {
    proxy.scaleX = target.scale.x;
    proxy.scaleY = target.scale.y;
  } else {
    if (props.scaleX !== undefined) proxy.scaleX = target.scale.x;
    if (props.scaleY !== undefined) proxy.scaleY = target.scale.y;
  }
  return proxy;
}

function createEndValues(props: TweenProps): Record<string, number> {
  const end: Record<string, number> = {};
  if (props.x !== undefined) end.x = props.x;
  if (props.y !== undefined) end.y = props.y;
  if (props.alpha !== undefined) end.alpha = props.alpha;
  if (props.rotation !== undefined) end.rotation = props.rotation;
  if (props.scale !== undefined) {
    end.scaleX = props.scale;
    end.scaleY = props.scale;
  } else {
    if (props.scaleX !== undefined) end.scaleX = props.scaleX;
    if (props.scaleY !== undefined) end.scaleY = props.scaleY;
  }
  return end;
}

// ===== TweenManager Singleton =====

class TweenManagerClass {
  private bound = false;

  /** Bind to PixiJS ticker (no-op: gsap uses its own rAF loop) */
  bind(_ticker: Ticker): void {
    this.bound = true;
  }

  /** Tween from current values to props */
  to(target: Container, props: TweenProps, config: TweenConfig): TweenInstance {
    const proxy = createProxy(target, props);
    const endValues = createEndValues(props);
    const tween = gsap.to(proxy, {
      ...endValues,
      duration: config.duration,
      delay: config.delay ?? 0,
      ease: config.ease ?? Ease.easeOut,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onComplete: config.onComplete,
      onUpdate: () => {
        applyProxy(target, proxy);
        config.onUpdate?.(tween.progress());
      },
    });
    return { kill: () => tween.kill() };
  }

  /** Tween from props to current values */
  from(target: Container, props: TweenProps, config: TweenConfig): TweenInstance {
    const proxy = createProxy(target, props);
    const endValues = createEndValues(props);
    // Swap: start from endValues, tween to current (proxy)
    const startValues = { ...endValues };
    const targetValues = { ...proxy };
    // Apply start values immediately
    Object.assign(proxy, startValues);
    applyProxy(target, proxy);

    const tween = gsap.to(proxy, {
      ...targetValues,
      duration: config.duration,
      delay: config.delay ?? 0,
      ease: config.ease ?? Ease.easeOut,
      repeat: config.repeat ?? 0,
      yoyo: config.yoyo ?? false,
      onStart: config.onStart,
      onComplete: config.onComplete,
      onUpdate: () => {
        applyProxy(target, proxy);
        config.onUpdate?.(tween.progress());
      },
    });
    return { kill: () => tween.kill() };
  }

  /** Screen shake with decay */
  shake(target: Container, intensity = 8, duration = 0.55): void {
    const ox = target.x;
    const oy = target.y;
    const tl = gsap.timeline();
    const steps = 8;
    const stepDur = duration / steps;

    for (let i = 0; i < steps; i++) {
      const factor = 1 - i / steps;
      const dx = (Math.random() - 0.5) * 2 * intensity * factor;
      const dy = (Math.random() - 0.5) * intensity * 0.6 * factor;
      tl.to(target, { x: ox + dx, y: oy + dy, duration: stepDur, ease: 'none' });
    }
    tl.to(target, { x: ox, y: oy, duration: stepDur, ease: Ease.easeOut });
  }

  /** Alpha flash (hit feedback) */
  flash(target: Container, duration = 0.4): void {
    const orig = target.alpha;
    const tl = gsap.timeline();
    tl.to(target, { alpha: 0.2, duration: duration * 0.12, ease: 'none' });
    tl.to(target, { alpha: 1, duration: duration * 0.12, ease: 'none' });
    tl.to(target, { alpha: 0.4, duration: duration * 0.15, ease: 'none' });
    tl.to(target, { alpha: orig, duration: duration * 0.3, ease: Ease.easeOut });
  }

  /** Bounce (jump up + settle) */
  bounce(target: Container, height = 18, duration = 0.3): void {
    const baseY = target.y;
    const tl = gsap.timeline();
    tl.to(target, { y: baseY - height, duration: duration * 0.4, ease: Ease.easeOut });
    tl.to(target, { y: baseY, duration: duration * 0.6, ease: Ease.easeOutBounce });
  }

  /** Death dissolve (fade + squash + drop) */
  deathDissolve(target: Container, duration = 0.8, onComplete?: () => void): void {
    const proxy = { scaleX: target.scale.x, scaleY: target.scale.y };
    gsap.to(target, { alpha: 0, y: target.y + 20, duration, ease: Ease.easeIn, onComplete });
    gsap.to(proxy, {
      scaleX: 1.4, scaleY: 0.5, duration, ease: Ease.easeIn,
      onUpdate: () => { target.scale.x = proxy.scaleX; target.scale.y = proxy.scaleY; },
    });
  }

  /** Kill all tweens on a specific target */
  killTweensOf(target: Container): void {
    gsap.killTweensOf(target);
  }

  /** Kill all active tweens */
  killAll(): void {
    gsap.globalTimeline.clear();
  }
}

export const TweenManager = new TweenManagerClass();