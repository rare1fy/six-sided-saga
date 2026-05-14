/**
 * 1oulShopModal.ts - 魂晶商店
 *
 * Design philosophy (from loaded skills):
 * - Game UI: "If players notice the UI, something is wrong"
 *   → Clean hierarchy, no visual noise, content is king
 * - Pixel Art: "Constraint = Creativity", 12-color palette
 *   → Simple solid borders, dark panel, no fancy cut corners
 * - Every element earns its screen space
 *   → Tight but readable spacing, no wasted area
 *
 * Layout: Full-width dark modal → list of horizontal item rows
 * Each row: [icon] [name + desc] [price] — like the original React version
 */
import { Container, Text } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, COLORS} from '../UIFactory';
import { getRelicIcon, getIcon } from '../AssetProvider';
import { ALL_RELICS } from '../../data/relics';
import { TweenManager, Ease } from '../animation/Tween';
import type { GameApp } from '../GameApp';

const W = 720;
const s = (v: number) => Math.round(v * 1);

// Pixel grid unit — all spacing is multiples of this
const G = s(6);

// Palette (constrained, from pixel-art-game-builder philosophy)
const P = {
  bg:        0x0a0a12,  // deep panel background
  bgRow:     0x121020,  // row background
  border:    0x2a2540,  // subtle border
  borderHi:  0x4a3878,  // highlighted border (purple accent)
  accent:    0x8b5cf6,  // purple accent for prices
  accentDim: 0x6a4ab8,  // dimmer purple
  gold:      0xe8c840,  // gold for owned
  green:     0x34d058,  // green for unlocked
  greenDim:  0x1a6830,  // dark green bg
  textMain:  0xe0dce8,  // primary text
  textSub:   0x8880a0,  // description text
  textDim:   0x5a5470,  // footer text
  red:       0xd04040,  // can't afford
  shadow:    0x000000,  // shadows
};

const META_KEY = 'dicehero_meta';

interface MetaProgress {
  permanentQuota: number;
  unlockedStartRelics: string[];
  highestOverkill: number;
  totalRuns: number;
  totalWins: number;
}

const loadMeta = (): MetaProgress => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};

const saveMeta = (meta: MetaProgress) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
};

const SHOP_ITEMS: { relicId: string; cost: number }[] = [
  { relicId: 'grindstone', cost: 500 },
  { relicId: 'iron_skin_relic', cost: 400 },
  { relicId: 'fate_coin', cost: 650 },
  { relicId: 'greedy_hand', cost: 800 },
  { relicId: 'crimson_grail', cost: 700 },
  { relicId: 'schrodinger_bag', cost: 750 },
  { relicId: 'treasure_sense_relic', cost: 550 },
  { relicId: 'warm_ember_relic', cost: 450 },
  { relicId: 'symmetry_seeker', cost: 600 },
  { relicId: 'iron_banner', cost: 500 },
];

export class SoulShopModal {
  container: Container;
  private gameApp: GameApp;
  private meta: MetaProgress;
  private balanceText: Text | null = null;
  private statsText: Text | null = null;
  private scrollContainer: Container;
  private scrollY = 0;
  private maxScrollY = 0;
  private listTop = 0;
  private listH = 0;
  private isOpen = false;
  private backdrop: Graphics;
  private panel: Container;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
    this.container.zIndex = 200;
    this.container.visible = false;
    this.meta = loadMeta();
    this.scrollContainer = new Container();

    this.backdrop = new Graphics();
    this.container.addChild(this.backdrop);

    this.panel = new Container();
    this.panel.eventMode = 'static';
    this.panel.on('pointertap', (e: any) => e.stopPropagation?.());
    this.container.addChild(this.panel);

    this.build();
  }

  private build() {
    const H = this.gameApp.designH;
    // Panel: inset from edges, vertically centered
    const pw = W - G * 8;     // ~688px wide, 16px margin each side
    const ph = Math.min(Math.round(H * 0.86), s(771));
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    // Backdrop
    this.backdrop.clear();
    this.backdrop.beginFill(P.shadow, 0.82);
    this.backdrop.drawRect(0, 0, W, H);
    this.backdrop.endFill();
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => this.close());

    this.panel.x = px;
    this.panel.y = py;

    // Panel background — simple, clean, no fancy corners
    const bg = new Graphics();
    bg.beginFill(P.bg, 0.98);
    bg.drawRect(0, 0, pw, ph);
    bg.endFill();
    bg.lineStyle(2, P.borderHi, 0.6);
    bg.drawRect(0, 0, pw, ph);
    bg.lineStyle(0);
    this.panel.addChild(bg);

    // ── Title bar ──
    const tbH = G * 8; // 32px
    const titleBg = new Graphics();
    titleBg.beginFill(P.borderHi, 0.12);
    titleBg.drawRect(2, 2, pw - 4, tbH);
    titleBg.endFill();
    this.panel.addChild(titleBg);

    // Title icon + text (left)
    const tIcon = getIcon('soul_crystal', G * 5);
    tIcon.x = G * 3;
    tIcon.y = (tbH - tIcon.height) / 2;
    this.panel.addChild(tIcon);

    const title = createText('魂晶商店', { size: s(21), color: P.textMain, bold: true });
    title.x = tIcon.x + tIcon.width + G * 2;
    title.y = (tbH - title.height) / 2;
    this.panel.addChild(title);

    // Balance (right of title)
    const balIcon = getIcon('soul_crystal', G * 3);
    this.balanceText = createText(`${this.meta.permanentQuota}`, {
      size: s(18), color: P.accent, bold: true,
    });
    // Position from right edge
    const closeSize = G * 4;
    const closeGap = G * 2;
    this.balanceText.x = pw - closeSize - closeGap - this.balanceText.width - G * 2;
    this.balanceText.y = (tbH - this.balanceText.height) / 2;
    balIcon.x = this.balanceText.x - balIcon.width - G;
    balIcon.y = (tbH - balIcon.height) / 2;
    this.panel.addChild(balIcon);
    this.panel.addChild(this.balanceText);

    // Close button (far right)
    const closeBtn = new Container();
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    const cIcon = getIcon('close', closeSize);
    closeBtn.addChild(cIcon);
    closeBtn.x = pw - closeSize - G * 2;
    closeBtn.y = (tbH - closeSize) / 2;
    closeBtn.on('pointerover', () => { cIcon.tint = P.red; });
    closeBtn.on('pointerout', () => { cIcon.tint = 0xffffff; });
    closeBtn.on('pointertap', (e: any) => { e.stopPropagation?.(); this.close(); });
    this.panel.addChild(closeBtn);

    // Separator line
    const sep = new Graphics();
    sep.beginFill(P.borderHi, 0.4);
    sep.drawRect(G * 2, tbH, pw - G * 4, 2);
    sep.endFill();
    this.panel.addChild(sep);

    // ── Description ──
    const descY = tbH + G * 2;
    const desc = createText(
      '消耗魂晶购买常驻遗物，购买后每次开局自动携带。魂晶通过溢出伤害获取，营火可撤离保存。',
      { size: s(11), color: P.textDim, maxWidth: pw - G * 6 },
    );
    desc.x = G * 3;
    desc.y = descY;
    this.panel.addChild(desc);

    // ── List area ──
    this.listTop = descY + desc.height + G * 2;
    this.listH = ph - this.listTop - G * 7;

    const clipMask = new Graphics();
    clipMask.beginFill(0xffffff);
    clipMask.drawRect(2, this.listTop, pw - 4, this.listH);
    clipMask.endFill();
    this.panel.addChild(clipMask);
    this.scrollContainer.mask = clipMask;
    this.panel.addChild(this.scrollContainer);

    const rowW = pw - s(13);  // 左右各留 s(6)
    const rowH = s(84);     // 原版 p-3 = 12*2=24px内容+28px图标 ≈ 52px
    const rowGap = s(13);    // 原版 gap-2 = 8px

    let cy = this.listTop;
    for (const item of SHOP_ITEMS) {
      const relic = ALL_RELICS[item.relicId];
      if (!relic) continue;
      const row = this.createRow(item, relic, rowW, rowH);
      row.x = s(6);
      row.y = cy;
      this.scrollContainer.addChild(row);
      cy += rowH + rowGap;
    }
    this.maxScrollY = Math.max(0, cy - rowGap - this.listTop - this.listH);

    this.panel.on('wheel', (e: any) => {
      this.scrollY = Math.min(this.maxScrollY, Math.max(0,
        this.scrollY + (e.deltaY > 0 ? s(51) : -s(51))));
      this.scrollContainer.y = -this.scrollY;
    });

    // ── Footer stats ──
    this.statsText = createText(
      `总局数: ${this.meta.totalRuns}    最高溢出: ${this.meta.highestOverkill}    已解锁: ${this.meta.unlockedStartRelics.length}/${SHOP_ITEMS.length}`,
      { size: s(11), color: P.textDim },
    );
    this.statsText.x = G * 3;
    this.statsText.y = ph - G * 5;
    this.panel.addChild(this.statsText);
  }

  /**
   * 横向行 — 严格对标原版 SoulShop.tsx 排版参数
   * 原版: flex items-center gap-3 p-3 border-2
   *   [w-8 icon] [flex-1: name(text-xs bold) + desc(text-[9px] mt-0.5)] [price(text-xs bold)]
   */
  private createRow(
    item: { relicId: string; cost: number },
    relic: { name: string; description: string },
    w: number, h: number,
  ): Container {
    const row = new Container();
    const owned = this.meta.unlockedStartRelics.includes(item.relicId);
    const canAfford = this.meta.permanentQuota >= item.cost;
    const pad = s(19); // 原版 p-3 = 12px

    // 背景 + 边框
    const bg = new Graphics();
    const bgColor = owned ? P.greenDim : P.bgRow;
    const borderColor = owned ? P.green : P.border;
    bg.beginFill(bgColor, owned ? 0.3 : 0.8);
    bg.drawRect(0, 0, w, h);
    bg.endFill();
    bg.lineStyle(s(3), borderColor, owned ? 0.3 : 0.5);
    bg.drawRect(0, 0, w, h);
    bg.lineStyle(0);
    row.addChild(bg);

    // 图标 — 原版 w-8 = 32px，垂直居中
    const iconSize = s(45);
    const icon = getRelicIcon(item.relicId, iconSize);
    icon.x = pad;
    icon.y = (h - iconSize) / 2;
    row.addChild(icon);

    // 文字区域起始 X — 图标右侧 + gap-3 (12px)
    const tx = pad + iconSize + s(19);
    const tw = w - tx - pad;

    // 名称 — 原版 text-xs(12px) font-bold，垂直位于行上部
    const nameColor = owned ? P.green : P.textMain;
    const name = createText(relic.name, {
      size: s(19), color: nameColor, bold: true,
    });
    name.x = tx;
    name.y = pad;
    row.addChild(name);

    // 已解锁标签 / 价格 — 与名称同行，右对齐
    if (owned) {
      const tag = createText('已解锁', { size: s(13), color: P.green, bold: true });
      tag.x = w - tag.width - pad;
      tag.y = pad + s(3);
      row.addChild(tag);
    } else {
      const priceColor = canAfford ? P.accent : P.red;
      const priceText = createText(`${item.cost}`, {
        size: s(19), color: priceColor, bold: true,
      });
      const cryIcon = getIcon('soul_crystal', s(16));
      priceText.x = w - priceText.width - pad;
      priceText.y = pad;
      cryIcon.x = priceText.x - cryIcon.width - s(6);
      cryIcon.y = pad + s(3);
      row.addChild(cryIcon);
      row.addChild(priceText);
    }

    // 描述 — 原版 text-[9px] mt-0.5(2px) leading-relaxed
    const descY = pad + name.height + s(3);
    const descStr = relic.description.replace(/<[^>]*>/g, '');
    const desc = createText(descStr, {
      size: s(14), color: P.textSub, maxWidth: tw,
    });
    desc.x = tx;
    desc.y = descY;
    row.addChild(desc);

    // Interactivity
    row.eventMode = owned ? 'none' : 'static';
    row.cursor = owned ? 'default' : 'pointer';
    if (owned) row.alpha = 0.55;

    if (!owned) {
      row.on('pointerover', () => {
        bg.clear();
        bg.beginFill(canAfford ? 0x1a1430 : 0x201018, 0.95);
        bg.drawRect(0, 0, w, h);
        bg.endFill();
        bg.lineStyle(s(3), canAfford ? P.borderHi : P.red, 0.7);
        bg.drawRect(0, 0, w, h);
        bg.lineStyle(0);
      });
      row.on('pointerout', () => {
        bg.clear();
        bg.beginFill(P.bgRow, 0.8);
        bg.drawRect(0, 0, w, h);
        bg.endFill();
        bg.lineStyle(s(3), P.border, 0.5);
        bg.drawRect(0, 0, w, h);
        bg.lineStyle(0);
        bg.beginFill(0xffffff, 0.03);
        bg.drawRect(2, 2, w - 4, 1);
        bg.endFill();
      });
      row.on('pointertap', (e: any) => {
        e.stopPropagation?.();
        this.handlePurchase(item, row);
      });
    }

    return row;
  }

  private handlePurchase(item: { relicId: string; cost: number }, row: Container) {
    if (this.meta.permanentQuota < item.cost) {
      this.showToast('魂晶不足！', P.red);
      return;
    }
    if (this.meta.unlockedStartRelics.includes(item.relicId)) return;

    this.meta.permanentQuota -= item.cost;
    this.meta.unlockedStartRelics.push(item.relicId);
    saveMeta(this.meta);

    if (this.balanceText) this.balanceText.text = `${this.meta.permanentQuota}`;
    if (this.statsText) {
      this.statsText.text = `总局数: ${this.meta.totalRuns}    最高溢出: ${this.meta.highestOverkill}    已解锁: ${this.meta.unlockedStartRelics.length}/${SHOP_ITEMS.length}`;
    }

    row.eventMode = 'none';
    row.cursor = 'default';
    const relicName = ALL_RELICS[item.relicId]?.name || item.relicId;
    this.showToast(`✦ 获得 ${relicName}！`, P.accent);

    TweenManager.to(row, { alpha: 1 }, {
      duration: 0.15,
      onComplete: () => TweenManager.to(row, { alpha: 0.55 }, { duration: 0.5 }),
    });
  }

  private showToast(msg: string, color: number) {
    const pw = W - G * 8;
    const toast = createText(msg, { size: s(18), color, bold: true });
    toast.anchor.set(0.5, 0.5);
    toast.x = pw / 2;
    toast.y = G * 4;
    toast.alpha = 0;
    this.panel.addChild(toast);
    TweenManager.to(toast as any, { alpha: 1, y: G * 2 }, { duration: 0.2, ease: Ease.easeOut });
    TweenManager.to(toast as any, { alpha: 0, y: -G * 2 }, {
      duration: 0.3, delay: 1.5, ease: Ease.easeIn,
      onComplete: () => { toast.destroy(); },
    });
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.visible = true;
    this.backdrop.alpha = 0;
    TweenManager.to(this.backdrop as any, { alpha: 0.82 }, { duration: 0.2 });
    this.panel.scale.set(0.95);
    this.panel.alpha = 0;
    TweenManager.to(this.panel, { scaleX: 1, scaleY: 1, alpha: 1 }, {
      duration: 0.2, ease: Ease.easeOutBack,
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    TweenManager.to(this.backdrop as any, { alpha: 0 }, { duration: 0.15 });
    TweenManager.to(this.panel, { scaleX: 0.95, scaleY: 0.95, alpha: 0 }, {
      duration: 0.15, ease: Ease.easeIn,
      onComplete: () => { this.container.visible = false; },
    });
  }

  destroy(): void {
    TweenManager.killTweensOf(this.panel);
    this.container.destroy({ children: true });
  }
}
