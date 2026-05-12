/**
 * ClassSelectScene — 纯 PixiJS 职业选择界面
 * 复刻原 ClassSelectScreen.tsx
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createButton, createPanel, createText, COLORS, FONT } from '../UIFactory';
import { createPixelSprite } from '../PixelRenderer';
import { CLASS_DEFS, type ClassId } from '../../data/classes';
import { createInitialGameState } from '../../logic/gameInit';
import { createTestEnemies, drawDiceSimple } from '../logic/SimpleBattleLogic';

// 职业骰子像素数据
const DICE_PIXELS: Record<ClassId, { pixels: string[][]; border: number }> = {
  warrior: {
    border: 0xc04040,
    pixels: [
      ['#4a2020','#d0c0b0','#d0c0b0','#d0c0b0','#d0c0b0','#d0c0b0','#4a2020'],
      ['#d0c0b0','#b0a090','#b0a090','#b0a090','#b0a090','#b0a090','#806050'],
      ['#d0c0b0','#b0a090','#c04040','#b0a090','#b0a090','#b0a090','#806050'],
      ['#d0c0b0','#b0a090','#b0a090','#c04040','#b0a090','#b0a090','#806050'],
      ['#d0c0b0','#b0a090','#b0a090','#b0a090','#c04040','#b0a090','#806050'],
      ['#d0c0b0','#b0a090','#b0a090','#b0a090','#b0a090','#b0a090','#806050'],
      ['#4a2020','#806050','#806050','#806050','#806050','#806050','#4a2020'],
    ],
  },
  mage: {
    border: 0x8050c0,
    pixels: [
      ['#2a1050','#8050c0','#8050c0','#8050c0','#8050c0','#8050c0','#2a1050'],
      ['#8050c0','#6040a0','#6040a0','#6040a0','#6040a0','#6040a0','#402080'],
      ['#8050c0','#6040a0','#d0a0ff','#6040a0','#6040a0','#6040a0','#402080'],
      ['#8050c0','#6040a0','#6040a0','#d0a0ff','#6040a0','#6040a0','#402080'],
      ['#8050c0','#6040a0','#6040a0','#6040a0','#d0a0ff','#6040a0','#402080'],
      ['#8050c0','#6040a0','#6040a0','#6040a0','#6040a0','#6040a0','#402080'],
      ['#2a1050','#402080','#402080','#402080','#402080','#402080','#2a1050'],
    ],
  },
  rogue: {
    border: 0x30a050,
    pixels: [
      ['#103020','#30a050','#30a050','#30a050','#30a050','#30a050','#103020'],
      ['#30a050','#208040','#208040','#208040','#208040','#208040','#106030'],
      ['#30a050','#208040','#80ff80','#208040','#208040','#208040','#106030'],
      ['#30a050','#208040','#208040','#80ff80','#208040','#208040','#106030'],
      ['#30a050','#208040','#208040','#208040','#80ff80','#208040','#106030'],
      ['#30a050','#208040','#208040','#208040','#208040','#208040','#106030'],
      ['#103020','#106030','#106030','#106030','#106030','#106030','#103020'],
    ],
  },
};

export class ClassSelectScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private selected: ClassId = 'warrior';
  private classCards: Map<ClassId, Container> = new Map();
  private descContainer: Container | null = null;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.build();
  }

  onExit() {
    this.container.removeChildren();
    this.classCards.clear();
  }

  private build() {
    const W = 720, H = 1280;

    // 背景
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x0a0a0a });
    this.container.addChild(bg);

    // 标题
    const title = createText('选择职业', { size: 28, color: COLORS.textBright, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 60;
    this.container.addChild(title);

    // 三个职业卡片
    const classes: ClassId[] = ['warrior', 'mage', 'rogue'];
    const cardW = 200, cardH = 260, gap = 20;
    const totalW = cardW * 3 + gap * 2;
    const startX = (W - totalW) / 2;

    classes.forEach((classId, idx) => {
      const def = CLASS_DEFS[classId];
      const card = this.createClassCard(classId, def, cardW, cardH);
      card.x = startX + idx * (cardW + gap);
      card.y = 130;
      this.container.addChild(card);
      this.classCards.set(classId, card);
    });

    // 描述区域
    this.descContainer = new Container();
    this.descContainer.y = 420;
    this.container.addChild(this.descContainer);
    this.updateDescription();

    // 确认按钮
    const confirmBtn = createButton('▶ 开始冒险', 360, 52, {
      bg: 0x18803a, border: 0x0a3014, textColor: 0xc8ffd0, fontSize: 18,
    });
    confirmBtn.x = (W - 360) / 2;
    confirmBtn.y = H - 120;
    confirmBtn.on('pointertap', () => {
      // 初始化游戏状态并进入地图
      const newGame = createInitialGameState(this.selected);
      newGame.phase = 'map';
      newGame.playerClass = this.selected;
      this.gameApp.setGame(newGame);
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(confirmBtn);
  }

  private createClassCard(classId: ClassId, def: typeof CLASS_DEFS['warrior'], w: number, h: number): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const isSelected = classId === this.selected;
    const borderColor = parseInt(def.color.replace('#', ''), 16);

    // 卡片背景
    const bg = createPanel(w, h, {
      bg: isSelected ? 0x1a1428 : 0x121018,
      border: isSelected ? borderColor : 0x2a2535,
      borderWidth: isSelected ? 3 : 1,
      radius: 8,
    });
    card.addChild(bg);

    // 骰子图标
    const diceData = DICE_PIXELS[classId];
    const dice = createPixelSprite(this.gameApp.app, diceData.pixels, 6, `class_dice_${classId}`);
    dice.x = (w - 42) / 2;
    dice.y = 20;
    card.addChild(dice);

    // 职业名
    const name = createText(def.name, { size: 16, color: borderColor, bold: true });
    name.anchor.set(0.5, 0);
    name.x = w / 2; name.y = 75;
    card.addChild(name);

    // 副标题
    const sub = createText(def.title, { size: 11, color: COLORS.textDim });
    sub.anchor.set(0.5, 0);
    sub.x = w / 2; sub.y = 98;
    card.addChild(sub);

    // 简短描述
    const desc = createText(def.description, { size: 11, color: COLORS.text, maxWidth: w - 20 });
    desc.x = 10; desc.y = 120;
    card.addChild(desc);

    // 基本属性
    const stats = createText(
      `HP: ${def.hp}  抽骰: ${def.drawCount}  出牌: ${def.maxPlays}`,
      { size: 10, color: COLORS.textDim },
    );
    stats.x = 10; stats.y = h - 35;
    card.addChild(stats);

    // 点击选择
    card.on('pointertap', () => {
      this.selected = classId;
      this.rebuild();
    });

    return card;
  }

  private updateDescription() {
    if (!this.descContainer) return;
    this.descContainer.removeChildren();

    const def = CLASS_DEFS[this.selected];
    const W = 720;

    // 技能列表面板
    const panel = createPanel(W - 60, 380, { bg: 0x14101e, border: 0x2a2535, radius: 6 });
    panel.x = 30;
    this.descContainer.addChild(panel);

    const skillTitle = createText(`${def.name} 技能`, {
      size: 14, color: parseInt(def.color.replace('#', ''), 16), bold: true,
    });
    skillTitle.x = 50; skillTitle.y = 15;
    this.descContainer.addChild(skillTitle);

    def.skills.forEach((skill, i) => {
      const nameT = createText(`● ${skill.name}`, { size: 12, color: COLORS.textBright, bold: true });
      nameT.x = 50; nameT.y = 50 + i * 50;
      this.descContainer.addChild(nameT);

      const descT = createText(skill.desc, { size: 11, color: COLORS.textDim, maxWidth: 560 });
      descT.x = 70; descT.y = 70 + i * 50;
      this.descContainer.addChild(descT);
    });
  }

  private rebuild() {
    this.container.removeChildren();
    this.classCards.clear();
    this.build();
  }
}
