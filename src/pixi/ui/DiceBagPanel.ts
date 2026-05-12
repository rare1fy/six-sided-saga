/**
 * DiceBagPanel.ts - Dice bag / collection panel (PixiJS)
 *
 * Replicates from DiceBagPanel.tsx:
 * - Shows all dice in player's bag
 * - Each die shows 6 faces in a grid
 * - Color-coded by class (warrior=red, mage=blue, rogue=green)
 * - Scrollable list
 * - Tap die for detail tooltip
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { ModalBase } from './ModalBase';
import { createText, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface DiceFaceData {
  value: number;
  type: string;   // 'attack' | 'defend' | 'heal' | 'special' | etc.
  icon?: string;
}

export interface DiceData {
  id: string;
  name: string;
  rarity: string;
  faces: DiceFaceData[];
  classType?: string;
}

const CLASS_COLORS: Record<string, number> = {
  warrior: 0xcc4444,
  mage: 0x4466cc,
  rogue: 0x44aa44,
  priest: 0xccaa44,
  default: 0x888888,
};

const FACE_TYPE_COLORS: Record<string, number> = {
  attack: 0xcc4444,
  defend: 0x4488cc,
  heal: 0x44aa44,
  special: 0xccaa44,
  mana: 0x6644cc,
  default: 0x666666,
};

export class DiceBagPanel extends ModalBase {
  constructor(dice: DiceData[], onClose?: () => void) {
    super({
      width: 560,
      height: 700,
      title: '\ud83c\udfb2 \u9ab0\u5b50\u80cc\u5305',
      titleColor: COLORS.gold,
      onClose,
    });

    if (dice.length === 0) {
      const emptyText = createText('\u80cc\u5305\u662f\u7a7a\u7684...', {
        size: 13, color: COLORS.textDim,
      });
      emptyText.x = 200; emptyText.y = 100;
      this.addContent(emptyText);
      return;
    }

    // Dice list
    const listContainer = new Container();
    const cardW = 520 - 32;
    const cardH = 90;

    dice.forEach((die, i) => {
      const card = this.createDiceCard(die, cardW, cardH);
      card.y = i * (cardH + 8);

      // Staggered entrance
      card.alpha = 0;
      TweenManager.to(card, { alpha: 1 }, {
        duration: 0.2,
        delay: i * 0.06,
        ease: Ease.easeOut,
      });

      listContainer.addChild(card);
    });

    this.addContent(listContainer);
  }

  private createDiceCard(die: DiceData, w: number, h: number): Container {
    const card = new Container();
    const classColor = CLASS_COLORS[die.classType || 'default'] || CLASS_COLORS.default;

    // Background
    const bg = createPanel(w, h, {
      bg: 0x16141e, border: classColor, borderWidth: 1, radius: 3,
    });
    card.addChild(bg);

    // Class color stripe (left edge)
    const stripe = new Graphics();
    stripe.beginFill(classColor, 1);
    stripe.drawRect(0, 0, 4, h);
    stripe.endFill();
    card.addChild(stripe);

    // Die name
    const name = createText(die.name, {
      size: 12, color: COLORS.textBright, bold: true,
    });
    name.x = 14; name.y = 8;
    card.addChild(name);

    // Rarity
    const rarityText = createText(die.rarity, {
      size: 9, color: COLORS.textDim,
    });
    rarityText.x = 14; rarityText.y = 26;
    card.addChild(rarityText);

    // 6 faces grid (2 rows x 3 cols)
    const faceSize = 22;
    const faceGap = 4;
    const facesStartX = 14;
    const facesStartY = 44;

    die.faces.forEach((face, fi) => {
      const col = fi % 3;
      const row = Math.floor(fi / 3);
      const fx = facesStartX + col * (faceSize + faceGap);
      const fy = facesStartY + row * (faceSize + faceGap);

      const faceColor = FACE_TYPE_COLORS[face.type] || FACE_TYPE_COLORS.default;

      // Face background
      const faceBg = new Graphics();
      faceBg.beginFill(faceColor, 0.15);
    faceBg.drawRoundedRect(fx, fy, faceSize, faceSize, 2);
    faceBg.endFill();
      faceBg.lineStyle(1, faceColor, 0.4);
    faceBg.drawRoundedRect(fx, fy, faceSize, faceSize, 2);
    faceBg.lineStyle(0);
      card.addChild(faceBg);

      // Face value
      const faceText = createText(face.icon || String(face.value), {
        size: 10, color: faceColor, bold: true,
      });
      faceText.anchor.set(0.5, 0.5);
      faceText.x = fx + faceSize / 2;
      faceText.y = fy + faceSize / 2;
      card.addChild(faceText);
    });

    // Summary stats (right side)
    const totalAtk = die.faces.filter(f => f.type === 'attack').reduce((s, f) => s + f.value, 0);
    const totalDef = die.faces.filter(f => f.type === 'defend').reduce((s, f) => s + f.value, 0);
    const totalHeal = die.faces.filter(f => f.type === 'heal').reduce((s, f) => s + f.value, 0);

    const statsX = w - 120;
    if (totalAtk > 0) {
      const atkText = createText(`\u2694 ${totalAtk}`, { size: 10, color: COLORS.red });
      atkText.x = statsX; atkText.y = 50;
      card.addChild(atkText);
    }
    if (totalDef > 0) {
      const defText = createText(`\ud83d\udee1 ${totalDef}`, { size: 10, color: COLORS.blue });
      defText.x = statsX + 40; defText.y = 50;
      card.addChild(defText);
    }
    if (totalHeal > 0) {
      const healText = createText(`\u2764 ${totalHeal}`, { size: 10, color: COLORS.green });
      healText.x = statsX + 80; healText.y = 50;
      card.addChild(healText);
    }

    // Interaction
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => { bg.alpha = 0.8; });
    card.on('pointerout', () => { bg.alpha = 1; });

    return card;
  }
}
