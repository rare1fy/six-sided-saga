/**
 * SkillSelectScene.ts - Pre-battle relic selection (PixiJS)
 *
 * Replicates SkillSelectScreen.tsx:
 * - Title "战前准备 · 选择遗物"
 * - Branch path visual (SVG-like connecting lines)
 * - 3 relic cards with icon, name, description, rarity, HP cost
 * - Tap to select + confirm
 * - "跳过，直接战斗" button
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

const W = 720, H = 1280;

const RARITY_COLORS: Record<string, number> = {
  common: 0x34d399,
  uncommon: 0x60a5fa,
  rare: 0xa855f7,
  legendary: 0xf97316,
};

const RARITY_LABELS: Record<string, string> = {
  common: '\u666e\u901a',
  uncommon: '\u7cbe\u826f',
  rare: '\u7a00\u6709',
  legendary: '\u4f20\u8bf4',
};

interface RelicChoice {
  id: string;
  name: string;
  description: string;
  rarity: string;
  icon?: string;
}

export class SkillSelectScene implements GameScene {
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
    const choices: RelicChoice[] = game.startingRelicChoices || [];

    // Background gradient
    const bg = new Graphics();
    bg.beginFill(0x0a0612); bg.drawRect(0, 0, W, H); bg.endFill();
    this.container.addChild(bg);

    // Subtle cracks pattern
    const cracks = new Graphics();
    cracks.alpha = 0.2;
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      cracks.moveTo(sx, sy);
      cracks.lineTo(sx + (Math.random() - 0.5) * 100, sy + Math.random() * 60);
      cracks.lineStyle(1, 0x2a1840);
    }
    this.container.addChild(cracks);

    // Title section
    const titleBadge = createText('\u25c6 \u6218\u524d\u51c6\u5907 \u25c6', { size: 11, color: COLORS.purple, bold: true });
    titleBadge.anchor.set(0.5); titleBadge.x = W / 2; titleBadge.y = 60;
    this.container.addChild(titleBadge);

    const title = createText('\u9009\u62e9\u9057\u7269', { size: 20, color: COLORS.textBright, bold: true });
    title.anchor.set(0.5); title.x = W / 2; title.y = 88;
    this.container.addChild(title);

    const subtitle = createText('\u9009\u62e9\u4e00\u4ef6\u9057\u7269\u4f34\u4f60\u8e0f\u4e0a\u5f81\u9014', { size: 11, color: COLORS.textDim });
    subtitle.anchor.set(0.5); subtitle.x = W / 2; subtitle.y = 115;
    this.container.addChild(subtitle);

    // Branch path visual
    const pathContainer = new Container();
    pathContainer.y = 140;
    // Center dot
    const centerDot = new Graphics();
    centerDot.beginFill(0x44cccc, 0.8); centerDot.drawCircle(W / 2, 10, 5); centerDot.endFill();
    centerDot.beginFill(COLORS.textBright );

    centerDot.drawCircle(W / 2, 10, 3);

    centerDot.endFill();
    pathContainer.addChild(centerDot);

    // Branch lines to each card
    const cardCount = choices.length || 3;
    const cardW = 200;
    const totalCardsW = cardCount * cardW + (cardCount - 1) * 12;
    const cardsStartX = (W - totalCardsW) / 2;

    for (let i = 0; i < cardCount; i++) {
      const endX = cardsStartX + i * (cardW + 12) + cardW / 2;
      const line = new Graphics();
      line.moveTo(W / 2, 15);
      line.lineStyle(2, COLORS.purple, 0.5);
      line.quadraticCurveTo(W / 2 + (endX - W / 2) * 0.3, 35, endX, 55);
      // End node
      line.beginFill(0x14101e); line.drawCircle(endX, 55, 6); line.endFill();
      line.lineStyle(2 , COLORS.purple);

      line.drawCircle(endX, 55, 6);
      line.beginFill(COLORS.purple, 0.6 );

      line.drawCircle(endX, 55, 3);

      line.endFill();
      pathContainer.addChild(line);
    }
    this.container.addChild(pathContainer);

    // Relic cards
    const cardsY = 220;
    choices.forEach((relic, i) => {
      const card = this.createRelicCard(relic, cardW, 420);
      card.x = cardsStartX + i * (cardW + 12);
      card.y = cardsY;
      // Staggered entrance
      card.alpha = 0; card.y = cardsY + 30;
      TweenManager.to(card, { alpha: 1, y: cardsY }, {
        duration: 0.4, delay: 0.5 + i * 0.15, ease: Ease.easeOutBack,
      });
      this.container.addChild(card);
    });

    // Skip button
    const skipBtn = createButton('\u8df3\u8fc7\uff0c\u76f4\u63a5\u6218\u6597', W - 80, 40, {
      bg: 0x1a1a1a, border: 0x333333, textColor: COLORS.textDim, fontSize: 12,
    });
    skipBtn.x = 40; skipBtn.y = H - 80;
    skipBtn.alpha = 0;
    TweenManager.to(skipBtn, { alpha: 0.7 }, { duration: 0.3, delay: 1.0, ease: Ease.easeOut });
    skipBtn.on('pointertap', () => {
      const g = this.gameApp.game as any;
      g.phase = 'battle';
      this.gameApp.setGame({ ...g });
      this.gameApp.sceneManager.switchTo('battle');
    });
    this.container.addChild(skipBtn);
  }

  private createRelicCard(relic: RelicChoice, w: number, h: number): Container {
    const card = new Container();
    const rarityColor = RARITY_COLORS[relic.rarity] || RARITY_COLORS.common;

    // Card background
    const bg = createPanel(w, h, {
      bg: 0x14101e, border: 0x2a2535, borderWidth: 1, radius: 3,
    });
    card.addChild(bg);

    // Hover gradient overlay (hidden)
    const hoverOverlay = new Graphics();
    hoverOverlay.beginFill(COLORS.purple, 0.08 );

    hoverOverlay.drawRoundedRect(0, 0, w, h, 3);

    hoverOverlay.endFill();
    hoverOverlay.visible = false;
    card.addChild(hoverOverlay);

    // Icon box
    const iconBox = new Graphics();
    iconBox.drawRoundedRect((w - 44) / 2, 20, 44, 44, 2);
    iconBox.beginFill(0x0a0810); iconBox.endFill();
    iconBox.drawRoundedRect((w - 44) / 2, 20, 44, 44, 2);
    iconBox.lineStyle(2, 0x2a2535);
    card.addChild(iconBox);

    const icon = createText(relic.icon || '\ud83d\udd2e', { size: 22 });
    icon.anchor.set(0.5, 0.5); icon.x = w / 2; icon.y = 42;
    card.addChild(icon);

    // Name
    const name = createText(relic.name, { size: 12, color: COLORS.textBright, bold: true });
    name.anchor.set(0.5); name.x = w / 2; name.y = 80;
    card.addChild(name);

    // Description
    const desc = createText(relic.description, { size: 9, color: COLORS.textDim, maxWidth: w - 20 });
    desc.x = 10; desc.y = 100;
    card.addChild(desc);

    // Separator
    const sep = new Graphics();
    sep.beginFill(COLORS.panelBorder );

    sep.drawRect(10, h - 80, w - 20, 1);

    sep.endFill();
    card.addChild(sep);

    // HP cost
    const hpCost = relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15;
    const costText = createText(`\u4ee3\u4ef7: -${hpCost} HP`, { size: 10, color: COLORS.red, bold: true });
    costText.anchor.set(0.5); costText.x = w / 2; costText.y = h - 60;
    card.addChild(costText);

    // Rarity label
    const rarityLabel = createText(RARITY_LABELS[relic.rarity] || relic.rarity, {
      size: 10, color: rarityColor, bold: true,
    });
    rarityLabel.anchor.set(0.5); rarityLabel.x = w / 2; rarityLabel.y = h - 38;
    card.addChild(rarityLabel);

    // Interaction
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => { hoverOverlay.visible = true; });
    card.on('pointerout', () => { hoverOverlay.visible = false; });
    card.on('pointertap', () => {
      const g = this.gameApp.game as any;
      // Apply relic + HP cost
      g.relics = [...(g.relics || []), relic];
      g.hp = Math.max(1, (g.hp || 100) - hpCost);
      g.phase = 'battle';
      this.gameApp.setGame({ ...g });
      this.gameApp.sceneManager.switchTo('battle');
    });

    return card;
  }
}