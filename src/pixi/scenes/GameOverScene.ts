/**
 * GameOverScene.ts - Death settlement screen (PixiJS)
 *
 * Replicates GameOverScreen.tsx:
 * - Boss pixel sprite + taunt quote bubble
 * - Title "黑暗吞噬"
 * - Location: 第X章 · 章节名 / 第Y层
 * - Stats cards (击败敌人/击败BOSS/总伤害/最高单伤/获得遗物/获得魂晶/获得金币)
 * - Soul shard settlement (保留/损失/永久账户)
 * - [好的] 返回主页 button
 * - Red vignette + dark atmosphere
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

const W = 720, H = 1280;

const CHAPTER_NAMES = ['\u5e7d\u6697\u68ee\u6797', '\u51b0\u5c01\u5c71\u8109', '\u7194\u5ca9\u6df1\u6e0a', '\u6697\u5f71\u8981\u585e', '\u6c38\u6052\u4e4b\u5dc5'];
const CHAPTER_COLORS: Record<number, number> = { 1: 0xe06030, 2: 0x4898e8, 3: 0xf09030, 4: 0xc060e8, 5: 0xe8c840 };

interface StatEntry { icon: string; label: string; value: string | number; color: number }

export class GameOverScene implements GameScene {
  container: Container;
  private gameApp!: GameApp;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.build();
  }

  onExit() { this.container.removeChildren(); }

  private build() {
    this.container.removeChildren();
    const game = this.gameApp.game as any;
    const stats = game.stats || {};
    const chapter = game.chapter || 1;
    const floor = game.currentFloor || 1;
    const chapterName = CHAPTER_NAMES[chapter - 1] || '\u672a\u77e5\u4e4b\u5730';
    const chapterColor = CHAPTER_COLORS[chapter] || 0xe06030;

    // Dark red background
    const bg = new Graphics();
    bg.beginFill(0x0a0202); bg.drawRect(0, 0, W, H); bg.endFill();
    this.container.addChild(bg);

    // Red vignette edges
    const vignette = new Graphics();
    vignette.drawRect(0, 0, W * 0.08, H); vignette.beginFill(0x200404, 0.4); vignette.endFill();
    vignette.drawRect(W * 0.92, 0, W * 0.08, H); vignette.beginFill(0x200404, 0.4); vignette.endFill();
    vignette.drawRect(0, 0, W, H * 0.05); vignette.beginFill(0x200404, 0.3); vignette.endFill();
    vignette.drawRect(0, H * 0.95, W, H * 0.05); vignette.beginFill(0x200404, 0.3); vignette.endFill();
    this.container.addChild(vignette);

    // Skull icon (simplified pixel art)
    const skull = createText('\ud83d\udc80', { size: 48 });
    skull.anchor.set(0.5); skull.x = W / 2; skull.y = 100;
    skull.alpha = 0;
    TweenManager.to(skull, { alpha: 1 }, { duration: 0.8, delay: 0.3, ease: Ease.easeOut });
    this.container.addChild(skull);

    // Title
    const title = createText('\u9ed1\u6697\u541e\u566c', { size: 28, color: COLORS.red, bold: true });
    title.anchor.set(0.5); title.x = W / 2; title.y = 160;
    title.alpha = 0;
    TweenManager.to(title, { alpha: 1 }, { duration: 0.6, delay: 0.5, ease: Ease.easeOut });
    this.container.addChild(title);

    // Location
    const locText = createText(`\u7b2c ${chapter} \u7ae0 \u00b7 ${chapterName} / \u7b2c ${floor} \u5c42`, {
      size: 11, color: chapterColor,
    });
    locText.anchor.set(0.5); locText.x = W / 2; locText.y = 200;
    this.container.addChild(locText);

    // Separator
    const sep = new Graphics();
    sep.beginFill(COLORS.panelBorder );

    sep.drawRect(W * 0.2, 225, W * 0.6, 1);

    sep.endFill();
    this.container.addChild(sep);

    // Stats section title
    const statsTitle = createText('\u82f1\u52c7\u4e8b\u8ff9', { size: 12, color: COLORS.textDim, bold: true });
    statsTitle.anchor.set(0.5); statsTitle.x = W / 2; statsTitle.y = 245;
    this.container.addChild(statsTitle);

    // Stats entries
    const statEntries: StatEntry[] = [
      { icon: '\u2694', label: '\u51fb\u8d25\u654c\u4eba', value: stats.enemiesKilled || 0, color: COLORS.textBright },
      { icon: '\ud83d\udc51', label: '\u51fb\u8d25 BOSS', value: stats.bossesKilled || 0, color: COLORS.gold },
      { icon: '\ud83d\udca5', label: '\u603b\u4f24\u5bb3', value: stats.totalDamageDealt || 0, color: COLORS.red },
      { icon: '\ud83c\udfaf', label: '\u6700\u9ad8\u5355\u4f24', value: stats.maxSingleHit || 0, color: COLORS.orange },
      { icon: '\ud83d\udd2e', label: '\u83b7\u5f97\u9057\u7269', value: (game.relics || []).length, color: COLORS.purple },
      { icon: '\ud83d\udc8e', label: '\u83b7\u5f97\u9b42\u6676', value: stats.soulsEarned || game.souls || 0, color: COLORS.blue },
      { icon: '\ud83d\udcb0', label: '\u83b7\u5f97\u91d1\u5e01', value: stats.goldEarned || 0, color: COLORS.gold },
    ];

    const startY = 275;
    const rowH = 36;
    statEntries.forEach((entry, i) => {
      const row = this.createStatRow(entry, W - 100);
      row.x = 50; row.y = startY + i * rowH;
      row.alpha = 0;
      TweenManager.to(row, { alpha: 1 }, { duration: 0.3, delay: 0.8 + i * 0.08, ease: Ease.easeOut });
      this.container.addChild(row);
    });

    // Soul settlement section
    const soulY = startY + statEntries.length * rowH + 30;
    const soulSep = new Graphics();
    soulSep.beginFill(COLORS.panelBorder );

    soulSep.drawRect(W * 0.15, soulY, W * 0.7, 1);

    soulSep.endFill();
    this.container.addChild(soulSep);

    const soulTitle = createText('\ud83d\udc8e \u9b42\u6676\u7ed3\u7b97', { size: 12, color: COLORS.blue, bold: true });
    soulTitle.anchor.set(0.5); soulTitle.x = W / 2; soulTitle.y = soulY + 16;
    this.container.addChild(soulTitle);

    const soulsEarned = stats.soulsEarned || game.souls || 0;
    const soulsKept = Math.floor(soulsEarned * 0.5); // 50% retained on death
    const soulsLost = soulsEarned - soulsKept;

    const soulRows = [
      { label: '\u672c\u5c40\u83b7\u5f97', value: `${soulsEarned}`, color: COLORS.blue },
      { label: '\u6492\u7f57\u4fdd\u7559 (50%)', value: `${soulsKept}`, color: COLORS.green },
      { label: '\u635f\u5931', value: `-${soulsLost}`, color: COLORS.red },
    ];

    soulRows.forEach((sr, i) => {
      const label = createText(sr.label, { size: 10, color: COLORS.textDim });
      label.x = 100; label.y = soulY + 40 + i * 22;
      this.container.addChild(label);
      const val = createText(sr.value, { size: 11, color: sr.color, bold: true });
      val.x = W - 160; val.y = soulY + 40 + i * 22;
      this.container.addChild(val);
    });

    // Return button
    const returnBtn = createButton('\u597d\u7684\uff0c\u8fd4\u56de\u4e3b\u9875', 300, 48, { variant: 'primary', fontSize: 14 });
    returnBtn.x = (W - 300) / 2; returnBtn.y = H - 100;
    returnBtn.alpha = 0;
    TweenManager.to(returnBtn, { alpha: 1 }, { duration: 0.4, delay: 1.5, ease: Ease.easeOut });
    returnBtn.on('pointertap', () => {
      this.gameApp.sceneManager.switchTo('start');
    });
    this.container.addChild(returnBtn);
  }

  private createStatRow(entry: StatEntry, width: number): Container {
    const row = new Container();
    // Bottom border
    const border = new Graphics();
    border.beginFill(COLORS.panelBorder, 0.3 );

    border.drawRect(0, 34, width, 1);

    border.endFill();
    row.addChild(border);

    // Icon + label
    const iconLabel = createText(`${entry.icon} ${entry.label}`, { size: 11, color: COLORS.text });
    iconLabel.x = 0; iconLabel.y = 8;
    row.addChild(iconLabel);

    // Value
    const value = createText(String(entry.value), { size: 13, color: entry.color, bold: true });
    value.anchor.set(1, 0); value.x = width; value.y = 7;
    row.addChild(value);

    return row;
  }
}