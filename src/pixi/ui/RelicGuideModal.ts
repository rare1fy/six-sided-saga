/**
 * RelicGuideModal.ts - Relic collection / guide modal (PixiJS)
 *
 * Replicates from RelicGuideModal.tsx:
 * - Grid of all relics (owned + locked)
 * - Each relic shows icon, name, rarity
 * - Tap for detail popup with description + stats
 * - Owned relics are bright, locked are dimmed
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { ModalBase } from './ModalBase';
import { createText, createPanel, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface RelicDisplayData {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: boolean;
}

const RARITY_COLORS: Record<string, number> = {
  common: 0x888888,
  rare: 0x4488cc,
  epic: 0x8844cc,
  legendary: 0xcc8800,
};

export class RelicGuideModal extends ModalBase {
  private detailPopup: Container | null = null;

  constructor(relics: RelicDisplayData[], onClose?: () => void) {
    super({
      width: 560,
      height: 680,
      title: '\ud83d\udd2e \u9057\u7269\u56fe\u9274',
      titleColor: COLORS.gold,
      onClose,
    });

    // Stats header
    const ownedCount = relics.filter(r => r.owned).length;
    const statsText = createText(`\u5df2\u89e3\u9501: ${ownedCount}/${relics.length}`, {
      size: 11, color: COLORS.textDim,
    });
    statsText.x = 0; statsText.y = 0;
    this.addContent(statsText);

    // Grid layout (5 columns)
    const cols = 5;
    const cellSize = 90;
    const gap = 8;
    const gridContainer = new Container();
    gridContainer.y = 28;

    relics.forEach((relic, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cell = this.createRelicCell(relic, cellSize);
      cell.x = col * (cellSize + gap);
      cell.y = row * (cellSize + gap);

      // Staggered entrance
      cell.alpha = 0;
      TweenManager.to(cell, { alpha: relic.owned ? 1 : 0.4 }, {
        duration: 0.15,
        delay: i * 0.03,
        ease: Ease.easeOut,
      });

      gridContainer.addChild(cell);
    });

    this.addContent(gridContainer);
  }

  private createRelicCell(relic: RelicDisplayData, size: number): Container {
    const cell = new Container();
    const rarityColor = RARITY_COLORS[relic.rarity] || RARITY_COLORS.common;

    // Background
    const bg = createPanel(size, size, {
      bg: relic.owned ? 0x1a1825 : 0x0e0d14,
      border: relic.owned ? rarityColor : 0x222222,
      borderWidth: relic.owned ? 2 : 1,
      radius: 3,
    });
    cell.addChild(bg);

    // Icon
    const icon = createText(relic.owned ? relic.icon : '?', {
      size: relic.owned ? 28 : 20,
      color: relic.owned ? 0xffffff : 0x444444,
    });
    icon.anchor.set(0.5, 0.5);
    icon.x = size / 2;
    icon.y = size * 0.4;
    cell.addChild(icon);

    // Name (truncated)
    const name = createText(
      relic.owned ? (relic.name.length > 4 ? relic.name.slice(0, 4) + '..' : relic.name) : '???',
      { size: 8, color: relic.owned ? COLORS.text : 0x444444 },
    );
    name.anchor.set(0.5, 0);
    name.x = size / 2;
    name.y = size * 0.7;
    cell.addChild(name);

    // Rarity dot
    if (relic.owned) {
      const dot = new Graphics();
      dot.beginFill(rarityColor, 1);
    dot.drawCircle(size - 8, 8, 3);
    dot.endFill();
      cell.addChild(dot);
    }

    // Interaction
    cell.eventMode = 'static';
    cell.cursor = relic.owned ? 'pointer' : 'default';
    if (relic.owned) {
      cell.on('pointertap', () => this.showRelicDetail(relic));
    }

    return cell;
  }

  private showRelicDetail(relic: RelicDisplayData) {
    // Remove existing detail popup
    if (this.detailPopup) {
      this.contentArea.removeChild(this.detailPopup);
      this.detailPopup.destroy({ children: true });
    }

    const popup = new Container();
    const pw = 480;
    const ph = 120;
    const rarityColor = RARITY_COLORS[relic.rarity];

    // Background
    const bg = createPanel(pw, ph, {
      bg: 0x1e1c28, border: rarityColor, borderWidth: 2, radius: 4,
    });
    popup.addChild(bg);

    // Icon
    const icon = createText(relic.icon, { size: 32 });
    icon.x = 16; icon.y = 16;
    popup.addChild(icon);

    // Name
    const name = createText(relic.name, {
      size: 14, color: rarityColor, bold: true,
    });
    name.x = 60; name.y = 12;
    popup.addChild(name);

    // Rarity
    const rarityLabel = createText(relic.rarity.toUpperCase(), {
      size: 9, color: rarityColor,
    });
    rarityLabel.x = 60; rarityLabel.y = 32;
    popup.addChild(rarityLabel);

    // Description
    const desc = createText(relic.description, {
      size: 11, color: COLORS.text, maxWidth: pw - 80,
    });
    desc.x = 60; desc.y = 52;
    popup.addChild(desc);

    // Position at bottom of content area
    popup.x = 10;
    popup.y = 520;
    popup.alpha = 0;

    TweenManager.to(popup, { alpha: 1 }, {
      duration: 0.2, ease: Ease.easeOut,
    });

    this.detailPopup = popup;
    this.contentArea.addChild(popup);
  }
}
