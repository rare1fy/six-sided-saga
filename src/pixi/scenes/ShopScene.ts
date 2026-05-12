/**
 * ShopScene — 商店界面
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';

const W = 720, H = 1280;

interface ShopItem {
  name: string;
  desc: string;
  cost: number;
  type: 'heal' | 'dice' | 'relic';
}

const SHOP_ITEMS: ShopItem[] = [
  { name: '生命药水', desc: '恢复 30 HP', cost: 30, type: 'heal' },
  { name: '强化骰子', desc: '获得一颗火焰骰', cost: 50, type: 'dice' },
  { name: '铁皮护符', desc: '每回合获得 2 护甲', cost: 80, type: 'relic' },
];

export class ShopScene implements GameScene {
  container: Container;
  private gameApp: GameApp;

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
    const game = this.gameApp.game;

    // 背景
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x0a0810 });
    this.container.addChild(bg);

    // 标题
    const title = createText('🛒 旅行商人', { size: 28, color: COLORS.gold, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 60;
    this.container.addChild(title);

    // 金币
    const goldText = createText(`💰 ${game.gold || 0}`, { size: 16, color: COLORS.gold });
    goldText.x = W - 120; goldText.y = 68;
    this.container.addChild(goldText);

    // 商品列表
    SHOP_ITEMS.forEach((item, idx) => {
      const y = 160 + idx * 140;
      const canAfford = (game.gold || 0) >= item.cost;

      const card = createPanel(W - 80, 110, {
        bg: 0x14101e,
        border: canAfford ? 0x3cc864 : 0x333333,
        radius: 8,
      });
      card.x = 40; card.y = y;
      this.container.addChild(card);

      const nameT = createText(item.name, { size: 16, color: COLORS.textBright, bold: true });
      nameT.x = 60; nameT.y = y + 15;
      this.container.addChild(nameT);

      const descT = createText(item.desc, { size: 12, color: COLORS.textDim });
      descT.x = 60; descT.y = y + 42;
      this.container.addChild(descT);

      const costT = createText(`💰 ${item.cost}`, {
        size: 14, color: canAfford ? COLORS.gold : 0x666666, bold: true,
      });
      costT.x = W - 160; costT.y = y + 15;
      this.container.addChild(costT);

      if (canAfford) {
        const buyBtn = createButton('购买', 80, 32, {
          bg: 0x18803a, border: 0x0a3014, textColor: 0xc8ffd0, fontSize: 12,
        });
        buyBtn.x = W - 160; buyBtn.y = y + 55;
        buyBtn.on('pointertap', () => {
          let g = { ...this.gameApp.game };
          g.gold = (g.gold || 0) - item.cost;
          if (item.type === 'heal') g.hp = Math.min(g.maxHp, g.hp + 30);
          this.gameApp.setGame(g);
          this.container.removeChildren();
          this.build();
        });
        this.container.addChild(buyBtn);
      }
    });

    // 离开按钮
    const leaveBtn = createButton('离开商店', 300, 48, {
      bg: 0x333333, border: 0x555555, textColor: 0xcccccc, fontSize: 16,
    });
    leaveBtn.x = (W - 300) / 2;
    leaveBtn.y = H - 120;
    leaveBtn.on('pointertap', () => {
      this.gameApp.setGame(prev => ({
        ...prev, phase: 'map', currentFloor: (prev.currentFloor ?? 0) + 1,
      }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(leaveBtn);
  }
}
