/**
 * BattleScene (PixiJS) — 战斗界面
 * 整合: 背景 + 敌人舞台 + 玩家HUD (骰子+按钮)
 */
import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, createProgressBar, COLORS, FONT } from '../UIFactory';
import { createPixelSprite } from '../PixelRenderer';
import { ENEMY_SPRITES } from '../../data/enemySprites';
import { playHandSimple, enemyTurnSimple, drawDiceSimple, checkBattleResult, createTestEnemies } from '../logic/SimpleBattleLogic';
import type { GameState } from '../../types/game';

const W = 720, H = 1280;
const ENEMY_STAGE_H = H * 0.52; // 上半区
const HUD_H = H - ENEMY_STAGE_H; // 下半区

// 简单伪随机
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export class BattleScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private enemySprites: { sprite: Sprite; baseY: number }[] = [];
  private starsContainer: Container | null = null;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    // 如果没有敌人，生成测试敌人
    if (!this.gameApp.game.enemies || this.gameApp.game.enemies.length === 0) {
      let g = this.gameApp.game;
      g = { ...g, enemies: createTestEnemies(g.chapter || 1) };
      g = drawDiceSimple(g);
      this.gameApp.setGame(g);
    }
    this.build();
  }

  onExit() {
    this.container.removeChildren();
    this.enemySprites = [];
  }

  onGameStateChanged(game: GameState) {
    // 后续可以局部刷新
  }

  onTick = (ticker: any) => {
    const dt = ticker.deltaTime * 0.016;
    this.time += dt;

    // 敌人浮动
    for (const e of this.enemySprites) {
      e.sprite.y = e.baseY + Math.sin(this.time * 2 + e.baseY * 0.01) * 3;
    }
  };

  private build() {
    const game = this.gameApp.game;

    // ====== 背景（森林） ======
    this.buildForestBackground();

    // ====== 敌人舞台 ======
    this.buildEnemyStage(game);

    // ====== 玩家 HUD ======
    this.buildPlayerHud(game);
  }

  // =============== 森林背景 ===============
  private buildForestBackground() {
    const bg = new Graphics();
    // 天空
    bg.rect(0, 0, W, ENEMY_STAGE_H * 0.4);
    bg.fill({ color: 0x0a1008 });
    // 远山
    bg.rect(0, ENEMY_STAGE_H * 0.3, W, ENEMY_STAGE_H * 0.15);
    bg.fill({ color: 0x111a0e });
    // 地面走廊
    bg.rect(0, ENEMY_STAGE_H * 0.4, W, ENEMY_STAGE_H * 0.6);
    bg.fill({ color: 0x12100e });
    this.container.addChild(bg);

    // 星星
    this.starsContainer = new Container();
    const rng = seededRandom(42);
    for (let i = 0; i < 30; i++) {
      const star = new Graphics();
      const size = rng() > 0.85 ? 2 : 1;
      star.rect(0, 0, size, size);
      star.fill({ color: 0xc8cde6, alpha: 0.2 + rng() * 0.5 });
      star.x = rng() * W;
      star.y = rng() * ENEMY_STAGE_H * 0.35;
      this.starsContainer.addChild(star);
    }
    this.container.addChild(this.starsContainer);

    // 走廊透视线
    const lines = new Graphics();
    const cx = W / 2;
    const horizon = ENEMY_STAGE_H * 0.35;
    for (let i = 0; i < 12; i++) {
      const y = horizon + i * (ENEMY_STAGE_H - horizon) / 12;
      const spread = ((y - horizon) / (ENEMY_STAGE_H - horizon)) * W * 0.45;
      lines.moveTo(cx - spread, y);
      lines.lineTo(cx + spread, y);
      lines.stroke({ color: 0x2a2418, width: 1, alpha: 0.5 });
    }
    // 纵线
    for (let i = -2; i <= 2; i++) {
      lines.moveTo(cx + i * 3, horizon);
      lines.lineTo(cx + i * W * 0.12, ENEMY_STAGE_H);
      lines.stroke({ color: 0x221a12, width: 1, alpha: 0.4 });
    }
    this.container.addChild(lines);

    // 树影剪影
    const trees = new Graphics();
    const treePositions = [0.03, 0.1, 0.18, 0.82, 0.9, 0.97];
    for (const tx of treePositions) {
      const x = W * tx;
      const h = 80 + Math.sin(tx * 20) * 30;
      // 树干
      trees.rect(x - 3, horizon - h * 0.3, 6, h * 0.35);
      trees.fill({ color: 0x0a0806 });
      // 树冠
      for (let j = 0; j < 3; j++) {
        const cy = horizon - h * 0.3 - j * 20;
        const cw = 28 - j * 6;
        trees.moveTo(x, cy - 24);
        trees.lineTo(x - cw, cy);
        trees.lineTo(x + cw, cy);
        trees.closePath();
        trees.fill({ color: 0x0a1208 });
      }
    }
    this.container.addChild(trees);

    // 火把光效（两侧）
    for (const side of [-1, 1]) {
      const torchX = cx + side * 260;
      const torchY = horizon + 40;
      const torch = new Graphics();
      torch.circle(torchX, torchY, 4);
      torch.fill({ color: 0xff6622 });
      // 光晕
      torch.circle(torchX, torchY, 30);
      torch.fill({ color: 0xff6622, alpha: 0.05 });
      this.container.addChild(torch);
    }
  }

  // =============== 敌人舞台 ===============
  private buildEnemyStage(game: GameState) {
    const enemies = game.enemies || [];
    if (enemies.length === 0) return;

    const stageY = ENEMY_STAGE_H * 0.45;
    const spacing = Math.min(180, W / (enemies.length + 1));

    enemies.forEach((enemy, idx) => {
      const x = (W / 2) + (idx - (enemies.length - 1) / 2) * spacing;
      const y = stageY;

      // 敌人像素精灵
      const spriteData = ENEMY_SPRITES[enemy.name];
      if (spriteData) {
        const sprite = createPixelSprite(
          this.gameApp.app, spriteData.pixels, 5, `enemy_${enemy.name}`,
        );
        sprite.x = x - (spriteData.width * 5) / 2;
        sprite.y = y;
        this.container.addChild(sprite);
        this.enemySprites.push({ sprite, baseY: y });

        // 选中光圈
        const ring = new Graphics();
        ring.ellipse(x, y + spriteData.height * 5 + 8, spriteData.width * 2.5, 8);
        ring.stroke({ color: 0xff6600, width: 2, alpha: 0.5 });
        this.container.addChild(ring);
      }

      // 敌人名字
      const name = createText(enemy.name, { size: 12, color: 0x44ff44, bold: true });
      name.anchor.set(0.5, 0);
      name.x = x; name.y = y - 22;
      this.container.addChild(name);

      // 血条
      const hpRatio = enemy.hp / enemy.maxHp;
      const hpBar = createProgressBar(70, 6, hpRatio, { fill: 0xcc2200 });
      hpBar.x = x - 35; hpBar.y = y - 8;
      this.container.addChild(hpBar);

      // HP 数字
      const hpText = createText(`${enemy.hp}/${enemy.maxHp}`, { size: 9, color: 0xff8866 });
      hpText.anchor.set(0.5, 0);
      hpText.x = x; hpText.y = y - 7;
      this.container.addChild(hpText);
    });
  }

  // =============== 玩家 HUD ===============
  private buildPlayerHud(game: GameState) {
    const hudY = ENEMY_STAGE_H;

    // HUD 背景面板
    const hudBg = new Graphics();
    hudBg.rect(0, hudY, W, HUD_H);
    hudBg.fill({ color: 0x0c0a08 });
    hudBg.moveTo(0, hudY);
    hudBg.lineTo(W, hudY);
    hudBg.stroke({ color: 0xc04040, width: 2 });
    this.container.addChild(hudBg);

    // === 技能栏 ===
    const skillY = hudY + 10;
    const skillBtn = createButton('普通攻击 ⚡7', 200, 36, {
      bg: 0x3a1a0a, border: 0xe06633, textColor: 0xffcc66, fontSize: 13,
    });
    skillBtn.x = (W - 200) / 2;
    skillBtn.y = skillY;
    this.container.addChild(skillBtn);

    // === 角色信息 ===
    const infoY = skillY + 50;
    const className = game.playerClass === 'warrior' ? '嗜血狂战'
      : game.playerClass === 'mage' ? '星界魔导' : '影锋刺客';
    const classColor = game.playerClass === 'warrior' ? 0xff6060
      : game.playerClass === 'mage' ? 0xc0a0ff : 0x60ff90;

    const classNameText = createText(`🩸 ${className}`, { size: 13, color: classColor, bold: true });
    classNameText.x = 20; classNameText.y = infoY;
    this.container.addChild(classNameText);

    // HP 条
    const hpBar = createProgressBar(300, 8, game.hp / game.maxHp, { fill: COLORS.hpGreen });
    hpBar.x = 160; hpBar.y = infoY + 2;
    this.container.addChild(hpBar);

    const hpLabel = createText(`${game.hp}/${game.maxHp}`, { size: 10, color: 0x88cc88 });
    hpLabel.x = 470; hpLabel.y = infoY;
    this.container.addChild(hpLabel);

    // 等级
    const lvText = createText(`Lv ${game.level || 1}`, { size: 10, color: COLORS.textDim });
    lvText.x = W - 60; lvText.y = infoY;
    this.container.addChild(lvText);

    // === 骰子手牌区域 ===
    const diceY = infoY + 50;
    const dice = game.dice || [];
    const diceSize = 56;
    const diceGap = 12;
    const totalDiceW = dice.length * diceSize + (dice.length - 1) * diceGap;
    const diceStartX = (W - totalDiceW) / 2;

    // 波次信息
    const waveText = createText(`第${game.currentWave || 1}波 · 回合${game.battleTurn || 1}`, { size: 11, color: COLORS.gold });
    waveText.x = 20; waveText.y = hudY - 30;
    this.container.addChild(waveText);

    // 上次伤害显示
    if ((game as any).lastDamage) {
      const dmgText = createText(`-${(game as any).lastDamage}`, { size: 22, color: 0xff4444, bold: true });
      dmgText.anchor.set(0.5);
      dmgText.x = W / 2; dmgText.y = ENEMY_STAGE_H * 0.4;
      dmgText.alpha = 0.8;
      this.container.addChild(dmgText);
    }

    // 出牌次数提示
    const playsText = createText(
      `出牌: ${game.playsLeft ?? 0}/${game.maxPlays ?? 1}`,
      { size: 10, color: (game.playsLeft ?? 0) > 0 ? COLORS.green : COLORS.red },
    );
    playsText.x = W - 120; playsText.y = hudY - 30;
    this.container.addChild(playsText);

    dice.forEach((die, idx) => {
      const dx = diceStartX + idx * (diceSize + diceGap);
      const dy = diceY;

      // 骰子背景
      const diceBg = new Graphics();
      diceBg.roundRect(dx, dy, diceSize, diceSize, 6);
      diceBg.fill({ color: die.selected ? 0x2a3a2a : 0x1a1a1a });
      diceBg.roundRect(dx, dy, diceSize, diceSize, 6);
      diceBg.stroke({
        color: die.selected ? 0x40c060 : 0x555555,
        width: die.selected ? 3 : 2,
      });
      this.container.addChild(diceBg);

      // 骰子数字
      if (die.value != null && !die.spent) {
        const numText = new Text({
          text: String(die.value),
          style: new TextStyle({
            fontFamily: FONT.ui, fontSize: 28, fontWeight: 'bold',
            fill: die.selected ? 0xffffff : 0xcccccc,
          }),
        });
        numText.anchor.set(0.5);
        numText.x = dx + diceSize / 2;
        numText.y = dy + diceSize / 2;
        this.container.addChild(numText);
      } else if (die.spent) {
        // 已使用
        const usedMark = new Graphics();
        usedMark.moveTo(dx + 10, dy + 10);
        usedMark.lineTo(dx + diceSize - 10, dy + diceSize - 10);
        usedMark.moveTo(dx + diceSize - 10, dy + 10);
        usedMark.lineTo(dx + 10, dy + diceSize - 10);
        usedMark.stroke({ color: 0x555555, width: 2, alpha: 0.5 });
        this.container.addChild(usedMark);
      }

      // 点击选择
      diceBg.eventMode = 'static';
      diceBg.cursor = 'pointer';
      diceBg.on('pointertap', () => {
        if (die.spent) return;
        this.gameApp.setGame(prev => ({
          ...prev,
          dice: prev.dice.map((d, i) =>
            i === idx ? { ...d, selected: !d.selected } : d
          ),
        }));
        // 重建 HUD（简易实现）
        this.container.removeChildren();
        this.build();
      });
    });

    // === 操作按钮 ===
    const actionY = diceY + diceSize + 20;

    // 重投按钮
    const rerollBtn = createButton(`🔄 ${game.freeRerollsLeft || 0}次`, 100, 40, {
      bg: 0x333333, border: 0x666666, textColor: 0xaaaaaa, fontSize: 12,
    });
    rerollBtn.x = 40;
    rerollBtn.y = actionY;
    this.container.addChild(rerollBtn);

    // 出牌按钮
    const hasSelected = dice.some(d => d.selected && !d.spent);
    const playBtn = createButton(
      hasSelected ? '▶ 出牌: 普通攻击' : '选择骰子...',
      380, 44,
      {
        bg: hasSelected ? 0xc03000 : 0x333333,
        border: hasSelected ? 0xff6633 : 0x555555,
        textColor: hasSelected ? 0xffffff : 0x888888,
        fontSize: 14,
      },
    );
    playBtn.x = 170;
    playBtn.y = actionY;
    if (hasSelected) {
      playBtn.on('pointertap', () => {
        // 调用简化战斗逻辑
        let newGame = playHandSimple(this.gameApp.game);
        const result = checkBattleResult(newGame);
        
        if (result === 'victory') {
          // 胜利 → 回到地图
          newGame = { ...newGame, phase: 'map', currentFloor: (newGame.currentFloor ?? 0) + 1 };
          this.gameApp.setGame(newGame);
          this.gameApp.sceneManager.switchTo('map');
          return;
        }

        // 检查是否还有出牌次数
        if ((newGame.playsLeft ?? 0) <= 0) {
          // 敌人回合
          newGame = enemyTurnSimple(newGame);
          const afterEnemy = checkBattleResult(newGame);
          if (afterEnemy === 'defeat') {
            newGame = { ...newGame, phase: 'gameover' };
            this.gameApp.setGame(newGame);
            this.gameApp.sceneManager.switchTo('start'); // 暂时回开始
            return;
          }
          // 抽新骰子，下回合
          newGame = drawDiceSimple(newGame);
        }

        this.gameApp.setGame(newGame);
        this.container.removeChildren();
        this.build();
      });
    }
    this.container.addChild(playBtn);

    // 锁定按钮
    const lockBtn = createButton('🔒 0', 80, 40, {
      bg: 0x333333, border: 0x666666, textColor: 0xaaaaaa, fontSize: 12,
    });
    lockBtn.x = W - 120;
    lockBtn.y = actionY;
    this.container.addChild(lockBtn);

    // === 底部遗物提示 ===
    const relicText = createText('▲ 遗物库', { size: 10, color: COLORS.textDim });
    relicText.anchor.set(0.5, 0);
    relicText.x = W / 2; relicText.y = H - 30;
    this.container.addChild(relicText);
  }
}
