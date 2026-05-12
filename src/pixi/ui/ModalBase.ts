/**
 * ModalBase.ts - 可复用弹窗系统 (PixiJS)
 * 所有尺寸 × S 适配
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createButton, createPanel, COLORS, S } from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';

const W = 720;
const s = (v: number) => Math.round(v * S);

export interface ModalConfig {
  width?: number;
  height?: number;
  title?: string;
  titleColor?: number;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export class ModalBase {
  container: Container;
  protected panel: Container;
  protected contentArea: Container;
  protected backdrop: Graphics;
  private config: ModalConfig;
  private isOpen = false;

  constructor(config: ModalConfig = {}) {
    this.config = {
      width: s(320), height: s(400),
      closeOnBackdrop: true, showCloseButton: true,
      ...config,
    };
    // 如果调用方传了原始值，也乘以 S
    if (config.width && !config.width.toString().includes('.')) {
      // 已经是缩放后的值或者是合理值，保持
    }

    this.container = new Container();
    this.container.zIndex = 200;
    this.container.visible = false;

    // 背景遮罩（用大尺寸确保覆盖）
    this.backdrop = new Graphics();
    this.backdrop.beginFill(0x000000, 0.7);
    this.backdrop.drawRect(0, 0, W, 3000);
    this.backdrop.endFill();
    this.backdrop.eventMode = 'static';
    if (this.config.closeOnBackdrop) {
      this.backdrop.on('pointertap', () => this.close());
    }
    this.container.addChild(this.backdrop);

    this.panel = new Container();
    const pw = this.config.width!;
    const ph = this.config.height!;
    this.panel.x = (W - pw) / 2;
    this.panel.y = s(100); // 距顶部一定距离

    const panelBg = createPanel(pw, ph, {
      bg: COLORS.panelBg, border: COLORS.panelBorder,
      borderWidth: s(2), radius: s(3), alpha: 0.98,
    });
    this.panel.addChild(panelBg);

    if (this.config.title) {
      const titleH = s(32);
      const titleBg = new Graphics();
      titleBg.beginFill(0x000000, 0.3);
      titleBg.drawRect(0, 0, pw, titleH);
      titleBg.endFill();
      this.panel.addChild(titleBg);
      const titleText = createText(this.config.title, {
        size: s(12), color: this.config.titleColor || COLORS.gold, bold: true,
      });
      titleText.anchor.set(0.5, 0.5);
      titleText.x = pw / 2; titleText.y = titleH / 2;
      this.panel.addChild(titleText);
      const sep = new Graphics();
      sep.lineStyle(1, COLORS.panelBorder, 1);
      sep.moveTo(s(8), titleH); sep.lineTo(pw - s(8), titleH);
      this.panel.addChild(sep);
    }

    if (this.config.showCloseButton) {
      const closeBtn = createButton('\u2715', s(22), s(22), {
        bg: 0x333333, border: 0x555555, textColor: 0xaaaaaa, fontSize: s(11),
      });
      closeBtn.x = pw - s(28); closeBtn.y = s(5);
      closeBtn.on('pointertap', (e: any) => { e.stopPropagation?.(); this.close(); });
      this.panel.addChild(closeBtn);
    }

    this.contentArea = new Container();
    this.contentArea.x = s(12);
    this.contentArea.y = this.config.title ? s(38) : s(12);
    this.panel.addChild(this.contentArea);

    this.panel.eventMode = 'static';
    this.panel.on('pointertap', (e: any) => e.stopPropagation?.());
    this.container.addChild(this.panel);
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.visible = true;
    this.backdrop.alpha = 0;
    TweenManager.to(this.backdrop as any, { alpha: 0.7 }, { duration: 0.2, ease: Ease.easeOut });
    this.panel.scale.set(0.8); this.panel.alpha = 0;
    TweenManager.to(this.panel, { scaleX: 1, scaleY: 1, alpha: 1 }, { duration: 0.25, ease: Ease.easeOutBack });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    TweenManager.to(this.backdrop as any, { alpha: 0 }, { duration: 0.15, ease: Ease.easeIn });
    TweenManager.to(this.panel, { scaleX: 0.8, scaleY: 0.8, alpha: 0 }, {
      duration: 0.2, ease: Ease.easeIn,
      onComplete: () => { this.container.visible = false; this.config.onClose?.(); },
    });
  }

  addContent(child: Container): void { this.contentArea.addChild(child); }
  clearContent(): void { this.contentArea.removeChildren(); }

  addActionButton(label: string, onClick: () => void, opts?: { bg?: number; textColor?: number; width?: number }): void {
    const pw = this.config.width!;
    const ph = this.config.height!;
    const btnW = opts?.width || pw - s(30);
    const btn = createButton(label, btnW, s(32), {
      bg: opts?.bg || COLORS.green, textColor: opts?.textColor || 0xffffff, fontSize: s(11),
    });
    btn.x = (pw - btnW) / 2 - s(12);
    btn.y = ph - s(50) - (this.config.title ? s(38) : s(12));
    btn.on('pointertap', onClick);
    this.contentArea.addChild(btn);
  }

  destroy(): void {
    TweenManager.killTweensOf(this.panel);
    this.container.destroy({ children: true });
  }
}

export function showInfoToast(parent: Container, message: string, duration: number = 2.0, color: number = COLORS.text): void {
  const toast = new Container();
  const textObj = createText(message, { size: s(10), color, bold: true });
  const tw = Math.max(textObj.width + s(16), s(80));
  const th = s(24);
  const bg = new Graphics();
  bg.beginFill(0x0a0a0a, 0.9);
  bg.drawRoundedRect(0, 0, tw, th, s(3));
  bg.endFill();
  bg.lineStyle(1, COLORS.panelBorder, 1);
  bg.drawRoundedRect(0, 0, tw, th, s(3));
  bg.lineStyle(0);
  toast.addChild(bg);
  textObj.anchor.set(0.5, 0.5);
  textObj.x = tw / 2; textObj.y = th / 2;
  toast.addChild(textObj);
  toast.x = (W - tw) / 2; toast.y = s(80); toast.alpha = 0;
  parent.addChild(toast);
  TweenManager.to(toast, { alpha: 1, y: toast.y - s(8) }, { duration: 0.25, ease: Ease.easeOutBack });
  TweenManager.to(toast, { alpha: 0, y: toast.y - s(20) }, {
    duration: 0.4, delay: duration, ease: Ease.easeIn,
    onComplete: () => { parent.removeChild(toast); toast.destroy({ children: true }); },
  });
}
