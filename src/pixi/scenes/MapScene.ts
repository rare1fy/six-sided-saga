/**
 * MapScene — PixiJS 地图界面
 * 复刻 MapScreen.tsx 的节点路径布局
 * 增强：地图可拖拽滚动、当前可访问节点脉冲、节点类型信息
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createPanel, createButton, COLORS} from '../UIFactory';
import { GlobalTopBar, type TopBarData } from '../ui/GlobalTopBar';
import { SettingsPanel } from '../ui/SettingsPanel';
import { TweenManager, Ease } from '../animation/Tween';
import { playSfx } from '../SoundBridge';

const W = 720, H = 1280;

export class MapScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private mapLayer: Container | null = null;
  private time = 0;
  private pulseNodes: { g: Graphics; baseAlpha: number }[] = [];

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
    this.mapLayer = null;
    this.pulseNodes = [];
  }

  onGameStateChanged() {
    this.container.removeChildren();
    this.mapLayer = null;
    this.pulseNodes = [];
    this.build();
  }

  onTick = (delta: number) => {
    this.time += delta * 0.016;
    // 可访问节点脉冲
    for (const pn of this.pulseNodes) {
      pn.g.alpha = pn.baseAlpha + Math.sin(this.time * 3) * 0.2;
    }
  };

  private build() {
    const game = this.gameApp.game;

    // 背景
    const bg = new Graphics();
    bg.beginFill(0x080608, 1);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // GlobalTopBar
    const chapterNames = ['幽暗森林', '冰霜洞窟', '暗影深渊', '熔岩地狱', '永恒王座'];
    const chapterName = chapterNames[Math.min((game.chapter || 1) - 1, chapterNames.length - 1)];
    const topBarData: TopBarData = {
      soulCrystals: (game as any).blackMarketQuota || 0,
      soulMultiplier: (game as any).soulCrystalMultiplier || 1,
      gold: game.souls ?? (game as any).gold ?? 0,
      totalDamage: (game as any).stats?.totalDamageDealt || 0,
      chapterName,
    };
    const topBar = new GlobalTopBar(topBarData, () => {
      const modal = new SettingsPanel({ onClose: () => { modal.destroy(); } });
      this.container.addChild(modal.container);
      modal.open();
    });
    this.container.addChild(topBar.container);

    // 地图节点
    const mapNodes = game.map;
    if (!mapNodes || mapNodes.length === 0) {
      const noMap = createText('\u5730\u56fe\u751f\u6210\u4e2d...', { size: 18, color: COLORS.textDim });
      noMap.anchor.set(0.5);
      noMap.x = W / 2; noMap.y = H / 2;
      this.container.addChild(noMap);
      return;
    }

    // 地图容器（可拖拽滚动）
    this.mapLayer = new Container();
    this.container.addChild(this.mapLayer);

    const maxDepth = Math.max(...mapNodes.map((n: any) => n.depth));
    const layers: Map<number, any[]> = new Map();
    for (const node of mapNodes) {
      if (!layers.has(node.depth)) layers.set(node.depth, []);
      layers.get(node.depth)!.push(node);
    }

    const completedIds = new Set(mapNodes.filter((n: any) => n.completed).map((n: any) => n.id));

    const getVisitableIds = (): Set<string> => {
      const visitable = new Set<string>();
      for (const node of mapNodes) {
        if (node.completed) continue;
        if (node.depth === 0) {
          visitable.add(node.id);
        } else {
          for (const prevNode of mapNodes) {
            if (prevNode.completed && prevNode.connectedTo.includes(node.id)) {
              visitable.add(node.id);
              break;
            }
          }
        }
      }
      return visitable;
    };
    const visitableIds = getVisitableIds();

    const nodeSize = 34;
    const startY = 80;
    const rowHeight = Math.min(120, (H - 200) / (maxDepth + 1));
    const totalMapH = (maxDepth + 1) * rowHeight + 100;

    // 计算位置（从下到上：depth 0 在底部，boss在顶部）
    const nodePositions: Map<string, { x: number; y: number }> = new Map();
    for (let depth = 0; depth <= maxDepth; depth++) {
      const nodesAtDepth = layers.get(depth) || [];
      const spacing = W / (nodesAtDepth.length + 1);
      nodesAtDepth.forEach((node: any, idx: number) => {
        nodePositions.set(node.id, {
          x: spacing * (idx + 1),
          y: startY + (maxDepth - depth) * rowHeight, // 反转：depth越大越靠上
        });
      });
    }

    // 连线
    for (const node of mapNodes) {
      const from = nodePositions.get(node.id);
      if (!from) continue;
      for (const targetId of node.connectedTo) {
        const to = nodePositions.get(targetId);
        if (!to) continue;
        const line = new Graphics();
        const isPath = node.completed || visitableIds.has(targetId);
        line.lineStyle(isPath ? 2.5 : 1.5, isPath ? 0x4a4538 : 0x1a1820, isPath ? 0.8 : 0.3);
        line.moveTo(from.x, from.y);
        line.lineTo(to.x, to.y);
        this.mapLayer!.addChild(line);
      }
    }

    // 节点
    const NODE_COLORS: Record<string, number> = {
      enemy: 0xc8403c, elite: 0xe8d068, boss: 0xff6030,
      merchant: 0x3cc864, campfire: 0xff8844, event: 0x8b3cc8, treasure: 0xe8d068,
    };
    const NODE_ICONS: Record<string, string> = {
      enemy: '\u2694', elite: '\ud83d\udc80', boss: '\ud83d\udc51',
      merchant: '\ud83d\uded2', campfire: '\ud83d\udd25', event: '\u2753', treasure: '\ud83d\udce6',
    };
    const NODE_NAMES: Record<string, string> = {
      enemy: '\u6218\u6597', elite: '\u7cbe\u82f1', boss: 'Boss',
      merchant: '\u5546\u5e97', campfire: '\u7bc5\u706b', event: '\u4e8b\u4ef6', treasure: '\u5b9d\u7bb1',
    };

    for (const node of mapNodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;
      const { x, y } = pos;
      const isCompleted = node.completed;
      const isVisitable = visitableIds.has(node.id);
      const color = NODE_COLORS[node.type] || 0x555555;

      // 可访问节点的脉冲光环
      if (isVisitable) {
        const pulse = new Graphics();
        pulse.beginFill(color, 0.15);
        pulse.drawCircle(x, y, nodeSize / 2 + 6);
        pulse.endFill();
        this.mapLayer!.addChild(pulse);
        this.pulseNodes.push({ g: pulse, baseAlpha: 0.15 });
      }

      const circle = new Graphics();
      circle.beginFill(isCompleted ? 0x333333 : (isVisitable ? color : 0x1a1820), isVisitable ? 1 : 0.4);
      circle.drawCircle(x, y, nodeSize / 2);
      circle.endFill();
      circle.lineStyle(isVisitable ? 3 : 1.5, isCompleted ? 0x555555 : (isVisitable ? 0xffffff : color), isVisitable ? 1 : 0.4);
      circle.drawCircle(x, y, nodeSize / 2);
      circle.lineStyle(0);
      this.mapLayer!.addChild(circle);

      // 图标
      const icon = createText(
        isCompleted ? '\u2713' : (NODE_ICONS[node.type] || '?'),
        { size: 14, color: isCompleted ? 0x888888 : 0xffffff },
      );
      icon.anchor.set(0.5);
      icon.x = x; icon.y = y;
      this.mapLayer!.addChild(icon);

      // 节点名称标签（可访问时显示）
      if (isVisitable) {
        const label = createText(NODE_NAMES[node.type] || '', { size: 9, color: COLORS.textDim });
        label.anchor.set(0.5, 0);
        label.x = x; label.y = y + nodeSize / 2 + 4;
        this.mapLayer!.addChild(label);
      }

      // 交互
      if (isVisitable) {
        circle.eventMode = 'static';
        circle.cursor = 'pointer';
        circle.on('pointertap', () => this.handleNodeClick(node));
      }
    }

    // 如果地图太长，自动滚动到当前可访问层
    if (totalMapH > H - 100) {
      const firstVisitable = mapNodes.find((n: any) => visitableIds.has(n.id));
      if (firstVisitable) {
        const pos = nodePositions.get(firstVisitable.id);
        if (pos && pos.y > H * 0.6) {
          this.mapLayer.y = -(pos.y - H * 0.4);
        }
      }
      // 拖拽滚动
      this.setupDrag();
    }
  }

  private handleNodeClick(node: any) {
    playSfx('select');
    let updatedGame = { ...this.gameApp.game } as any;
    updatedGame.map = updatedGame.map.map((n: any) =>
      n.id === node.id ? { ...n, completed: true } : n
    );
    updatedGame.currentNodeId = node.id;

    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      updatedGame.phase = 'battle';
      this.gameApp.setGame(updatedGame);
      this.gameApp.sceneManager.switchTo('battle');
    } else {
      const sceneMap: Record<string, string> = {
        merchant: 'shop', campfire: 'campfire', event: 'event', treasure: 'event',
      };
      updatedGame.phase = node.type === 'merchant' ? 'merchant'
        : node.type === 'campfire' ? 'campfire' : 'event';
      this.gameApp.setGame(updatedGame);
      this.gameApp.sceneManager.switchTo(sceneMap[node.type] || 'event');
    }
  }

  private setupDrag() {
    if (!this.mapLayer) return;
    let dragging = false;
    let lastY = 0;
    const ml = this.mapLayer;

    ml.eventMode = 'static';
    ml.on('pointerdown', (e: any) => { dragging = true; lastY = e.global.y; });
    ml.on('pointermove', (e: any) => {
      if (!dragging) return;
      const dy = e.global.y - lastY;
      ml.y += dy;
      lastY = e.global.y;
      // 限制范围
      ml.y = Math.min(0, Math.max(-(ml.height - H + 100), ml.y));
    });
    ml.on('pointerup', () => { dragging = false; });
    ml.on('pointerupoutside', () => { dragging = false; });

    // 增大地图交互区域
    const hitArea = new Graphics();
    hitArea.beginFill(0x000000, 0.001);
    hitArea.drawRect(0, 0, W, Math.max(H, ml.height + 200));
    hitArea.endFill();
    ml.addChildAt(hitArea, 0);
  }
}
