/**
 * Tooltip — PixiJS 弹窗/提示框系统
 * 支持骰子详情、敌人信息、buff详情等
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createPanel, COLORS } from '../UIFactory';
import { getDiceDef } from '../../data/dice';
import type { Enemy } from '../../types/game';

const W = 720;

// ============================================================
// 骰子 Tooltip
// ============================================================

export function buildDiceTooltip(diceDefId: string, value: number, x: number, y: number): Container {
  const c = new Container();
  const def = getDiceDef(diceDefId);
  if (!def) return c;

  const tipW = 200;
  const tipH = 80;
  const tipX = Math.max(8, Math.min(x - tipW / 2, W - tipW - 8));
  const tipY = y - tipH - 12;

  // 背景面板
  const panel = createPanel(tipW, tipH, {
    bg: 0x0c0a14, border: 0x444444, borderWidth: 1, radius: 4, alpha: 0.95,
  });
  panel.x = tipX;
  panel.y = tipY;
  c.addChild(panel);

  // 名字标签
  const nameColor = diceDefId.startsWith('w_') ? 0xff6060
    : diceDefId.startsWith('mage_') ? 0xa070ff
    : diceDefId.startsWith('r_') ? 0x60d080
    : 0xc8c8d0;
  const name = createText(def.name, { size: 11, color: nameColor, bold: true });
  name.x = tipX + 8;
  name.y = tipY + 6;
  c.addChild(name);

  // 描述
  const desc = createText(def.description || '', { size: 9, color: COLORS.text, maxWidth: tipW - 16 });
  desc.x = tipX + 8;
  desc.y = tipY + 24;
  c.addChild(desc);

  // 面值
  const faces = createText(`面值: [${def.faces.join(', ')}]`, { size: 8, color: COLORS.textDim });
  faces.x = tipX + 8;
  faces.y = tipY + tipH - 18;
  c.addChild(faces);

  // 底部小三角
  const arrow = new Graphics();
  arrow.beginFill(0x0c0a14, 0.9);
  arrow.moveTo(x - 5, tipY + tipH);
  arrow.lineTo(x, tipY + tipH + 5);
  arrow.lineTo(x + 5, tipY + tipH);
  arrow.closePath();
  arrow.endFill();
  c.addChild(arrow);

  return c;
}

// ============================================================
// 敌人详情弹窗
// ============================================================

export function buildEnemyInfoPopup(enemy: Enemy, onClose: () => void): Container {
  const c = new Container();

  // 半透明遮罩
  const mask = new Graphics();
  mask.beginFill(0x000000, 0.7);
    mask.drawRect(0, 0, W, 1280);
    mask.endFill();
  mask.eventMode = 'static';
  mask.on('pointertap', onClose);
  c.addChild(mask);

  // 面板
  const panelW = W * 0.85;
  const panelH = 280;
  const panelX = (W - panelW) / 2;
  const panelY = 400;

  const panel = createPanel(panelW, panelH, {
    bg: 0x0a0a12, border: 0x333344, borderWidth: 2, radius: 6, alpha: 0.98,
  });
  panel.x = panelX;
  panel.y = panelY;
  panel.eventMode = 'static'; // 阻止穿透
  c.addChild(panel);

  let yOff = panelY + 12;

  // 名字 + emoji
  const header = createText(`${enemy.emoji} ${enemy.name}`, { size: 16, color: 0xe8e0f0, bold: true });
  header.x = panelX + 16;
  header.y = yOff;
  c.addChild(header);
  yOff += 28;

  // 类型
  const typeColors: Record<string, number> = {
    warrior: 0xff6060, guardian: 0x6090ff, ranger: 0x60ff90, caster: 0xc080ff, priest: 0xffe060,
  };
  const typeNames: Record<string, string> = {
    warrior: '战士', guardian: '守卫', ranger: '射手', caster: '法师', priest: '牧师',
  };
  const typeLabel = createText(
    typeNames[enemy.combatType] || enemy.combatType,
    { size: 11, color: typeColors[enemy.combatType] || 0xcccccc, bold: true },
  );
  typeLabel.x = panelX + 16;
  typeLabel.y = yOff;
  c.addChild(typeLabel);
  yOff += 22;

  // HP / 攻击力 / 护甲
  const stats = [
    { label: '生命', value: `${enemy.hp}/${enemy.maxHp}`, color: 0xff6666 },
    { label: '攻击', value: String(enemy.attackDmg), color: 0xffaa66 },
    { label: '护甲', value: String(enemy.armor), color: 0x6699ff },
  ];
  stats.forEach((st, i) => {
    const bg = new Graphics();
    bg.beginFill(0x080b0e, 0.8);
    bg.drawRoundedRect(panelX + 16 + i * 100, yOff, 90, 36, 3);
    bg.endFill();
    bg.lineStyle(1, 0x333344, 1);
    bg.drawRoundedRect(panelX + 16 + i * 100, yOff, 90, 36, 3);
    bg.lineStyle(0);
    c.addChild(bg);

    const lbl = createText(st.label, { size: 9, color: COLORS.textDim });
    lbl.x = panelX + 24 + i * 100;
    lbl.y = yOff + 4;
    c.addChild(lbl);

    const val = createText(st.value, { size: 12, color: st.color, bold: true });
    val.x = panelX + 24 + i * 100;
    val.y = yOff + 18;
    c.addChild(val);
  });
  yOff += 50;

  // 状态效果
  const statuses = (enemy as any).statuses || [];
  if (statuses.length > 0) {
    const statusText = statuses.map((s: any) => `${s.type} ${s.value}`).join('  ');
    const stLabel = createText(statusText, { size: 10, color: COLORS.text });
    stLabel.x = panelX + 16;
    stLabel.y = yOff;
    c.addChild(stLabel);
    yOff += 20;
  }

  // 描述
  if (enemy.description) {
    const descText = createText(enemy.description, { size: 10, color: COLORS.text, maxWidth: panelW - 32 });
    descText.x = panelX + 16;
    descText.y = yOff;
    c.addChild(descText);
  }

  // 关闭按钮
  const closeBtn = createText('✕', { size: 16, color: COLORS.textDim });
  closeBtn.x = panelX + panelW - 24;
  closeBtn.y = panelY + 8;
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointertap', onClose);
  c.addChild(closeBtn);

  return c;
}

// ============================================================
// 通用 Toast 消息
// ============================================================

export function buildToast(msg: string): { container: Container; update: (dt: number) => boolean } {
  const c = new Container();
  const panelW = Math.min(msg.length * 12 + 32, W - 40);
  const panelH = 32;

  const bg = new Graphics();
  bg.beginFill(0x1a1a2a, 0.92);
    bg.drawRoundedRect(0, 0, panelW, panelH, 4);
    bg.endFill();
  bg.lineStyle(1, 0x444466, 1);
    bg.drawRoundedRect(0, 0, panelW, panelH, 4);
    bg.lineStyle(0);
  c.addChild(bg);

  const text = createText(msg, { size: 11, color: 0xe8e0f0, bold: true });
  text.anchor.set(0.5, 0.5);
  text.x = panelW / 2;
  text.y = panelH / 2;
  c.addChild(text);

  c.x = (W - panelW) / 2;
  c.y = 100;

  let elapsed = 0;
  const duration = 2.0;

  return {
    container: c,
    update(dt: number): boolean {
      elapsed += dt;
      if (elapsed > duration * 0.7) {
        c.alpha = 1 - (elapsed - duration * 0.7) / (duration * 0.3);
      }
      c.y = 100 - elapsed * 10;
      return elapsed >= duration;
    },
  };
}

// ============================================================
// 遗物面板（展开）
// ============================================================

export function buildRelicPanel(relics: any[], onClose: () => void): Container {
  const c = new Container();

  // 遮罩
  const mask = new Graphics();
  mask.beginFill(0x000000, 0.6);
    mask.drawRect(0, 0, W, 1280);
    mask.endFill();
  mask.eventMode = 'static';
  mask.on('pointertap', onClose);
  c.addChild(mask);

  // 面板
  const panelW = W - 32;
  const panelH = Math.min(relics.length * 48 + 60, 600);
  const panelX = 16;
  const panelY = 1280 - panelH - 16;

  const panel = createPanel(panelW, panelH, {
    bg: 0x0a0a14, border: 0x2a2535, borderWidth: 2, radius: 6, alpha: 0.98,
  });
  panel.x = panelX;
  panel.y = panelY;
  panel.eventMode = 'static';
  c.addChild(panel);

  // 标题
  const title = createText('遗物库', { size: 14, color: COLORS.gold, bold: true });
  title.x = panelX + 16;
  title.y = panelY + 12;
  c.addChild(title);

  // 遗物列表
  relics.forEach((relic, i) => {
    const ry = panelY + 40 + i * 44;
    if (ry > panelY + panelH - 20) return;

    const row = new Graphics();
    row.beginFill(0x12101a, 0.8);
    row.drawRoundedRect(panelX + 8, ry, panelW - 16, 40, 3);
    row.endFill();
    row.lineStyle(1, 0x2a2535, 1);
    row.drawRoundedRect(panelX + 8, ry, panelW - 16, 40, 3);
    row.lineStyle(0);
    c.addChild(row);

    const icon = createText(relic.icon || '?', { size: 16 });
    icon.x = panelX + 20;
    icon.y = ry + 10;
    c.addChild(icon);

    const name = createText(relic.name || '未知遗物', { size: 11, color: 0xe8e0f0, bold: true });
    name.x = panelX + 48;
    name.y = ry + 4;
    c.addChild(name);

    const desc = createText(relic.description || '', { size: 9, color: COLORS.textDim, maxWidth: panelW - 80 });
    desc.x = panelX + 48;
    desc.y = ry + 22;
    c.addChild(desc);
  });

  // 关闭
  const closeBtn = createText('✕', { size: 16, color: COLORS.textDim });
  closeBtn.x = panelX + panelW - 24;
  closeBtn.y = panelY + 8;
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointertap', onClose);
  c.addChild(closeBtn);

  return c;
}