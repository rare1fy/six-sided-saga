/**
 * SettingsPanel.ts - 设置面板 (PixiJS)
 * 对标原版 SettingsPanel.tsx:
 * - 音频设置（音量/音效/BGM开关）
 * - 图鉴入口（牌型/骰子/遗物/敌人/战斗日志/教程）
 * - 存档管理（保存/读取/清空）
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { ModalBase } from './ModalBase';
import { createText, createButton, COLORS } from '../UIFactory';

export interface SettingsCallbacks {
  onOpenHandGuide?: () => void;
  onOpenDiceGuide?: () => void;
  onOpenRelicGuide?: () => void;
  onOpenEnemyGuide?: () => void;
  onOpenLog?: () => void;
  onResetTutorial?: () => void;
  onClose?: () => void;
}

export class SettingsPanel extends ModalBase {
  constructor(callbacks: SettingsCallbacks = {}) {
    super({
      width: 480, height: 640,
      title: '\u2699 \u8bbe \u7f6e',
      titleColor: COLORS.gold,
      onClose: callbacks.onClose,
    });

    const pw = 480;
    let y = 0;

    // === 音频设置 ===
    const audioTitle = createText('\ud83d\udd0a \u97f3\u9891', { size: 12, color: COLORS.gold, bold: true });
    audioTitle.x = 0; audioTitle.y = y;
    this.contentArea.addChild(audioTitle);
    y += 24;

    // 音效开关
    const sfxBtn = createButton('\ud83d\udd14 \u97f3\u6548: \u5f00', pw - 40, 32, { variant: 'ghost', fontSize: 11 });
    sfxBtn.x = 0; sfxBtn.y = y;
    this.contentArea.addChild(sfxBtn);
    y += 40;

    // BGM开关
    const bgmBtn = createButton('\ud83c\udfb5 \u80cc\u666f\u97f3\u4e50: \u5f00', pw - 40, 32, { variant: 'ghost', fontSize: 11 });
    bgmBtn.x = 0; bgmBtn.y = y;
    this.contentArea.addChild(bgmBtn);
    y += 48;

    // 分隔线
    const sep1 = new Graphics();
    sep1.beginFill(COLORS.panelBorder, 1);
    sep1.drawRect(0, y, pw - 40, 2);
    sep1.endFill();
    this.contentArea.addChild(sep1);
    y += 12;

    // === 图鉴入口 ===
    const guideTitle = createText('\ud83d\udcd6 \u56fe\u9274 & \u5de5\u5177', { size: 12, color: COLORS.gold, bold: true });
    guideTitle.x = 0; guideTitle.y = y;
    this.contentArea.addChild(guideTitle);
    y += 24;

    const guideButtons: [string, (() => void) | undefined][] = [
      ['\u2660 \u724c\u578b\u56fe\u9274', callbacks.onOpenHandGuide],
      ['\ud83c\udfb2 \u9ab0\u5b50\u56fe\u9274', callbacks.onOpenDiceGuide],
      ['\ud83d\udd2e \u9057\u7269\u56fe\u9274', callbacks.onOpenRelicGuide],
      ['\ud83d\udc80 \u654c\u4eba\u56fe\u9274', callbacks.onOpenEnemyGuide],
      ['\ud83d\udcdc \u6218\u6597\u65e5\u5fd7', callbacks.onOpenLog],
      ['\ud83d\udcd6 \u67e5\u770b\u6559\u7a0b', callbacks.onResetTutorial],
    ];

    for (const [label, handler] of guideButtons) {
      const btn = createButton(label, pw - 40, 30, { variant: 'ghost', fontSize: 10 });
      btn.x = 0; btn.y = y;
      if (handler) btn.on('pointertap', () => { handler(); this.close(); });
      this.contentArea.addChild(btn);
      y += 36;
    }

    y += 8;

    // 分隔线
    const sep2 = new Graphics();
    sep2.beginFill(COLORS.panelBorder, 1);
    sep2.drawRect(0, y, pw - 40, 2);
    sep2.endFill();
    this.contentArea.addChild(sep2);
    y += 12;

    // === 存档管理 ===
    const dataTitle = createText('\ud83d\udcbe \u5b58\u6863', { size: 12, color: COLORS.gold, bold: true });
    dataTitle.x = 0; dataTitle.y = y;
    this.contentArea.addChild(dataTitle);
    y += 24;

    const saveBtn = createButton('\u4fdd\u5b58\u8fdb\u5ea6', (pw - 50) / 2, 30, { variant: 'primary', fontSize: 10 });
    saveBtn.x = 0; saveBtn.y = y;
    saveBtn.on('pointertap', () => {
      try {
        // 保存逻辑由外部处理
      } catch { /* ignore */ }
    });
    this.contentArea.addChild(saveBtn);

    const clearBtn = createButton('\u6e05\u7a7a\u6570\u636e', (pw - 50) / 2, 30, { variant: 'danger', fontSize: 10 });
    clearBtn.x = (pw - 40) / 2 + 5; clearBtn.y = y;
    clearBtn.on('pointertap', () => {
      try {
        localStorage.removeItem('dicehero_save');
        localStorage.removeItem('dicehero_meta');
      } catch { /* ignore */ }
    });
    this.contentArea.addChild(clearBtn);
  }
}
