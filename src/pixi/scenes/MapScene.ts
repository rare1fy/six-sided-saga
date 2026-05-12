/**
 * MapScene — 纯 PixiJS 地图界面
 * 复刻原 MapScreen.tsx 的节点+路径布局
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createPanel, COLORS } from '../UIFactory';
import { createTestEnemies, drawDiceSimple } from '../logic/SimpleBattleLogic';
import type { GameState } from '../../types/game';

export class MapScene implements GameScene {
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

  onExit() {
    this.container.removeChildren();
  }

  onGameStateChanged(game: GameState) {
    // 重建地图
    this.container.removeChildren();
    this.build();
  }

  private build() {
    const W = 720, H = 1280;
    const game = this.gameApp.game;

    // 背景
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x080608 });
    this.container.addChild(bg);

    // 顶栏
    const topBar = createPanel(W, 44, { bg: 0x0a0810, border: 0x2a2535, radius: 0 });
    this.container.addChild(topBar);

    const chapterText = createText(
      `第${game.chapter || 1}章 · ${game.currentLocation || '幽暗森林'}`,
      { size: 14, color: COLORS.gold, bold: true },
    );
    chapterText.x = 20; chapterText.y = 12;
    this.container.addChild(chapterText);

    const hpText = createText(
      `HP: ${game.hp}/${game.maxHp}  💰${game.gold || 0}`,
      { size: 12, color: COLORS.text },
    );
    hpText.x = W - 200; hpText.y = 14;
    this.container.addChild(hpText);

    // 地图节点渲染
    const mapNodes = game.map;
    if (!mapNodes || mapNodes.length === 0) {
      const noMap = createText('地图生成中...', { size: 18, color: COLORS.textDim });
      noMap.anchor.set(0.5);
      noMap.x = W / 2; noMap.y = H / 2;
      this.container.addChild(noMap);
      return;
    }

    // 按 depth 分层
    const maxDepth = Math.max(...mapNodes.map(n => n.depth));
    const layers: Map<number, typeof mapNodes> = new Map();
    for (const node of mapNodes) {
      if (!layers.has(node.depth)) layers.set(node.depth, []);
      layers.get(node.depth)!.push(node);
    }

    // 找当前节点（currentNodeId 或根据 completed 推断）
    const currentNodeId = game.currentNodeId;
    const completedIds = new Set(mapNodes.filter(n => n.completed).map(n => n.id));
    
    // 可访问的节点：depth 0 或其前驱已完成
    const getVisitableIds = (): Set<string> => {
      const visitable = new Set<string>();
      for (const node of mapNodes) {
        if (node.completed) continue;
        if (node.depth === 0) {
          visitable.add(node.id);
        } else {
          // 检查是否有前驱节点已完成并连接到这个节点
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

    const nodeSize = 32;
    const startY = 80;
    const availableH = H - 160;
    const rowHeight = availableH / (maxDepth + 1);

    // 计算节点位置
    const nodePositions: Map<string, { x: number; y: number }> = new Map();
    for (let depth = 0; depth <= maxDepth; depth++) {
      const nodesAtDepth = layers.get(depth) || [];
      const spacing = W / (nodesAtDepth.length + 1);
      nodesAtDepth.forEach((node, idx) => {
        const x = spacing * (idx + 1);
        const y = startY + depth * rowHeight;
        nodePositions.set(node.id, { x, y });
      });
    }

    // 绘制连线
    for (const node of mapNodes) {
      const from = nodePositions.get(node.id);
      if (!from) continue;
      for (const targetId of node.connectedTo) {
        const to = nodePositions.get(targetId);
        if (!to) continue;
        const line = new Graphics();
        line.moveTo(from.x, from.y);
        line.lineTo(to.x, to.y);
        const isPath = node.completed || visitableIds.has(targetId);
        line.stroke({ color: isPath ? 0x4a4538 : 0x1a1820, width: 2, alpha: isPath ? 0.8 : 0.3 });
        this.container.addChild(line);
      }
    }

    // 绘制节点
    const NODE_COLORS: Record<string, number> = {
      enemy: 0xc8403c, elite: 0xe8d068, boss: 0xff6030,
      merchant: 0x3cc864, campfire: 0xff8844, event: 0x8b3cc8, treasure: 0xe8d068,
    };
    const NODE_ICONS: Record<string, string> = {
      enemy: '⚔', elite: '💀', boss: '👑',
      merchant: '🛒', campfire: '🔥', event: '❓', treasure: '📦',
    };

    for (const node of mapNodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;
      const { x, y } = pos;

      const isCompleted = node.completed;
      const isVisitable = visitableIds.has(node.id);
      const color = NODE_COLORS[node.type] || 0x555555;

      const circle = new Graphics();
      circle.circle(x, y, nodeSize / 2);
      circle.fill({ color: isCompleted ? 0x333333 : (isVisitable ? color : 0x1a1820), alpha: isVisitable ? 1 : 0.4 });
      circle.circle(x, y, nodeSize / 2);
      circle.stroke({
        color: isCompleted ? 0x555555 : (isVisitable ? 0xffffff : color),
        width: isVisitable ? 3 : 1.5,
        alpha: isVisitable ? 1 : 0.4,
      });
      this.container.addChild(circle);

      // 图标
      const icon = createText(
        isCompleted ? '✓' : (NODE_ICONS[node.type] || '?'),
        { size: 13, color: isCompleted ? 0x888888 : 0xffffff },
      );
      icon.anchor.set(0.5);
      icon.x = x; icon.y = y;
      this.container.addChild(icon);

      // 可点击
      if (isVisitable) {
        circle.eventMode = 'static';
        circle.cursor = 'pointer';
        circle.on('pointertap', () => {
          // 标记为完成
          let updatedGame = { ...this.gameApp.game };
          updatedGame.map = updatedGame.map.map((n: any) =>
            n.id === node.id ? { ...n, completed: true } : n
          );
          updatedGame.currentNodeId = node.id;

          if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
            updatedGame.enemies = createTestEnemies(updatedGame.chapter || 1);
            updatedGame.phase = 'battle';
            updatedGame.playsLeft = updatedGame.maxPlays || 1;
            updatedGame.battleTurn = 1;
            updatedGame.isEnemyTurn = false;
            updatedGame = drawDiceSimple(updatedGame);
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
        });
      }
    }
  }
}
