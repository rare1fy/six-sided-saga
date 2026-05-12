/**
 * EventScene — 随机事件界面 (PixiJS)
 * 接入 src/config/events 完整事件库
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS, S } from '../UIFactory';
import { EVENTS_POOL, type EventConfig, type EventOptionConfig } from '../../config';
import { TweenManager, Ease } from '../animation/Tween';
import { playSfx } from '../SoundBridge';

const W = 720, H = 1280;

export class EventScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private event: EventConfig | null = null;
  private resultShown = false;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.resultShown = false;
    // 随机选一个事件
    this.event = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)] || null;
    this.build();
  }

  onExit() { this.container.removeChildren(); }

  private build() {
    this.container.removeChildren();
    if (!this.event) {
      this.showFallback();
      return;
    }

    const bg = new Graphics();
    bg.beginFill(0x0a080e, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // 图标
    const iconMap: Record<string, string> = {
      skull: '\ud83d\udc80', star: '\u2b50', flame: '\ud83d\udd25',
      heart: '\u2764', shopBag: '\ud83d\udc5c', refresh: '\ud83d\udd04', question: '\u2753',
    };
    const icon = createText(iconMap[this.event.iconId] || '\u2753', { size: 50 });
    icon.anchor.set(0.5); icon.x = W / 2; icon.y = 130;
    this.container.addChild(icon);

    // 标题
    const title = createText(this.event.title, { size: 24, color: COLORS.purple, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 185;
    this.container.addChild(title);

    // 描述
    const desc = createText(this.event.desc, { size: 13, color: COLORS.text, maxWidth: W - 100 });
    desc.x = 50; desc.y = 230;
    this.container.addChild(desc);

    // 选项
    const optStartY = 340;
    this.event.options.forEach((opt, idx) => {
      const y = optStartY + idx * 90;

      const optPanel = createPanel(W - 80, 75, { bg: 0x14101e, border: 0x3a2858, radius: 6 });
      optPanel.x = 40; optPanel.y = y;
      optPanel.eventMode = 'static';
      optPanel.cursor = 'pointer';
      this.container.addChild(optPanel);

      const optText = createText(opt.label, { size: 14, color: COLORS.textBright, bold: true });
      optText.x = 56; optText.y = y + 12;
      this.container.addChild(optText);

      const subText = createText(opt.sub || '', { size: 11, color: COLORS.gold });
      subText.x = 56; subText.y = y + 36;
      this.container.addChild(subText);

      // 颜色指示条
      const colorHex = parseInt((opt.color || '#8b3cc8').replace('#', ''), 16);
      const indicator = new Graphics();
      indicator.beginFill(colorHex, 0.8);
      indicator.drawRect(40, y, 4, 75);
      indicator.endFill();
      this.container.addChild(indicator);

      optPanel.on('pointertap', () => {
        if (this.resultShown) return;
        this.resultShown = true;
        playSfx('select');
        this.applyOption(opt);
      });
    });
  }

  private applyOption(opt: EventOptionConfig) {
    let g = { ...this.gameApp.game } as any;
    const action = opt.action;

    let toastMsg = action.toast || '';
    let toastColor = COLORS.text;

    switch (action.type) {
      case 'modifyHp':
        g.hp = Math.max(1, Math.min(g.maxHp, g.hp + (action.value || 0)));
        toastColor = (action.value || 0) > 0 ? COLORS.green : COLORS.red;
        if (!toastMsg) toastMsg = `HP ${(action.value || 0) > 0 ? '+' : ''}${action.value}`;
        break;
      case 'modifySouls':
        g.souls = Math.max(0, (g.souls ?? g.gold ?? 0) + (action.value || 0));
        if (g.gold !== undefined) g.gold = g.souls;
        toastColor = COLORS.gold;
        if (!toastMsg) toastMsg = `\u91d1\u5e01 ${(action.value || 0) > 0 ? '+' : ''}${action.value}`;
        break;
      case 'modifyMaxHp':
        g.maxHp = Math.max(1, g.maxHp + (action.value || 0));
        g.hp = Math.min(g.hp, g.maxHp);
        if (!toastMsg) toastMsg = `\u6700\u5927HP ${(action.value || 0) > 0 ? '+' : ''}${action.value}`;
        break;
      case 'grantRelic':
        // 简化：给个随机遗物
        if (!toastMsg) toastMsg = '\u83b7\u5f97\u4e00\u4ef6\u9057\u7269\uff01';
        toastColor = COLORS.purple;
        break;
      case 'startBattle':
        g.phase = 'battle';
        this.gameApp.setGame(g);
        this.gameApp.sceneManager.switchTo('battle');
        return;
      case 'randomOutcome':
        if (action.outcomes && action.outcomes.length > 0) {
          const totalWeight = action.outcomes.reduce((s, o) => s + o.weight, 0);
          let roll = Math.random() * totalWeight;
          for (const outcome of action.outcomes) {
            roll -= outcome.weight;
            if (roll <= 0) {
              toastMsg = outcome.toast || '\u968f\u673a\u7ed3\u679c';
              // 应用子 actions
              for (const subAct of outcome.actions) {
                if (subAct.type === 'modifyHp') g.hp = Math.max(1, Math.min(g.maxHp, g.hp + (subAct.value || 0)));
                if (subAct.type === 'modifySouls') { g.souls = Math.max(0, (g.souls ?? 0) + (subAct.value || 0)); if (g.gold !== undefined) g.gold = g.souls; }
              }
              break;
            }
          }
        }
        break;
      case 'noop':
      default:
        if (!toastMsg) toastMsg = '\u65e0\u4e8b\u53d1\u751f';
        break;
    }

    // 显示结果 toast
    this.showResult(toastMsg, toastColor, g);
  }

  private showResult(msg: string, color: number, newGame: any) {
    const resultPanel = new Container();
    resultPanel.alpha = 0;

    const panelBg = createPanel(W - 100, 80, { bg: 0x0a0a0a, border: 0x3a3a50, radius: 8, alpha: 0.95 });
    resultPanel.addChild(panelBg);

    const resultText = createText(msg, { size: 16, color, bold: true });
    resultText.anchor.set(0.5, 0.5);
    resultText.x = (W - 100) / 2; resultText.y = 30;
    resultPanel.addChild(resultText);

    const continueText = createText('\u70b9\u51fb\u7ee7\u7eed', { size: 11, color: COLORS.textDim });
    continueText.anchor.set(0.5, 0);
    continueText.x = (W - 100) / 2; continueText.y = 52;
    resultPanel.addChild(continueText);

    resultPanel.x = 50; resultPanel.y = H * 0.7;
    this.container.addChild(resultPanel);

    TweenManager.to(resultPanel, { alpha: 1 }, { duration: 0.3, ease: Ease.easeOut });

    // 点击继续
    panelBg.eventMode = 'static';
    panelBg.cursor = 'pointer';
    panelBg.on('pointertap', () => {
      newGame.phase = 'map';
      this.gameApp.setGame(newGame);
      this.gameApp.sceneManager.switchTo('map');
    });
  }

  private showFallback() {
    const bg = new Graphics();
    bg.beginFill(0x0a080e, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    const msg = createText('\u65e0\u4e8b\u53d1\u751f...', { size: 20, color: COLORS.textDim });
    msg.anchor.set(0.5); msg.x = W / 2; msg.y = H / 2;
    this.container.addChild(msg);

    const btn = createButton('\u7ee7\u7eed', 200, 44, { variant: 'ghost', fontSize: 14 });
    btn.x = (W - 200) / 2; btn.y = H / 2 + 60;
    btn.on('pointertap', () => {
      this.gameApp.setGame((prev: any) => ({ ...prev, phase: 'map' }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(btn);
  }
}
