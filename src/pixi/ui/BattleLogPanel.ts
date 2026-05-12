/**
 * BattleLogPanel.ts - Collapsible battle log (PixiJS)
 *
 * Replicates from CollapsibleLog.tsx:
 * - Expandable/collapsible log panel at bottom
 * - Color-coded log entries (damage=red, heal=green, status=purple)
 * - Auto-scroll to latest entry
 * - Timestamp for each entry
 * - Max visible entries with scroll
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createPanel, createButton, COLORS } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

export interface LogEntry {
  text: string;
  type: 'damage' | 'heal' | 'status' | 'info' | 'system';
  timestamp?: number;
}

const LOG_TYPE_COLORS: Record<string, number> = {
  damage: COLORS.red,
  heal: COLORS.green,
  status: COLORS.purple,
  info: COLORS.text,
  system: COLORS.textDim,
};

const W = 720;
const COLLAPSED_H = 36;
const EXPANDED_H = 240;
const MAX_VISIBLE = 20;

export class BattleLogPanel {
  container: Container;
  private entries: LogEntry[] = [];
  private entryContainers: Container[] = [];
  private logContent: Container;
  private isExpanded = false;
  private panelBg: Graphics;
  private toggleBtn: Container;
  private scrollOffset = 0;

  constructor() {
    this.container = new Container();
    this.container.zIndex = 30;

    // Panel background
    this.panelBg = new Graphics();
    this.drawBackground(COLLAPSED_H);
    this.container.addChild(this.panelBg);

    // Toggle button
    this.toggleBtn = new Container();
    const toggleBg = new Graphics();
    toggleBg.beginFill(0x000000, 0.01);
    toggleBg.drawRoundedRect(0, 0, W, COLLAPSED_H, 0);
    toggleBg.endFill(); // invisible hit area
    this.toggleBtn.addChild(toggleBg);

    const toggleIcon = createText('\u25b2 \u6218\u6597\u65e5\u5fd7', {
      size: 10, color: COLORS.textDim,
    });
    toggleIcon.anchor.set(0.5, 0.5);
    toggleIcon.x = W / 2;
    toggleIcon.y = COLLAPSED_H / 2;
    this.toggleBtn.addChild(toggleIcon);
    (this.toggleBtn as any)._icon = toggleIcon;

    this.toggleBtn.eventMode = 'static';
    this.toggleBtn.cursor = 'pointer';
    this.toggleBtn.on('pointertap', () => this.toggle());
    this.container.addChild(this.toggleBtn);

    // Log content area
    this.logContent = new Container();
    this.logContent.y = COLLAPSED_H;
    this.logContent.visible = false;
    this.container.addChild(this.logContent);
  }

  /** Add a log entry */
  addEntry(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > 100) {
      this.entries.shift();
    }
    if (this.isExpanded) {
      this.rebuildLogContent();
    }
  }

  /** Toggle expand/collapse */
  toggle(): void {
    this.isExpanded = !this.isExpanded;
    const icon = (this.toggleBtn as any)._icon as any;

    if (this.isExpanded) {
      icon.text = '\u25bc \u6218\u6597\u65e5\u5fd7';
      this.logContent.visible = true;
      this.drawBackground(EXPANDED_H);
      this.rebuildLogContent();
      TweenManager.to(this.logContent, { alpha: 1 }, {
        duration: 0.2, ease: Ease.easeOut,
      });
    } else {
      icon.text = '\u25b2 \u6218\u6597\u65e5\u5fd7';
      TweenManager.to(this.logContent, { alpha: 0 }, {
        duration: 0.15, ease: Ease.easeIn,
        onComplete: () => {
          this.logContent.visible = false;
          this.drawBackground(COLLAPSED_H);
        },
      });
    }
  }

  private drawBackground(height: number): void {
    this.panelBg.clear();
    this.panelBg.beginFill(0x0a0a0a, 0.92);
    this.panelBg.drawRect(0, 0, W, height);
    this.panelBg.endFill();
    this.panelBg.lineStyle(1, COLORS.panelBorder, 1);
    this.panelBg.moveTo(0, 0);
    this.panelBg.lineTo(W, 0);
  }

  private rebuildLogContent(): void {
    this.logContent.removeChildren();
    this.entryContainers = [];

    const visibleEntries = this.entries.slice(-MAX_VISIBLE);
    const lineH = 18;
    const maxH = EXPANDED_H - COLLAPSED_H - 8;

    visibleEntries.forEach((entry, i) => {
      const line = new Container();
      const color = LOG_TYPE_COLORS[entry.type] || COLORS.text;

      // Bullet
      const bullet = new Graphics();
      bullet.beginFill(color, 0.6);
      bullet.drawCircle(6, lineH / 2, 2);
      bullet.endFill();
      line.addChild(bullet);

      // Text
      const text = createText(entry.text, {
        size: 9, color, maxWidth: W - 40,
      });
      text.x = 16;
      text.y = 1;
      line.addChild(text);

      line.y = i * lineH;
      this.logContent.addChild(line);
      this.entryContainers.push(line);
    });

    // Auto-scroll to bottom
    const totalH = visibleEntries.length * lineH;
    if (totalH > maxH) {
      this.logContent.y = COLLAPSED_H - (totalH - maxH);
    } else {
      this.logContent.y = COLLAPSED_H;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}