/**
 * SceneTransition.ts - Scene transition effects (PixiJS)
 *
 * Replicates from ChapterTransition / DeathTransition:
 * - Fade to black / fade from black
 * - Chapter title card (chapter number + location name)
 * - Death screen (red vignette + skull + "You Died")
 * - Victory screen (gold burst + "Victory!")
 * - Slide transitions (left/right)
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createButton, COLORS } from '../UIFactory';
import { TweenManager, Ease } from './Tween';

const W = 720;
const H = 1280;

/** Simple fade to black, execute callback, fade back */
export function fadeTransition(
  parent: Container,
  duration: number = 0.6,
  onMidpoint?: () => void,
  onComplete?: () => void,
): void {
  const overlay = new Graphics();
  overlay.beginFill(0x000000, 1);
    overlay.drawRect(0, 0, W, H);
    overlay.endFill();
  overlay.alpha = 0;
  overlay.zIndex = 999;
  parent.addChild(overlay);

  // Fade in
  TweenManager.to(overlay as any, { alpha: 1 }, {
    duration: duration * 0.5,
    ease: Ease.easeIn,
    onComplete: () => {
      onMidpoint?.();
      // Fade out
      TweenManager.to(overlay as any, { alpha: 0 }, {
        duration: duration * 0.5,
        ease: Ease.easeOut,
        onComplete: () => {
          parent.removeChild(overlay);
          overlay.destroy();
          onComplete?.();
        },
      });
    },
  });
}

/** Chapter transition card (enhanced: rewards + continue button) */
export function showChapterTransition(
  parent: Container,
  chapter: number,
  locationName: string,
  opts?: { healAmount?: number; bonusGold?: number; nextChapterName?: string },
  onContinue?: () => void,
  onComplete?: () => void,
): void {
  const card = new Container();
  card.zIndex = 998;

  // Full dark background
  const bg = new Graphics();
  bg.beginFill(0x0a0a0a, 1);
  bg.drawRect(0, 0, W, H);
  bg.endFill();
  card.addChild(bg);

  // Decorative gold lines
  const topLine = new Graphics();
  topLine.beginFill(COLORS.gold, 0.4);
  topLine.drawRect(W * 0.15, H * 0.34, W * 0.7, 2);
  topLine.endFill();
  card.addChild(topLine);

  const bottomLine = new Graphics();
  bottomLine.beginFill(COLORS.gold, 0.4);
  bottomLine.drawRect(W * 0.15, H * 0.62, W * 0.7, 2);
  bottomLine.endFill();
  card.addChild(bottomLine);

  // "章节完成"
  const doneLabel = createText('\u7ae0\u8282\u5b8c\u6210', {
    size: 11, color: COLORS.textDim,
  });
  doneLabel.anchor.set(0.5);
  doneLabel.x = W / 2; doneLabel.y = H * 0.37;
  card.addChild(doneLabel);

  // 章节名
  const locText = createText(locationName, {
    size: 28, color: COLORS.gold, bold: true,
  });
  locText.anchor.set(0.5);
  locText.x = W / 2; locText.y = H * 0.42;
  card.addChild(locText);

  // 奖励
  let rewardY = H * 0.48;
  if (opts?.healAmount || opts?.bonusGold) {
    const rewardLabel = createText('\u5956\u52b1', { size: 10, color: COLORS.textDim });
    rewardLabel.anchor.set(0.5);
    rewardLabel.x = W / 2; rewardLabel.y = rewardY;
    card.addChild(rewardLabel);
    rewardY += 22;

    if (opts.healAmount) {
      const healText = createText(`+${opts.healAmount} HP`, { size: 14, color: 0x3cc864, bold: true });
      healText.anchor.set(0.5);
      healText.x = W / 2 - 50; healText.y = rewardY;
      card.addChild(healText);
    }
    if (opts.bonusGold) {
      const goldText = createText(`+${opts.bonusGold} \u91d1\u5e01`, { size: 14, color: COLORS.gold, bold: true });
      goldText.anchor.set(0.5);
      goldText.x = W / 2 + 50; goldText.y = rewardY;
      card.addChild(goldText);
    }
    rewardY += 30;
  }

  // 即将进入
  if (opts?.nextChapterName) {
    const nextLabel = createText('\u5373\u5c06\u8fdb\u5165', { size: 10, color: COLORS.textDim });
    nextLabel.anchor.set(0.5);
    nextLabel.x = W / 2; nextLabel.y = rewardY;
    card.addChild(nextLabel);

    const nextName = createText(opts.nextChapterName, { size: 16, color: 0x60d0e0, bold: true });
    nextName.anchor.set(0.5);
    nextName.x = W / 2; nextName.y = rewardY + 22;
    card.addChild(nextName);
  }

  // 继续按钮
  if (onContinue) {
    const btn = createButton('\u7ee7\u7eed\u524d\u8fdb', 280, 48, { variant: 'primary', fontSize: 15 });
    btn.x = (W - 280) / 2;
    btn.y = H * 0.58 - 30;
    btn.on('pointertap', () => {
      TweenManager.to(card, { alpha: 0 }, {
        duration: 0.5, ease: Ease.easeIn,
        onComplete: () => {
          parent.removeChild(card);
          card.destroy({ children: true });
          onContinue();
        },
      });
    });
    card.addChild(btn);
  }

  card.alpha = 0;
  parent.addChild(card);

  TweenManager.to(card, { alpha: 1 }, { duration: 0.5, ease: Ease.easeOut });

  // 如果没有按钮，自动消失
  if (!onContinue) {
    TweenManager.to(card, { alpha: 0 }, {
      duration: 0.8, delay: 2.5, ease: Ease.easeIn,
      onComplete: () => {
        parent.removeChild(card);
        card.destroy({ children: true });
        onComplete?.();
      },
    });
  }
}

/** Death screen (enhanced with stats + restart button) */
export function showDeathScreen(
  parent: Container,
  stats?: { totalDamage?: number; enemiesKilled?: number; floor?: number },
  onRestart?: () => void,
  onComplete?: () => void,
): void {
  const screen = new Container();
  screen.zIndex = 998;

  // Dark red background
  const bg = new Graphics();
  bg.beginFill(0x0a0202, 1);
  bg.drawRect(0, 0, W, H);
  bg.endFill();
  screen.addChild(bg);

  // Red vignette
  const vignette = new Graphics();
  vignette.beginFill(0x200404, 0.5);
  vignette.drawRect(0, 0, W, H);
  vignette.endFill();
  vignette.beginFill(0x400808, 0.3);
  vignette.drawRect(0, 0, W * 0.1, H);
  vignette.endFill();
  vignette.beginFill(0x400808, 0.3);
  vignette.drawRect(W * 0.9, 0, W * 0.1, H);
  vignette.endFill();
  screen.addChild(vignette);

  // Skull icon (pixel art)
  const skull = new Graphics();
  const skullPx = [
    [3,0,4,1,0xcccccc],[4,0,2,1,0xdddddd],[3,1,6,1,0xcccccc],
    [2,2,8,1,0xbbbbbb],[2,3,2,1,0x222222],[6,3,2,1,0x222222],
    [2,4,8,1,0xaaaaaa],[3,5,1,1,0x222222],[5,5,2,1,0x222222],
    [8,5,1,1,0x222222],[3,6,6,1,0x999999],
  ];
  for (const [px,py,pw,ph,pc] of skullPx) {
    skull.beginFill(pc, 1);
    skull.drawRect(px * 6, py * 6, pw * 6, ph * 6);
    skull.endFill();
  }
  skull.x = W / 2 - 36;
  skull.y = H * 0.32;
  screen.addChild(skull);

  // "你死了"
  const deathText = createText('\u4f60\u6b7b\u4e86', {
    size: 36, color: COLORS.red, bold: true,
  });
  deathText.anchor.set(0.5);
  deathText.x = W / 2;
  deathText.y = H * 0.44;
  screen.addChild(deathText);

  // 统计数据
  if (stats) {
    let statY = H * 0.52;
    const statEntries: [string, string | number][] = [];
    if (stats.floor != null) statEntries.push(['\u5230\u8fbe\u5c42\u6570', stats.floor]);
    if (stats.enemiesKilled != null) statEntries.push(['\u51fb\u6740\u654c\u4eba', stats.enemiesKilled]);
    if (stats.totalDamage != null) statEntries.push(['\u603b\u4f24\u5bb3', stats.totalDamage]);

    for (const [label, value] of statEntries) {
      const lbl = createText(label, { size: 11, color: COLORS.textDim });
      lbl.anchor.set(1, 0.5); lbl.x = W / 2 - 10; lbl.y = statY;
      screen.addChild(lbl);
      const val = createText(String(value), { size: 13, color: COLORS.textBright, bold: true });
      val.anchor.set(0, 0.5); val.x = W / 2 + 10; val.y = statY;
      screen.addChild(val);
      statY += 24;
    }
  }

  // 重新开始按钮
  if (onRestart) {
    const btn = createButton('\u91cd\u65b0\u5f00\u59cb', 280, 48, { variant: 'danger', fontSize: 15 });
    btn.x = (W - 280) / 2;
    btn.y = H * 0.68;
    btn.on('pointertap', () => {
      TweenManager.to(screen, { alpha: 0 }, {
        duration: 0.5, ease: Ease.easeIn,
        onComplete: () => {
          parent.removeChild(screen);
          screen.destroy({ children: true });
          onRestart();
        },
      });
    });
    screen.addChild(btn);
  }

  screen.alpha = 0;
  parent.addChild(screen);

  TweenManager.to(screen, { alpha: 1 }, { duration: 1.0, ease: Ease.easeIn });

  // 如果没有按钮，自动消失
  if (!onRestart) {
    TweenManager.to(screen, { alpha: 0 }, {
      duration: 1.0, delay: 3.0, ease: Ease.easeOut,
      onComplete: () => {
        parent.removeChild(screen);
        screen.destroy({ children: true });
        onComplete?.();
      },
    });
  }
}

/** Victory screen (enhanced with gold burst + stats) */
export function showVictoryScreen(
  parent: Container,
  stats?: { totalDamage?: number; turnsPlayed?: number; enemiesKilled?: number },
  onContinue?: () => void,
  onComplete?: () => void,
): void {
  const screen = new Container();
  screen.zIndex = 998;

  const bg = new Graphics();
  bg.beginFill(0x0a0a02, 1);
  bg.drawRect(0, 0, W, H);
  bg.endFill();
  screen.addChild(bg);

  // Gold glow rings
  for (let r = 160; r >= 40; r -= 40) {
    const glow = new Graphics();
    glow.beginFill(COLORS.gold, 0.03 + (160 - r) * 0.001);
    glow.drawCircle(W / 2, H * 0.38, r);
    glow.endFill();
    screen.addChild(glow);
  }

  // Gold particle decorations
  for (let i = 0; i < 8; i++) {
    const p = new Graphics();
    p.beginFill(COLORS.gold, 0.6);
    p.drawCircle(0, 0, 2);
    p.endFill();
    const angle = (i / 8) * Math.PI * 2;
    p.x = W / 2 + Math.cos(angle) * 80;
    p.y = H * 0.38 + Math.sin(angle) * 80;
    screen.addChild(p);
  }

  const victoryText = createText('\u80dc\u5229\uff01', {
    size: 42, color: COLORS.gold, bold: true,
  });
  victoryText.anchor.set(0.5);
  victoryText.x = W / 2;
  victoryText.y = H * 0.38;
  screen.addChild(victoryText);

  const subText = createText('\u2014 \u5f81\u7a0b\u5b8c\u6210 \u2014', {
    size: 12, color: COLORS.textDim,
  });
  subText.anchor.set(0.5);
  subText.x = W / 2; subText.y = H * 0.44;
  screen.addChild(subText);

  // 统计
  if (stats) {
    let statY = H * 0.50;
    const entries: [string, string | number][] = [];
    if (stats.enemiesKilled != null) entries.push(['\u51fb\u6740\u654c\u4eba', stats.enemiesKilled]);
    if (stats.totalDamage != null) entries.push(['\u603b\u4f24\u5bb3', stats.totalDamage]);
    if (stats.turnsPlayed != null) entries.push(['\u603b\u56de\u5408\u6570', stats.turnsPlayed]);

    for (const [label, value] of entries) {
      const lbl = createText(label, { size: 11, color: COLORS.textDim });
      lbl.anchor.set(1, 0.5); lbl.x = W / 2 - 10; lbl.y = statY;
      screen.addChild(lbl);
      const val = createText(String(value), { size: 14, color: COLORS.gold, bold: true });
      val.anchor.set(0, 0.5); val.x = W / 2 + 10; val.y = statY;
      screen.addChild(val);
      statY += 26;
    }
  }

  // 继续按钮
  if (onContinue) {
    const btn = createButton('\u8fd4\u56de\u9996\u9875', 280, 48, { variant: 'gold', fontSize: 15 });
    btn.x = (W - 280) / 2;
    btn.y = H * 0.68;
    btn.on('pointertap', () => {
      TweenManager.to(screen, { alpha: 0 }, {
        duration: 0.5, ease: Ease.easeIn,
        onComplete: () => {
          parent.removeChild(screen);
          screen.destroy({ children: true });
          onContinue();
        },
      });
    });
    screen.addChild(btn);
  }

  screen.alpha = 0;
  parent.addChild(screen);

  TweenManager.to(screen, { alpha: 1 }, { duration: 0.6, ease: Ease.easeOut });

  if (!onContinue) {
    TweenManager.to(screen, { alpha: 0 }, {
      duration: 0.8, delay: 2.0, ease: Ease.easeOut,
      onComplete: () => {
        parent.removeChild(screen);
        screen.destroy({ children: true });
        onComplete?.();
      },
    });
  }
}
