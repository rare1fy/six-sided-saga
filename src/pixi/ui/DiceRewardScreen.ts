/**
 * DiceRewardScreen.ts - Dice reward selection screen (PixiJS)
 *
 * Replicates from DiceRewardScreen.tsx:
 * - Shows 3 dice options to choose from
 * - Each die shows all 6 faces
 * - Animated card reveal (flip + stagger)
 * - Selection glow + confirm
 * - Skip option
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createPanel, createButton, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface DiceRewardOption {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  classType: string;
  faces: { value: number; type: string; icon?: string }[];
  description?: string;
}

const RARITY_COLORS: Record<string, number> = {
  common: 0x888888,
  rare: 0x4488cc,
  epic: 0x8844cc,
};

const RARITY_BG: Record<string, number> = {
  common: 0x16141e,
  rare: 0x141828,
  epic: 0x1c1428,
};

const FACE_COLORS: Record<string, number> = {
  attack: 0xcc4444,
  defend: 0x4488cc,
  heal: 0x44aa44,
  special: 0xccaa44,
  mana: 0x6644cc,
};

const W = 720;
const H = 1280;

export class DiceRewardScreen {
  container: Container;
  private selectedId: string | null = null;
  private cards: Container[] = [];
  private onSelect: (id: string | null) => void;

  constructor(options: DiceRewardOption[], onSelect: (id: string | null) => void) {
    this.container = new Container();
    this.container.zIndex = 150;
    this.onSelect = onSelect;

    // Backdrop
    const bg = new Graphics();
    bg.beginFill(0x0a0a0a, 0.95);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // Title
    const title = createText('\ud83c\udfb2 \u9009\u62e9\u4e00\u679a\u65b0\u9ab0\u5b50', {
      size: 20, color: COLORS.gold, bold: true,
    });
    title.anchor.set(0.5);
    title.x = W / 2;
    title.y = H * 0.12;
    this.container.addChild(title);

    // Cards
    const cardW = 180;
    const cardH = 320;
    const totalW = options.length * cardW + (options.length - 1) * 16;
    const startX = (W - totalW) / 2;

    options.forEach((opt, i) => {
      const card = this.createDiceCard(opt, cardW, cardH);
      card.x = startX + i * (cardW + 16);
      card.y = H * 0.2;

      // Animated entrance: flip from small
      card.scale.set(0, 1);
      card.alpha = 0;
      TweenManager.to(card, { scaleX: 1, alpha: 1 }, {
        duration: 0.4,
        delay: 0.3 + i * 0.15,
        ease: Ease.easeOutBack,
      });

      this.cards.push(card);
      this.container.addChild(card);
    });

    // Skip button
    const skipBtn = createButton('\u8df3\u8fc7', 160, 40, {
      bg: 0x222222, textColor: COLORS.textDim, fontSize: 12,
    });
    skipBtn.x = W / 2 - 80;
    skipBtn.y = H * 0.82;
    skipBtn.on('pointertap', () => this.onSelect(null));
    this.container.addChild(skipBtn);

    // Confirm button
    const confirmBtn = createButton('\u786e\u8ba4\u9009\u62e9', 200, 44, {
      bg: COLORS.green, textColor: 0xffffff, fontSize: 14,
    });
    confirmBtn.x = W / 2 - 100;
    confirmBtn.y = H * 0.88;
    confirmBtn.on('pointertap', () => {
      if (this.selectedId) this.onSelect(this.selectedId);
    });
    this.container.addChild(confirmBtn);
  }

  private createDiceCard(opt: DiceRewardOption, w: number, h: number): Container {
    const card = new Container();
    const rarityColor = RARITY_COLORS[opt.rarity];
    const bgColor = RARITY_BG[opt.rarity];

    // Card background
    const bg = createPanel(w, h, {
      bg: bgColor, border: rarityColor, borderWidth: 2, radius: 6,
    });
    card.addChild(bg);

    // Selection highlight
    const highlight = new Graphics();
    highlight.lineStyle(3, COLORS.gold, 0.8);
    highlight.drawRoundedRect(-2, -2, w + 4, h + 4, 7);
    highlight.lineStyle(0);
    highlight.visible = false;
    card.addChild(highlight);

    // Rarity label
    const rarityLabel = createText(opt.rarity.toUpperCase(), {
      size: 8, color: rarityColor, bold: true,
    });
    rarityLabel.anchor.set(0.5);
    rarityLabel.x = w / 2;
    rarityLabel.y = 16;
    card.addChild(rarityLabel);

    // Die name
    const name = createText(opt.name, {
      size: 13, color: COLORS.textBright, bold: true,
    });
    name.anchor.set(0.5);
    name.x = w / 2;
    name.y = 36;
    card.addChild(name);

    // 6 faces (3x2 grid)
    const faceSize = 40;
    const faceGap = 6;
    const gridW = 3 * faceSize + 2 * faceGap;
    const gridStartX = (w - gridW) / 2;
    const gridStartY = 60;

    opt.faces.forEach((face, fi) => {
      const col = fi % 3;
      const row = Math.floor(fi / 3);
      const fx = gridStartX + col * (faceSize + faceGap);
      const fy = gridStartY + row * (faceSize + faceGap);
      const faceColor = FACE_COLORS[face.type] || 0x666666;

      // Face bg
      const faceBg = new Graphics();
      faceBg.beginFill(faceColor, 0.12);
    faceBg.drawRoundedRect(fx, fy, faceSize, faceSize, 3);
    faceBg.endFill();
      faceBg.lineStyle(1, faceColor, 0.5);
    faceBg.drawRoundedRect(fx, fy, faceSize, faceSize, 3);
    faceBg.lineStyle(0);
      card.addChild(faceBg);

      // Face value
      const faceText = createText(face.icon || String(face.value), {
        size: 16, color: faceColor, bold: true,
      });
      faceText.anchor.set(0.5, 0.5);
      faceText.x = fx + faceSize / 2;
      faceText.y = fy + faceSize / 2;
      card.addChild(faceText);

      // Face type label
      const typeLabel = createText(face.type, {
        size: 7, color: faceColor,
      });
      typeLabel.anchor.set(0.5);
      typeLabel.x = fx + faceSize / 2;
      typeLabel.y = fy + faceSize - 4;
      card.addChild(typeLabel);
    });

    // Description
    if (opt.description) {
      const desc = createText(opt.description, {
        size: 9, color: COLORS.textDim, maxWidth: w - 20,
      });
      desc.x = 10;
      desc.y = h - 60;
      card.addChild(desc);
    }

    // Interaction
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointertap', () => {
      this.selectedId = opt.id;
      // Update all cards
      this.cards.forEach(c => {
        const hl = c.getChildAt(1) as Graphics;
        hl.visible = (c as any)._optId === opt.id;
      });
      highlight.visible = true;
      TweenManager.killTweensOf(card);
      TweenManager.to(card, { scaleX: 1.05, scaleY: 1.05 }, {
        duration: 0.15, ease: Ease.easeOut,
      });
      // Shrink others
      this.cards.forEach(c => {
        if (c !== card) {
          TweenManager.killTweensOf(c);
          TweenManager.to(c, { scaleX: 0.95, scaleY: 0.95 }, {
            duration: 0.1, ease: Ease.easeOut,
          });
        }
      });
    });

    (card as any)._optId = opt.id;
    return card;
  }

  destroy(): void {
    TweenManager.killAll();
    this.container.destroy({ children: true });
  }
}
