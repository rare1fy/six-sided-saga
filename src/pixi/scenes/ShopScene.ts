/**
 * ShopScene — 商店界面 (PixiJS)
 * 接入 src/logic/shopGenerator 动态生成商品
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS, S } from '../UIFactory';
import { generateShopItems } from '../../logic/shopGenerator';
import type { ShopItem } from '../../types/game';
import { TweenManager, Ease } from '../animation/Tween';
import { playSfx } from '../SoundBridge';

const W = 720, H = 1280;

export class ShopScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private items: ShopItem[] = [];
  private soldIds: Set<string> = new Set();

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.soldIds.clear();
    // 动态生成商品
    const game = gameApp.game;
    const ownedRelicIds = (game.relics || []).map((r: any) => r.id);
    const playerClass = (game as any).playerClass;
    try {
      this.items = generateShopItems(ownedRelicIds, playerClass);
    } catch {
      // fallback 静态商品
      this.items = [
        { id: 'reroll_1', type: 'reroll', label: '重掷骰子', desc: '获得一次免费重掷机会', price: 30 },
        { id: 'dice_1', type: 'dice', label: '强化骰子', desc: '随机获得一颗骰子', price: 55 },
      ];
    }
    this.build();
  }

  onExit() { this.container.removeChildren(); }

  private build() {
    this.container.removeChildren();
    const game = this.gameApp.game;

    const bg = new Graphics();
    bg.beginFill(0x0a0810, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // 像素网格背景
    const grid = new Graphics();
    grid.alpha = 0.15;
    for (let x = 0; x < W; x += 16) { grid.lineStyle(0.5, 0x1a1820, 0.3); grid.moveTo(x, 0); grid.lineTo(x, H); }
    for (let y = 0; y < H; y += 16) { grid.lineStyle(0.5, 0x1a1820, 0.3); grid.moveTo(0, y); grid.lineTo(W, y); }
    this.container.addChild(grid);

    const title = createText('\ud83d\uded2 \u65c5\u884c\u5546\u4eba', { size: 26, color: COLORS.gold, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 50;
    this.container.addChild(title);

    const goldText = createText(`\ud83d\udcb0 ${game.souls ?? game.gold ?? 0}`, { size: 16, color: COLORS.gold });
    goldText.anchor.set(1, 0);
    goldText.x = W - 40; goldText.y = 55;
    this.container.addChild(goldText);

    // 商品列表
    const startY = 120;
    const cardH = 100;
    const gap = 12;
    const gold = game.souls ?? game.gold ?? 0;

    this.items.forEach((item, idx) => {
      const y = startY + idx * (cardH + gap);
      const isSold = this.soldIds.has(item.id);
      const canAfford = !isSold && gold >= item.price;

      const card = createPanel(W - 60, cardH, {
        bg: isSold ? 0x0e0e14 : 0x14101e,
        border: isSold ? 0x222222 : (canAfford ? 0x3cc864 : 0x2a2535),
        borderWidth: canAfford ? 2 : 1, radius: 6,
      });
      card.x = 30; card.y = y;
      this.container.addChild(card);

      // 类型标签
      const typeLabel = item.type === 'relic' ? '\ud83d\udd2e' : item.type === 'specialDice' ? '\ud83c\udfb2' : item.type === 'removeDice' ? '\u2728' : '\u2764';
      const typeT = createText(typeLabel, { size: 20 });
      typeT.x = 46; typeT.y = y + 12;
      this.container.addChild(typeT);

      const nameT = createText(item.label || (item as any).name || '???', {
        size: 15, color: isSold ? 0x555555 : COLORS.textBright, bold: true,
      });
      nameT.x = 80; nameT.y = y + 14;
      this.container.addChild(nameT);

      const descT = createText(item.desc || '', {
        size: 11, color: isSold ? 0x444444 : COLORS.textDim, maxWidth: W - 200,
      });
      descT.x = 80; descT.y = y + 40;
      this.container.addChild(descT);

      if (isSold) {
        const soldT = createText('\u5df2\u552e\u51fa', { size: 12, color: 0x555555, bold: true });
        soldT.x = W - 130; soldT.y = y + 40;
        this.container.addChild(soldT);
      } else {
        const priceT = createText(`\ud83d\udcb0 ${item.price}`, {
          size: 13, color: canAfford ? COLORS.gold : 0x666666, bold: true,
        });
        priceT.x = W - 130; priceT.y = y + 14;
        this.container.addChild(priceT);

        if (canAfford) {
          const buyBtn = createButton('\u8d2d\u4e70', 80, 32, { variant: 'primary', fontSize: 12 });
          buyBtn.x = W - 140; buyBtn.y = y + 55;
          buyBtn.on('pointertap', () => this.handleBuy(item));
          this.container.addChild(buyBtn);
        }
      }
    });

    // 离开按钮
    const leaveBtn = createButton('\u79bb\u5f00\u5546\u5e97', 300, 48, { variant: 'ghost', fontSize: 15 });
    leaveBtn.x = (W - 300) / 2;
    leaveBtn.y = H - 100;
    leaveBtn.on('pointertap', () => {
      this.gameApp.setGame((prev: any) => ({ ...prev, phase: 'map' }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(leaveBtn);
  }

  private handleBuy(item: ShopItem) {
    playSfx('coin');
    let g = { ...this.gameApp.game } as any;
    g.souls = (g.souls ?? g.gold ?? 0) - item.price;
    if (g.gold !== undefined) g.gold = g.souls;

    if ((item as any)._healAmount) {
      g.hp = Math.min(g.maxHp, g.hp + (item as any).healAmount || 30);
    } else if (item.type === 'relic' && (item as any).relicData) {
      g.relics = [...(g.relics || []), (item as any).relicData];
    } else if (item.type === 'specialDice' && (item as any).diceDefId) {
      g.ownedDice = [...(g.ownedDice || []), { defId: (item as any).diceDefId, level: 1 }];
    } else if (item.type === 'removeDice') {
      // 净化：标记（实际需弹窗选择骰子移除，暂简化）
    }

    this.soldIds.add(item.id);
    this.gameApp.setGame(g);
    this.build();
  }
}
