/**
 * EventScene — 随机事件界面
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, createPanel, COLORS } from '../UIFactory';

const W = 720, H = 1280;

interface EventOption { label: string; effect: string; action: (game: any) => any; }
interface RandomEvent { title: string; desc: string; options: EventOption[]; }

const EVENTS: RandomEvent[] = [
  {
    title: '神秘旅人',
    desc: '一位披斗篷的旅人出现在路旁，他提出了一个交易...',
    options: [
      { label: '交易 (失去20金，获得30HP)', effect: '+30 HP, -20 金', action: g => ({ ...g, hp: Math.min(g.maxHp, g.hp + 30), gold: Math.max(0, (g.gold || 0) - 20) }) },
      { label: '拒绝交易', effect: '无事发生', action: g => g },
      { label: '抢劫他 (获得50金，失去10HP)', effect: '+50 金, -10 HP', action: g => ({ ...g, gold: (g.gold || 0) + 50, hp: Math.max(1, g.hp - 10) }) },
    ],
  },
  {
    title: '古老祭坛',
    desc: '你发现了一个散发微光的古老祭坛，上面刻着奇怪的符文...',
    options: [
      { label: '献祭 (失去15%HP，获得力量)', effect: '-15% HP', action: g => ({ ...g, hp: Math.max(1, g.hp - Math.floor(g.maxHp * 0.15)) }) },
      { label: '祈祷 (恢复20HP)', effect: '+20 HP', action: g => ({ ...g, hp: Math.min(g.maxHp, g.hp + 20) }) },
      { label: '离开', effect: '无事发生', action: g => g },
    ],
  },
  {
    title: '迷雾宝箱',
    desc: '浓雾中隐约可见一个宝箱，但空气中弥漫着诡异的气息...',
    options: [
      { label: '打开宝箱 (获得40金)', effect: '+40 金', action: g => ({ ...g, gold: (g.gold || 0) + 40 }) },
      { label: '谨慎离开', effect: '无事发生', action: g => g },
    ],
  },
];

export class EventScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private event: RandomEvent;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
    this.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    this.build();
  }

  onExit() { this.container.removeChildren(); }

  private build() {
    // 背景
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x0a080e });
    this.container.addChild(bg);

    // 问号图标
    const icon = createText('❓', { size: 60 });
    icon.anchor.set(0.5);
    icon.x = W / 2; icon.y = 140;
    this.container.addChild(icon);

    // 标题
    const title = createText(this.event.title, { size: 26, color: COLORS.purple, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 200;
    this.container.addChild(title);

    // 描述
    const desc = createText(this.event.desc, { size: 14, color: COLORS.text, maxWidth: W - 100 });
    desc.x = 50; desc.y = 260;
    this.container.addChild(desc);

    // 选项
    this.event.options.forEach((opt, idx) => {
      const y = 380 + idx * 100;

      const optPanel = createPanel(W - 80, 80, { bg: 0x14101e, border: 0x3a2858, radius: 8 });
      optPanel.x = 40; optPanel.y = y;
      this.container.addChild(optPanel);

      const optText = createText(opt.label, { size: 14, color: COLORS.textBright, bold: true });
      optText.x = 60; optText.y = y + 15;
      this.container.addChild(optText);

      const effectText = createText(opt.effect, { size: 11, color: COLORS.gold });
      effectText.x = 60; effectText.y = y + 42;
      this.container.addChild(effectText);

      // 整个面板可点击
      optPanel.eventMode = 'static';
      optPanel.cursor = 'pointer';
      optPanel.on('pointertap', () => {
        let g = opt.action({ ...this.gameApp.game });
        g.phase = 'map';
        g.currentFloor = (g.currentFloor ?? 0) + 1;
        this.gameApp.setGame(g);
        this.gameApp.sceneManager.switchTo('map');
      });
    });
  }
}
