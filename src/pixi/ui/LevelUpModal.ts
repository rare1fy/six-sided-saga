/**
 * LevelUpModal.ts - Level up selection modal (PixiJS)
 *
 * Replicates from LevelUpModal.tsx:
 * - Shows 3 upgrade options (HP+, ATK+, DEF+, etc.)
 * - Each option has icon, title, description
 * - Animated entrance (staggered card reveal)
 * - Selection highlight + confirm
 * - Gold particle burst on confirm
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { ModalBase } from './ModalBase';
import { createText, createPanel, createButton, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface LevelUpOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity?: 'common' | 'rare' | 'epic';
}

const RARITY_COLORS: Record<string, number> = {
  common: COLORS.text,
  rare: COLORS.blue,
  epic: COLORS.purple,
};

const RARITY_BORDER: Record<string, number> = {
  common: COLORS.panelBorder,
  rare: 0x4488cc,
  epic: 0x8844cc,
};

export class LevelUpModal extends ModalBase {
  private selectedId: string | null = null;
  private optionCards: Container[] = [];
  private onSelect: (id: string) => void;

  constructor(options: LevelUpOption[], onSelect: (id: string) => void) {
    super({
      width: 560,
      height: 520,
      title: '\u2b50 \u5347\u7ea7\uff01',
      titleColor: COLORS.gold,
      showCloseButton: false,
      closeOnBackdrop: false,
    });
    this.onSelect = onSelect;

    // Subtitle
    const subtitle = createText('\u9009\u62e9\u4e00\u9879\u5347\u7ea7\u5956\u52b1', {
      size: 11, color: COLORS.textDim,
    });
    subtitle.x = 0; subtitle.y = 0;
    this.addContent(subtitle);

    // Option cards
    const cardW = 520 - 32;
    const cardH = 100;
    const startY = 30;

    options.forEach((opt, i) => {
      const card = this.createOptionCard(opt, cardW, cardH);
      card.x = 0;
      card.y = startY + i * (cardH + 12);

      // Staggered entrance animation
      card.alpha = 0;
      card.scale.set(0.8);
      TweenManager.to(card, { alpha: 1, scaleX: 1, scaleY: 1 }, {
        duration: 0.3,
        delay: 0.1 + i * 0.12,
        ease: Ease.easeOutBack,
      });

      this.optionCards.push(card);
      this.addContent(card);
    });

    // Confirm button (initially disabled)
    const confirmBtn = createButton('\u786e\u8ba4\u9009\u62e9', cardW, 42, {
      bg: 0x333333, textColor: 0x666666, fontSize: 14,
    });
    confirmBtn.x = 0;
    confirmBtn.y = startY + options.length * (cardH + 12) + 10;
    confirmBtn.eventMode = 'static';
    confirmBtn.on('pointertap', () => {
      if (this.selectedId) {
        this.close();
        this.onSelect(this.selectedId);
      }
    });
    this.addContent(confirmBtn);
  }

  private createOptionCard(opt: LevelUpOption, w: number, h: number): Container {
    const card = new Container();
    const rarity = opt.rarity || 'common';
    const borderColor = RARITY_BORDER[rarity];

    // Background
    const bg = createPanel(w, h, {
      bg: 0x1a1825, border: borderColor, borderWidth: 2, radius: 4,
    });
    card.addChild(bg);

    // Hover highlight (hidden by default)
    const highlight = new Graphics();
    highlight.beginFill(COLORS.gold, 0.06);
    highlight.drawRoundedRect(0, 0, w, h, 4);
    highlight.endFill();
    highlight.visible = false;
    card.addChild(highlight);

    // Icon
    const icon = createText(opt.icon, { size: 28 });
    icon.x = 16; icon.y = h / 2 - 16;
    card.addChild(icon);

    // Title
    const titleColor = RARITY_COLORS[rarity];
    const title = createText(opt.title, {
      size: 14, color: titleColor, bold: true,
    });
    title.x = 60; title.y = 16;
    card.addChild(title);

    // Description
    const desc = createText(opt.description, {
      size: 11, color: COLORS.textDim, maxWidth: w - 80,
    });
    desc.x = 60; desc.y = 40;
    card.addChild(desc);

    // Rarity badge
    if (rarity !== 'common') {
      const badge = createText(rarity.toUpperCase(), {
        size: 8, color: borderColor, bold: true,
      });
      badge.x = w - 60; badge.y = 8;
      card.addChild(badge);
    }

    // Interaction
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => { highlight.visible = true; });
    card.on('pointerout', () => {
      if (this.selectedId !== opt.id) highlight.visible = false;
    });
    card.on('pointertap', () => {
      this.selectOption(opt.id);
    });

    // Store reference
    (card as any)._optId = opt.id;
    (card as any)._highlight = highlight;

    return card;
  }

  private selectOption(id: string) {
    this.selectedId = id;

    // Update visual selection
    for (const card of this.optionCards) {
      const isSelected = (card as any)._optId === id;
      const highlight = (card as any)._highlight as Graphics;
      highlight.visible = isSelected;

      if (isSelected) {
        TweenManager.killTweensOf(card);
        TweenManager.to(card, { scaleX: 1.02, scaleY: 1.02 }, {
          duration: 0.15, ease: Ease.easeOut,
        });
      } else {
        TweenManager.killTweensOf(card);
        TweenManager.to(card, { scaleX: 1, scaleY: 1 }, {
          duration: 0.1, ease: Ease.easeOut,
        });
      }
    }
  }
}
