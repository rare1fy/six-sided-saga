/**
 * VictoryScene.ts - Game completion victory screen (PixiJS)
 *
 * Replicates VictoryScreen.tsx:
 * - Gold particle burst background
 * - Trophy icon + "胜利!" title
 * - Run statistics (total damage, enemies killed, bosses, highest hit, etc.)
 * - Dice collection summary
 * - Relic collection summary
 * - "返回主页" button
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';
import { ParticleEmitter, PARTICLE_PRESETS } from '../animation/Particles';

const W = 720, H = 1280;

interface StatRow { icon: string; label: string; value: string | number; color: number }

export class VictoryScene implements GameScene {
  container: Container;
  private gameApp!: GameApp;
  private particles: ParticleEmitter[] = [];

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.build();
  }

  onExit() {
    this.particles.forEach(p => p.destroy());
    this.particles = [];
    this.container.removeChildren();
  }

  private build() {
    this.container.removeChildren();
    const game = this.gameApp.game as any;
    const stats = game.stats || {};

    // Dark gold background
    const bg = new Graphics();
    bg.beginFill(0x0a0a02); bg.drawRect(0, 0, W, H); bg.endFill();
    this.container.addChild(bg);

    // Gold glow center
    const glow = new Graphics();
    glow.beginFill(COLORS.gold, 0.06 );

    glow.drawCircle(W / 2, H * 0.18, 120);

    glow.endFill();
    glow.beginFill(COLORS.gold, 0.04 );

    glow.drawCircle(W / 2, H * 0.18, 60);

    glow.endFill();
    this.container.addChild(glow);

    // Spawn gold particles
    const particleConfig = PARTICLE_PRESETS.critical();
    const emitter = new ParticleEmitter(W / 2, H * 0.18, { ...particleConfig, count: 20, lifetime: 3.0 });
    this.container.addChild(emitter.container);
    this.particles.push(emitter);

    // Trophy icon
    const trophy = createText('\ud83c\udfc6', { size: 56 });
    trophy.anchor.set(0.5); trophy.x = W / 2; trophy.y = H * 0.15;
    trophy.alpha = 0; trophy.scale.set(0.3);
    TweenManager.to(trophy, { alpha: 1, scaleX: 1, scaleY: 1 }, {
      duration: 0.6, delay: 0.3, ease: Ease.easeOutBack,
    });
    this.container.addChild(trophy);

    // Title
    const title = createText('\u80dc\u5229\uff01', { size: 36, color: COLORS.gold, bold: true });
    title.anchor.set(0.5); title.x = W / 2; title.y = H * 0.23;
    title.alpha = 0;
    TweenManager.to(title, { alpha: 1 }, { duration: 0.5, delay: 0.5, ease: Ease.easeOut });
    this.container.addChild(title);

    const subtitle = createText('\u4f60\u5f81\u670d\u4e86\u6240\u6709\u5c42\u7ea7\uff01', { size: 12, color: COLORS.textDim });
    subtitle.anchor.set(0.5); subtitle.x = W / 2; subtitle.y = H * 0.27;
    this.container.addChild(subtitle);

    // Separator
    const sep = new Graphics();
    sep.beginFill(COLORS.gold, 0.3 );

    sep.drawRect(W * 0.2, H * 0.30, W * 0.6, 1);

    sep.endFill();
    this.container.addChild(sep);

    // Stats
    const statEntries: StatRow[] = [
      { icon: '\u2694', label: '\u51fb\u8d25\u654c\u4eba', value: stats.enemiesKilled || 0, color: COLORS.textBright },
      { icon: '\ud83d\udc51', label: '\u51fb\u8d25 BOSS', value: stats.bossesKilled || 0, color: COLORS.gold },
      { icon: '\ud83d\udca5', label: '\u603b\u4f24\u5bb3', value: stats.totalDamageDealt || 0, color: COLORS.red },
      { icon: '\ud83c\udfaf', label: '\u6700\u9ad8\u5355\u4f24', value: stats.maxSingleHit || 0, color: COLORS.orange },
      { icon: '\ud83d\udee1', label: '\u603b\u62a4\u7532', value: stats.totalArmorGained || 0, color: COLORS.blue },
      { icon: '\u2764', label: '\u603b\u6cbb\u7597', value: stats.totalHealDone || 0, color: COLORS.green },
      { icon: '\ud83d\udd2e', label: '\u6536\u96c6\u9057\u7269', value: (game.relics || []).length, color: COLORS.purple },
      { icon: '\ud83c\udfb2', label: '\u6536\u96c6\u9ab0\u5b50', value: (game.ownedDice || []).length, color: COLORS.orange },
    ];

    const startY = H * 0.33;
    const rowH = 34;
    statEntries.forEach((entry, i) => {
      const row = this.createStatRow(entry, W - 120);
      row.x = 60; row.y = startY + i * rowH;
      row.alpha = 0;
      TweenManager.to(row, { alpha: 1 }, { duration: 0.3, delay: 0.8 + i * 0.06, ease: Ease.easeOut });
      this.container.addChild(row);
    });

    // Return button
    const returnBtn = createButton('\u8fd4\u56de\u4e3b\u9875', 300, 48, { variant: 'primary', fontSize: 14 });
    returnBtn.x = (W - 300) / 2; returnBtn.y = H - 100;
    returnBtn.alpha = 0;
    TweenManager.to(returnBtn, { alpha: 1 }, { duration: 0.4, delay: 1.5, ease: Ease.easeOut });
    returnBtn.on('pointertap', () => {
      this.gameApp.sceneManager.switchTo('start');
    });
    this.container.addChild(returnBtn);
  }

  private createStatRow(entry: StatRow, width: number): Container {
    const row = new Container();
    const border = new Graphics();
    border.beginFill(COLORS.panelBorder, 0.3 );

    border.drawRect(0, 32, width, 1);

    border.endFill();
    row.addChild(border);

    const iconLabel = createText(`${entry.icon} ${entry.label}`, { size: 11, color: COLORS.text });
    iconLabel.x = 0; iconLabel.y = 8;
    row.addChild(iconLabel);

    const value = createText(String(entry.value), { size: 13, color: entry.color, bold: true });
    value.anchor.set(1, 0); value.x = width; value.y = 7;
    row.addChild(value);

    return row;
  }
}