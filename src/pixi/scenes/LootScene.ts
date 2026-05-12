/**
 * LootScene.ts - Post-battle loot collection (PixiJS)
 *
 * Replicates LootScreen.tsx:
 * - Shows loot items (relic/gold/dice/reroll/maxPlays)
 * - Each item has icon, type label, name, description
 * - Tap to collect (item dims + "已拾取" overlay)
 * - Challenge chest opens with animation
 * - "继续旅程" button appears when all collected
 * - Staggered entrance animation
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';
import { playSfx } from '../SoundBridge';

const W = 720, H = 1280;

interface LootItem {
  id: string;
  type: string;
  value?: number;
  collected: boolean;
  relicData?: { id: string; name: string; description: string; rarity: string };
  diceDefId?: string;
}

const LOOT_TYPE_INFO: Record<string, { icon: string; label: string; color: number }> = {
  relic:          { icon: '\u2b50', label: '\u9057\u7269',     color: COLORS.purple },
  gold:           { icon: '\ud83d\udcb0', label: '\u91d1\u5e01',     color: COLORS.gold },
  reroll:         { icon: '\ud83d\udd04', label: '\u91cd\u63b7\u5f3a\u5316', color: COLORS.purple },
  maxPlays:       { icon: '\u26a1', label: '\u51fa\u724c\u6b21\u6570', color: COLORS.red },
  diceCount:      { icon: '\ud83c\udfb2', label: '\u9ab0\u5b50\u6570\u91cf', color: COLORS.orange },
  specialDice:    { icon: '\ud83c\udfb2', label: '\u7279\u6b8a\u9ab0\u5b50', color: COLORS.green },
  challengeChest: { icon: '\ud83c\udf81', label: '\u6311\u6218\u5b9d\u7bb1', color: COLORS.gold },
};

export class LootScene implements GameScene {
  container: Container;
  private gameApp!: GameApp;
  private itemCards: Container[] = [];
  private continueBtn: Container | null = null;

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
    this.itemCards = [];
    const game = this.gameApp.game as any;
    const lootItems: LootItem[] = game.lootItems || [];

    // Background
    const bg = new Graphics();
    bg.beginFill(0x0a0810); bg.drawRect(0, 0, W, H); bg.endFill();
    this.container.addChild(bg);

    // Pixel grid
    const grid = new Graphics();
    grid.alpha = 0.15;
    for (let x = 0; x < W; x += 16) { grid.moveTo(x, 0); grid.lineTo(x, H); grid.lineStyle(0.5, 0x1a1820); }
    for (let y = 0; y < H; y += 16) { grid.moveTo(0, y); grid.lineTo(W, y); grid.lineStyle(0.5, 0x1a1820); }
    this.container.addChild(grid);

    // Title badge
    const badge = createPanel(180, 24, { bg: 0x1a4030, border: COLORS.green, borderWidth: 2, radius: 2 });
    badge.x = (W - 180) / 2; badge.y = 50;
    this.container.addChild(badge);
    const badgeText = createText('\u25c6 VICTORY LOOT \u25c6', { size: 9, color: COLORS.green, bold: true });
    badgeText.anchor.set(0.5, 0.5); badgeText.x = W / 2; badgeText.y = 62;
    this.container.addChild(badgeText);

    // Title
    const title = createText('\u6218\u5229\u54c1\u62fe\u53d6', { size: 24, color: COLORS.textBright, bold: true });
    title.anchor.set(0.5); title.x = W / 2; title.y = 100;
    this.container.addChild(title);

    const subtitle = createText('\u70b9\u51fb\u7269\u54c1\u4ee5\u62fe\u53d6', { size: 9, color: COLORS.textDim });
    subtitle.anchor.set(0.5); subtitle.x = W / 2; subtitle.y = 130;
    this.container.addChild(subtitle);

    // Loot items
    const startY = 170;
    const cardH = 80;
    const gap = 10;

    lootItems.forEach((item, i) => {
      const card = this.createLootCard(item, i);
      card.x = 40; card.y = startY + i * (cardH + gap);
      // Staggered entrance
      card.alpha = 0; card.x = 20;
      TweenManager.to(card, { alpha: item.collected ? 0.3 : 1, x: 40 }, {
        duration: 0.3, delay: 0.1 + i * 0.1, ease: Ease.easeOut,
      });
      this.itemCards.push(card);
      this.container.addChild(card);
    });

    // Continue button (only if all collected)
    if (lootItems.length > 0 && lootItems.every(i => i.collected)) {
      this.showContinueButton();
    }
  }

  private createLootCard(item: LootItem, index: number): Container {
    const card = new Container();
    const cardW = W - 80;
    const cardH = 80;
    const info = LOOT_TYPE_INFO[item.type] || { icon: '\u2b50', label: '\u7269\u54c1', color: COLORS.textDim };

    // Background
    const bg = createPanel(cardW, cardH, {
      bg: 0x14101e, border: item.collected ? 0x222222 : info.color,
      borderWidth: item.collected ? 1 : 2, radius: 3,
    });
    card.addChild(bg);

    // Icon box
    const iconBox = new Graphics();
    iconBox.beginFill(0x0a0810); iconBox.drawRoundedRect(12, 14, 48, 48, 2); iconBox.endFill();
    iconBox.lineStyle(2, 0x2a2535); iconBox.drawRoundedRect(12, 14, 48, 48, 2);
    card.addChild(iconBox);

    const icon = createText(info.icon, { size: 22 });
    icon.anchor.set(0.5, 0.5); icon.x = 36; icon.y = 38;
    card.addChild(icon);

    // Type label
    const typeLabel = createText(info.label, { size: 8, color: info.color, bold: true });
    typeLabel.x = 72; typeLabel.y = 14;
    card.addChild(typeLabel);

    // Name
    const name = this.getLootName(item);
    const nameText = createText(name, { size: 13, color: COLORS.textBright, bold: true });
    nameText.x = 72; nameText.y = 30;
    card.addChild(nameText);

    // Description
    const desc = this.getLootDesc(item);
    const descText = createText(desc, { size: 9, color: COLORS.textDim, maxWidth: cardW - 90 });
    descText.x = 72; descText.y = 52;
    card.addChild(descText);

    // Collected overlay
    if (item.collected) {
      const overlay = new Graphics();
      overlay.beginFill(0x0a0810, 0.6); overlay.drawRoundedRect(0, 0, cardW, cardH, 3); overlay.endFill();
      card.addChild(overlay);
      const collectedLabel = createText('\u5df2\u62fe\u53d6', { size: 9, color: COLORS.textDim, bold: true });
      collectedLabel.anchor.set(0.5, 0.5); collectedLabel.x = cardW / 2; collectedLabel.y = cardH / 2;
      card.addChild(collectedLabel);
    } else {
      // Interaction
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointertap', () => this.collectItem(item, index));
    }

    return card;
  }

  private collectItem(item: LootItem, index: number) {
    playSfx('coin');
    const game = this.gameApp.game as any;
    // Mark collected
    if (game.lootItems && game.lootItems[index]) {
      game.lootItems[index].collected = true;
    }
    // Apply loot effect
    this.applyLootEffect(item);
    this.gameApp.setGame({ ...game });
    // Rebuild
    this.build();
  }

  private applyLootEffect(item: LootItem) {
    const game = this.gameApp.game as any;
    switch (item.type) {
      case 'gold':
        game.souls = (game.souls || 0) + (item.value || 0);
        if (game.gold !== undefined) game.gold = game.souls;
        break;
      case 'maxPlays':
        game.maxPlays = (game.maxPlays || 3) + (item.value || 1);
        break;
      case 'reroll':
        game.maxRerolls = (game.maxRerolls || 1) + (item.value || 1);
        break;
      case 'diceCount':
        game.maxDice = (game.maxDice || 5) + (item.value || 1);
        break;
      case 'relic':
        if (item.relicData) {
          game.relics = [...(game.relics || []), item.relicData];
        }
        break;
      case 'specialDice':
        if (item.diceDefId) {
          game.ownedDice = [...(game.ownedDice || []), { defId: item.diceDefId, level: 1 }];
        }
        break;
    }
  }

  private showContinueButton() {
    const btn = createButton('\u25b6 \u7ee7\u7eed\u65c5\u7a0b', 300, 48, { variant: 'primary', fontSize: 14 });
    btn.x = (W - 300) / 2; btn.y = H - 120;
    btn.alpha = 0;
    TweenManager.to(btn, { alpha: 1 }, { duration: 0.3, delay: 0.2, ease: Ease.easeOut });
    btn.on('pointertap', () => {
      const game = this.gameApp.game as any;
      game.phase = 'map';
      this.gameApp.setGame({ ...game });
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(btn);
    this.continueBtn = btn;
  }

  private getLootName(item: LootItem): string {
    switch (item.type) {
      case 'gold': return `${item.value} \u91d1\u5e01`;
      case 'maxPlays': return `+${item.value} \u51fa\u724c\u6b21\u6570`;
      case 'diceCount': return `+${item.value} \u9ab0\u5b50`;
      case 'reroll': return `+${item.value} \u91cd\u63b7\u6b21\u6570`;
      case 'relic': return item.relicData?.name || '\u795e\u79d8\u9057\u7269';
      case 'specialDice': return '\u7279\u6b8a\u9ab0\u5b50';
      case 'challengeChest': return '\u6d1e\u5bdf\u5f31\u70b9\u5b9d\u7bb1';
      default: return '\u7269\u54c1';
    }
  }

  private getLootDesc(item: LootItem): string {
    switch (item.type) {
      case 'relic': return item.relicData?.description || '\u70b9\u51fb\u62fe\u53d6\u8be5\u5956\u52b1';
      case 'challengeChest': return '\u70b9\u51fb\u5f00\u542f\uff0c\u968f\u673a\u83b7\u5f97\u91d1\u5e01/\u9ab0\u5b50/\u9057\u7269';
      default: return '\u70b9\u51fb\u62fe\u53d6\u8be5\u5956\u52b1';
    }
  }
}
