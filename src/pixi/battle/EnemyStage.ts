/**
 * EnemyStage — 敌人舞台渲染 (PixiJS)
 * 多敌人网格 + 深度缩放 + 选中高亮 + HP条 + 意图图标
 */
import { Container, Sprite } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createProgressBar, COLORS, S } from '../UIFactory';
import { getEnemySprite } from '../AssetProvider';
// ENEMY_SPRITES now accessed via AssetProvider
import type { GameApp } from '../GameApp';
import type { Enemy } from '../../types/game';
import type { BattleGameState } from './types';

const W = 720;
const s = (v: number) => Math.round(v * S);

function getStageH(gameApp?: GameApp): number {
  const H = gameApp?.designH || 1280;
  return H * 0.58;
}

/** 敌人位置/深度计算 — 复刻 EnemyStageView.tsx 的 3 行深度系统 */
interface EnemyLayout {
  x: number;
  y: number;
  scale: number;        // 深度缩放
  brightness: number;   // 深度亮度
}

function calcEnemyLayout(enemies: Enemy[], idx: number, stageH: number): EnemyLayout {
  const count = enemies.length;
  const horizon = stageH * 0.35;
  const groundY = stageH * 0.70;

  if (count <= 2) {
    // 1-2 只：前排居中
    const spacing = count === 1 ? 0 : 200;
    const x = W / 2 + (idx - (count - 1) / 2) * spacing;
    return { x, y: groundY - 40, scale: 1.0, brightness: 1.0 };
  }

  if (count <= 4) {
    // 3-4 只：两排交错
    const row = idx < Math.ceil(count / 2) ? 0 : 1;
    const rowCount = row === 0 ? Math.ceil(count / 2) : Math.floor(count / 2);
    const rowIdx = row === 0 ? idx : idx - Math.ceil(count / 2);
    const spacing = Math.min(200, W * 0.6 / rowCount);
    const rowX = W / 2 + (rowIdx - (rowCount - 1) / 2) * spacing;

    if (row === 0) {
      return { x: rowX, y: groundY - 40, scale: 1.0, brightness: 1.0 };
    }
    return { x: rowX, y: groundY - 100, scale: 0.8, brightness: 0.8 };
  }

  // 5+ 只：三排
  const row = idx < 2 ? 0 : idx < 4 ? 1 : 2;
  const rowStarts = [0, 2, 4];
  const rowCounts = [2, 2, count - 4];
  const rowIdx = idx - rowStarts[row];
  const rc = rowCounts[row];
  const spacing = Math.min(180, W * 0.5 / rc);
  const rowX = W / 2 + (rowIdx - (rc - 1) / 2) * spacing;
  const depths = [
    { y: groundY - 40, s: 1.0, b: 1.0 },
    { y: groundY - 100, s: 0.85, b: 0.85 },
    { y: groundY - 150, s: 0.7, b: 0.7 },
  ];
  const d = depths[row];
  return { x: rowX, y: d.y, scale: d.s, brightness: d.b };
}

/** 敌人类型徽章颜色 */
const TYPE_COLORS: Record<string, { bg: number; text: string }> = {
  warrior: { bg: 0xc83c3c, text: '⚔' },
  tank: { bg: 0x3c6cc8, text: '🛡' },
  ranger: { bg: 0x3cc864, text: '🏹' },
  mage: { bg: 0x8b3cc8, text: '✨' },
  healer: { bg: 0xc8a03c, text: '✝' },
};

export interface EnemySpriteEntry {
  container: Container;
  sprite: Sprite | null;
  baseY: number;
  idx: number;
}

export interface EnemyStageResult {
  container: Container;
  enemyEntries: EnemySpriteEntry[];
}

export function buildEnemyStage(gameApp: GameApp, game: BattleGameState): EnemyStageResult {
  const container = new Container();
  const enemyEntries: EnemySpriteEntry[] = [];
  const enemies = game.enemies || [];
  if (enemies.length === 0) return { container, enemyEntries };

  const selectedUid = game.targetEnemyUid;

  enemies.forEach((enemy, idx) => {
    const stageH = getStageH(gameApp);
    const layout = calcEnemyLayout(enemies, idx, stageH);
    const ec = new Container();
    ec.x = layout.x;
    ec.y = layout.y;
    ec.scale.set(layout.scale);
    ec.alpha = layout.brightness;

    // 选中光圈
    const isSelected = selectedUid ? enemy.uid === selectedUid : idx === 0;
    if (isSelected) {
      const ring = new Graphics();
      ring.drawEllipse(0, 35, 40, 10);
      ring.lineStyle(2, 0xff6600, 0.6);
      ring.beginFill(0xff6600, 0.06);
      ring.drawEllipse(0, 35, 38, 9);
      ring.endFill();
      ec.addChild(ring);

      // 选中箭头
      const arrow = new Graphics();
      arrow.beginFill(0xff6600);
      arrow.moveTo(0, -55);
      arrow.lineTo(-6, -65);
      arrow.lineTo(6, -65);
      arrow.closePath();
      arrow.endFill();
      ec.addChild(arrow);
    }

    // enemy sprite (via AssetProvider)
    let sprite: Sprite | null = null;
    sprite = getEnemySprite(enemy.name, 5);
    if (sprite.texture.valid) {
      sprite.anchor.set(0.5, 1.0);
      sprite.y = 30;
      ec.addChild(sprite);
    }



    // 敌人类型徽章
    const archetype = (enemy as any).archetype || 'warrior';
    const typeCfg = TYPE_COLORS[archetype] || TYPE_COLORS.warrior;
    const badge = new Graphics();
    badge.beginFill(typeCfg.bg, 0.8);
    badge.drawRoundedRect(-10, -50, 20, 16, 4);
    badge.endFill();
    const badgeText = createText(typeCfg.text, { size: 10 });
    badgeText.anchor.set(0.5);
    badgeText.x = 0;
    badgeText.y = -42;
    ec.addChild(badge);
    ec.addChild(badgeText);

    // 名字
    const name = createText(enemy.name, { size: s(12), color: 0x44ff44, bold: true });
    name.anchor.set(0.5, 1);
    name.x = 0; name.y = -s(35);
    ec.addChild(name);

    // HP 条
    const hpRatio = enemy.hp / enemy.maxHp;
    const hpBarW = s(50);
    const hpBar = createProgressBar(hpBarW, s(6), hpRatio, {
      fill: hpRatio > 0.5 ? 0xcc2200 : hpRatio > 0.25 ? 0xe86820 : 0xff3333,
    });
    hpBar.x = -hpBarW / 2; hpBar.y = s(24);
    ec.addChild(hpBar);

    // HP 数字
    const hpText = createText(`${enemy.hp}/${enemy.maxHp}`, { size: s(9), color: 0xff8866 });
    hpText.anchor.set(0.5, 0);
    hpText.x = 0; hpText.y = s(32);
    ec.addChild(hpText);

    // 状态图标行（buff/debuff 简化显示）
    const statuses = (enemy as any).statusEffects || [];
    if (statuses.length > 0) {
      const statusRow = new Container();
      statuses.slice(0, 4).forEach((st: any, si: number) => {
        const icon = new Graphics();
        icon.beginFill(st.type === 'burn' ? 0xe06030 : st.type === 'poison' ? 0x30c040 : 0x6060c0, 0.8);
    icon.drawRoundedRect(si * 18, 0, 16, 16, 3);
    icon.endFill();
        const stacks = createText(String(st.stacks || st.turns || 1), { size: 8, color: 0xffffff });
        stacks.x = si * 18 + 5;
        stacks.y = 2;
        statusRow.addChild(icon);
        statusRow.addChild(stacks);
      });
      statusRow.x = -statuses.length * 9;
      statusRow.y = 54;
      ec.addChild(statusRow);
    }

    // 意图图标（攻击/防御/技能）— 自动生成如果没有
    let intent = (enemy as any).intent;
    if (!intent) {
      const r = Math.random();
      intent = r < 0.6 ? 'attack' : r < 0.85 ? 'defend' : 'skill';
    }
    const atkDmg = (enemy as any).attackDmg || (enemy as any).attack || 5;
    {
      const intentBg = new Graphics();
      const intentColor = intent === 'attack' ? 0xcc3333 : intent === 'defend' ? 0x3366cc : 0xcc8800;
      intentBg.beginFill(0x1a1a1a, 0.85);
      intentBg.drawRoundedRect(-18, -80, 36, 22, 4);
      intentBg.endFill();
      intentBg.lineStyle(1, intentColor, 0.8);
      intentBg.drawRoundedRect(-18, -80, 36, 22, 4);
      intentBg.lineStyle(0);
      ec.addChild(intentBg);

      const intentIcon = intent === 'attack' ? '\u2694' : intent === 'defend' ? '\ud83d\udee1' : '\u2728';
      const intentIconT = createText(intentIcon, { size: 11 });
      intentIconT.anchor.set(0.5);
      intentIconT.x = -5; intentIconT.y = -69;
      ec.addChild(intentIconT);

      // 攻击数值
      if (intent === 'attack') {
        const atkNum = createText(String(atkDmg), { size: 10, color: 0xff6666, bold: true });
        atkNum.anchor.set(0, 0.5);
        atkNum.x = 4; atkNum.y = -69;
        ec.addChild(atkNum);
      }
    }

    // 对话气泡（随机显示）
    const taunt = (enemy as any).taunt;
    if (taunt && taunt.length > 0) {
      const bubbleText = createText(taunt, { size: 10, color: 0xdddddd, maxWidth: 120 });
      const bw = Math.min(bubbleText.width + 16, 140);
      const bh = bubbleText.height + 12;
      const bubble = new Graphics();
      bubble.beginFill(0x1a1a1a, 0.9);
      bubble.drawRoundedRect(-bw / 2, -bh - 90, bw, bh, 6);
      bubble.endFill();
      bubble.lineStyle(1, 0x444444, 0.6);
      bubble.drawRoundedRect(-bw / 2, -bh - 90, bw, bh, 6);
      bubble.lineStyle(0);
      // 气泡尖角
      bubble.beginFill(0x1a1a1a, 0.9);
      bubble.moveTo(-4, -90); bubble.lineTo(0, -84); bubble.lineTo(4, -90);
      bubble.closePath(); bubble.endFill();
      ec.addChild(bubble);
      bubbleText.anchor.set(0.5, 0.5);
      bubbleText.x = 0; bubbleText.y = -bh / 2 - 90;
      ec.addChild(bubbleText);
    }

    // 点击选择敌人
    ec.eventMode = 'static';
    ec.cursor = 'pointer';
    ec.hitArea = { contains: (px: number, py: number) => px > -50 && px < 50 && py > -60 && py < 50 };
    ec.on('pointertap', () => {
      gameApp.setGame((prev: any) => ({ ...prev, targetEnemyUid: enemy.uid }));
    });

    container.addChild(ec);
    enemyEntries.push({ container: ec, sprite, baseY: layout.y, idx });
  });

  return { container, enemyEntries };
}

