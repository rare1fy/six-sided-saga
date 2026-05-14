/**
 * CampfireScene — 营火休息界面 (PixiJS)
 * 接入 CAMPFIRE_CONFIG 配置
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, COLORS} from '../UIFactory';
import { TweenManager, Ease } from '../animation/Tween';
import { playSfx } from '../SoundBridge';

const W = 720, H = 1280;

export class CampfireScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private flames: Graphics[] = [];
  private acted = false;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.acted = false;
    this.build();
  }

  onExit() {
    this.container.removeChildren();
    this.flames = [];
  }

  onTick = (delta: number) => {
    this.time += delta * 0.016;
    this.flames.forEach((f, i) => {
      f.alpha = 0.4 + Math.sin(this.time * 4 + i) * 0.3;
      f.y = H * 0.38 - 20 + Math.sin(this.time * 3 + i * 2) * 5;
      f.scale.x = 1 + Math.sin(this.time * 2.5 + i * 1.5) * 0.1;
    });
  };

  private build() {
    this.container.removeChildren();
    this.flames = [];
    const game = this.gameApp.game;

    const bg = new Graphics();
    bg.beginFill(0x080604, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // 星空点缀
    for (let i = 0; i < 15; i++) {
      const star = new Graphics();
      star.beginFill(0xffffff, 0.2 + Math.random() * 0.3);
      star.drawCircle(0, 0, 0.5 + Math.random());
      star.endFill();
      star.x = Math.random() * W; star.y = Math.random() * H * 0.3;
      this.container.addChild(star);
    }

    // 火焰光晕
    const glow = new Graphics();
    glow.beginFill(0xff6622, 0.08);
    glow.drawCircle(W / 2, H * 0.4, 140);
    glow.endFill();
    glow.beginFill(0xff4400, 0.04);
    glow.drawCircle(W / 2, H * 0.4, 200);
    glow.endFill();
    this.container.addChild(glow);

    // 篝火火焰
    const fireColors = [0xff4400, 0xff6622, 0xff8844, 0xffaa66, 0xffcc88];
    fireColors.forEach((color, i) => {
      const flame = new Graphics();
      const size = 22 - i * 4;
      flame.beginFill(color, 0.7 - i * 0.1);
      flame.drawEllipse(W / 2, H * 0.38 - i * 8, size, size * 1.6);
      flame.endFill();
      this.container.addChild(flame);
      this.flames.push(flame);
    });

    // 木头
    const wood = new Graphics();
    wood.beginFill(0x5a3a1a, 1);
    wood.drawRoundedRect(W / 2 - 35, H * 0.43, 70, 10, 3);
    wood.endFill();
    wood.beginFill(0x4a2a10, 1);
    wood.drawRoundedRect(W / 2 - 20, H * 0.44, 40, 8, 2);
    wood.endFill();
    this.container.addChild(wood);

    // 标题
    const title = createText('\ud83d\udd25 \u7bc5\u706b\u4f11\u606f', { size: 26, color: COLORS.orange, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 70;
    this.container.addChild(title);

    // HP
    const hpInfo = createText(`HP: ${game.hp}/${game.maxHp}`, { size: 15, color: COLORS.hpGreen });
    hpInfo.anchor.set(0.5, 0);
    hpInfo.x = W / 2; hpInfo.y = 110;
    this.container.addChild(hpInfo);

    // 恢复量（30%）
    const healAmount = Math.floor(game.maxHp * 0.3);
    const btnY = H * 0.56;

    // 休息按钮
    const restBtn = createButton(`\u2764 \u4f11\u606f (\u6062\u590d ${healAmount} HP)`, 400, 52, {
      variant: 'danger', fontSize: 15, disabled: this.acted || game.hp >= game.maxHp,
    });
    restBtn.x = (W - 400) / 2; restBtn.y = btnY;
    if (!this.acted && game.hp < game.maxHp) {
      restBtn.on('pointertap', () => this.handleRest(healAmount));
    }
    this.container.addChild(restBtn);

    // 锻造按钮
    const smithBtn = createButton('\ud83d\udd28 \u953b\u9020 (\u5f3a\u5316\u4e00\u9897\u9ab0\u5b50)', 400, 52, {
      variant: 'gold', fontSize: 15, disabled: this.acted,
    });
    smithBtn.x = (W - 400) / 2; smithBtn.y = btnY + 70;
    if (!this.acted) {
      smithBtn.on('pointertap', () => this.handleSmith());
    }
    this.container.addChild(smithBtn);

    // 跳过
    const skipBtn = createButton('\u8df3\u8fc7', 200, 40, { variant: 'ghost', fontSize: 13 });
    skipBtn.x = (W - 200) / 2; skipBtn.y = btnY + 150;
    skipBtn.on('pointertap', () => this.leave());
    this.container.addChild(skipBtn);
  }

  private handleRest(healAmount: number) {
    this.acted = true;
    playSfx('heal');
    const newHp = Math.min(this.gameApp.game.maxHp, this.gameApp.game.hp + healAmount);

    // 恢复飘字
    const healText = createText(`+${healAmount} HP`, { size: 24, color: COLORS.green, bold: true });
    healText.anchor.set(0.5);
    healText.x = W / 2; healText.y = H * 0.48;
    healText.alpha = 0;
    this.container.addChild(healText);
    TweenManager.to(healText as any, { alpha: 1, y: H * 0.45 }, { duration: 0.4, ease: Ease.easeOut });
    TweenManager.to(healText as any, { alpha: 0, y: H * 0.42 }, {
      duration: 0.5, delay: 1.0, ease: Ease.easeIn,
      onComplete: () => { this.container.removeChild(healText); },
    });

    this.gameApp.setGame((prev: any) => ({ ...prev, hp: newHp }));

    // 延迟后离开
    setTimeout(() => this.leave(), 1800);
  }

  private handleSmith() {
    this.acted = true;
    playSfx('select');
    // TODO: 弹出骰子选择界面进行强化
    // 暂简化：直接离开
    setTimeout(() => this.leave(), 500);
  }

  private leave() {
    this.gameApp.setGame((prev: any) => ({ ...prev, phase: 'map' }));
    this.gameApp.sceneManager.switchTo('map');
  }
}
