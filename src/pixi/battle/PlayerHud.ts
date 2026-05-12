/**
 * PlayerHud — 玩家 HUD 下半区 (PixiJS)
 * 所有尺寸基于原版 448px 设计宽度 × S 缩放到 720px
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createButton, createProgressBar, COLORS, S } from '../UIFactory';
import { renderPixelDice, hasPixelDice } from './PixelDice';
import type { GameApp } from '../GameApp';
import type { BattleGameState } from './types';
import type { BattleController } from './BattleController';

const W = 720;
const s = (v: number) => Math.round(v * S); // 快捷缩放函数

function getH(gameApp?: GameApp): number {
  return gameApp?.designH || 1280;
}

// =============== 子构件 ===============

function buildWaveInfo(game: BattleGameState, stageH: number): Container {
  const c = new Container();
  const waveY = stageH - s(20);
  const wave = createText(
    `第${(game.currentWaveIndex ?? 0) + 1}波 · 回合${game.battleTurn || 1}`,
    { size: s(11), color: COLORS.gold },
  );
  wave.x = s(12); wave.y = waveY;
  c.addChild(wave);

  const playsLeft = game.playsLeft ?? 0;
  const maxPlays = game.maxPlays ?? 1;
  const plays = createText(
    `出牌: ${playsLeft}/${maxPlays}`,
    { size: s(10), color: playsLeft > 0 ? COLORS.green : COLORS.red },
  );
  plays.x = W - s(75); plays.y = waveY;
  c.addChild(plays);
  return c;
}

function buildStatusRow(game: BattleGameState): Container {
  const row = new Container();
  const classNames: Record<string, [string, number]> = {
    warrior: ['🩸 嗜血狂战', 0xff6060],
    mage: ['✨ 星界魔导', 0xc0a0ff],
    rogue: ['🗡 影锋刺客', 0x60ff90],
  };
  const [cn, cc] = classNames[game.playerClass || 'warrior'] || classNames.warrior;
  const className = createText(cn, { size: s(11), color: cc, bold: true });
  className.x = s(10); className.y = 0;
  row.addChild(className);

  // 等级徽章
  const lvBadge = new Graphics();
  lvBadge.beginFill(0x1a1a2a, 0.9);
  lvBadge.drawRoundedRect(0, 0, s(36), s(16), s(3));
  lvBadge.endFill();
  lvBadge.lineStyle(1, COLORS.gold, 0.5);
  lvBadge.drawRoundedRect(0, 0, s(36), s(16), s(3));
  lvBadge.lineStyle(0);
  lvBadge.x = s(115); lvBadge.y = -s(1);
  row.addChild(lvBadge);
  const lvText = createText(`Lv${game.level || 1}`, { size: s(9), color: COLORS.gold, bold: true });
  lvText.x = s(120); lvText.y = s(1);
  row.addChild(lvText);

  // 状态图标
  let statusX = s(160);
  if (game.armor > 0) {
    row.addChild(buildStatusIcon(statusX, 0, '🛡', String(game.armor), 0x3c6cc8));
    statusX += s(24);
  }
  if (game.chantShield > 0) {
    row.addChild(buildStatusIcon(statusX, 0, '🔮', String(game.chantShield), 0x8b3cc8));
    statusX += s(24);
  }
  const statuses = game.statuses || [];
  statuses.slice(0, 4).forEach((st, i) => {
    const stColor = st.type === 'burn' ? 0xe06030 : st.type === 'poison' ? 0x30c040
      : st.type === 'weak' ? 0x8888cc : st.type === 'vulnerable' ? 0xcc6666 : 0x6060c0;
    const val = (st as any).stacks ?? (st as any).turns ?? st.value ?? 1;
    row.addChild(buildStatusIcon(statusX + i * s(24), 0, getStatusEmoji(st.type), String(val), stColor));
  });

  // 回合标记
  const turnMark = createText(`R${game.battleTurn || 1}`, { size: s(9), color: COLORS.textDim });
  turnMark.x = W - s(35); turnMark.y = s(1);
  row.addChild(turnMark);
  return row;
}

function buildStatusIcon(x: number, y: number, emoji: string, value: string, color: number): Container {
  const c = new Container();
  const bg = new Graphics();
  bg.beginFill(color, 0.25);
  bg.drawRoundedRect(0, 0, s(22), s(16), s(3));
  bg.endFill();
  bg.lineStyle(1, color, 0.5);
  bg.drawRoundedRect(0, 0, s(22), s(16), s(3));
  bg.lineStyle(0);
  c.addChild(bg);
  const icon = createText(emoji, { size: s(8) });
  icon.x = s(1); icon.y = s(1);
  c.addChild(icon);
  const num = createText(value, { size: s(8), color: 0xffffff, bold: true });
  num.x = s(12); num.y = s(2);
  c.addChild(num);
  c.x = x; c.y = y;
  return c;
}

function getStatusEmoji(type: string): string {
  const map: Record<string, string> = {
    burn: '🔥', poison: '☠', weak: '💤', vulnerable: '💔',
    regen: '💚', thorns: '🌹', fury: '💢', shield: '🛡',
  };
  return map[type] || '⭐';
}

function buildHpBar(game: BattleGameState): Container {
  const c = new Container();
  const barW = W - s(24);
  const barH = s(12);

  const bg = new Graphics();
  bg.beginFill(0x0a0a14, 1);
  bg.drawRoundedRect(0, 0, barW, barH, s(1));
  bg.endFill();
  bg.lineStyle(s(2), 0x3a3a4e, 1);
  bg.drawRoundedRect(0, 0, barW, barH, s(1));
  bg.lineStyle(0);
  c.addChild(bg);

  const hpRatio = Math.min(game.hp / game.maxHp, 1);
  if (hpRatio > 0) {
    const hpColor = hpRatio > 0.5 ? COLORS.hpGreen : hpRatio > 0.25 ? 0xc8a030 : 0xc83030;
    const fill = new Graphics();
    fill.beginFill(hpColor);
    fill.drawRoundedRect(s(2), s(2), (barW - s(4)) * hpRatio, barH - s(4), s(1));
    fill.endFill();
    c.addChild(fill);
  }

  if (game.armor > 0) {
    const armorRatio = Math.min(game.armor / game.maxHp, 1);
    const startX = s(2) + (barW - s(4)) * hpRatio;
    const armorW = Math.min((barW - s(4)) * armorRatio, barW - s(4) - startX + s(2));
    if (armorW > 0) {
      const armorBar = new Graphics();
      armorBar.beginFill(0x3c6cc8, 0.6);
      armorBar.drawRoundedRect(startX, s(2), armorW, barH - s(4), s(1));
      armorBar.endFill();
      c.addChild(armorBar);
    }
  }

  const hpText = createText(`${game.hp}/${game.maxHp}`, { size: s(10), color: 0xffffff, bold: true });
  hpText.anchor.set(0.5, 0.5);
  hpText.x = barW / 2; hpText.y = barH / 2;
  c.addChild(hpText);
  return c;
}

function buildDiceFlow(game: BattleGameState): Container {
  const c = new Container();
  const bagCount = game.diceBag?.length || 0;
  const discardCount = game.discardPile?.length || 0;
  const handDice = game.dice?.filter((d: any) => !d.spent) || [];
  const midX = W / 2;

  // 左侧骰袋
  const bagBox = new Graphics();
  bagBox.beginFill(0x1a1a2a, 0.9);
  bagBox.drawRoundedRect(0, 0, s(40), s(20), s(3));
  bagBox.endFill();
  bagBox.lineStyle(s(2), 0x3a6a3a, 0.8);
  bagBox.drawRoundedRect(0, 0, s(40), s(20), s(3));
  bagBox.lineStyle(0);
  bagBox.x = s(8);
  c.addChild(bagBox);
  const bagT = createText(`🎲 ${bagCount}`, { size: s(9), color: 0x88cc88, bold: true });
  bagT.x = s(12); bagT.y = s(3);
  c.addChild(bagT);

  // 中间小方块指示
  const blockSize = s(10);
  const blockGap = s(3);
  const totalBlockW = handDice.length * blockSize + (handDice.length - 1) * blockGap;
  const blockStartX = midX - totalBlockW / 2;
  handDice.forEach((d: any, i: number) => {
    const bx = blockStartX + i * (blockSize + blockGap);
    const block = new Graphics();
    block.beginFill(d.selected ? 0x40c060 : 0x555555, 0.8);
    block.drawRoundedRect(bx, s(2), blockSize, blockSize + s(3), s(2));
    block.endFill();
    block.lineStyle(1, d.selected ? 0x60e080 : 0x444444, 0.6);
    block.drawRoundedRect(bx, s(2), blockSize, blockSize + s(3), s(2));
    block.lineStyle(0);
    c.addChild(block);
    const valT = createText(String(d.value), { size: s(7), color: 0xffffff, bold: true });
    valT.x = bx + s(2); valT.y = s(3);
    c.addChild(valT);
  });
  if (handDice.length === 0) {
    const emptyT = createText('empty', { size: s(8), color: 0x555555 });
    emptyT.anchor.set(0.5, 0); emptyT.x = midX; emptyT.y = s(4);
    c.addChild(emptyT);
  }

  // 连接线
  const lineG = new Graphics();
  lineG.lineStyle(1, 0x444444, 0.5);
  lineG.moveTo(s(52), s(10)); lineG.lineTo(blockStartX - s(6), s(10));
  lineG.moveTo(blockStartX + totalBlockW + s(6), s(10)); lineG.lineTo(W - s(52), s(10));
  c.addChild(lineG);

  // 右侧弃牌
  const discBox = new Graphics();
  discBox.beginFill(0x1a1a2a, 0.9);
  discBox.drawRoundedRect(0, 0, s(40), s(20), s(3));
  discBox.endFill();
  discBox.lineStyle(s(2), 0x6a3a3a, 0.8);
  discBox.drawRoundedRect(0, 0, s(40), s(20), s(3));
  discBox.lineStyle(0);
  discBox.x = W - s(48);
  c.addChild(discBox);
  const discT = createText(`🗑 ${discardCount}`, { size: s(9), color: 0xcc8888, bold: true });
  discT.x = W - s(44); discT.y = s(3);
  c.addChild(discT);
  return c;
}

function buildDiceHand(game: BattleGameState, gameApp: GameApp, rebuild: () => void, ctrl?: BattleController): Container {
  const c = new Container();
  const dice = game.dice || [];
  const activeDice = dice.filter((d: any) => !d.spent);
  const diceSize = s(56);
  const diceGap = s(10);
  const totalW = activeDice.length * diceSize + (activeDice.length - 1) * diceGap;
  const startX = (W - totalW) / 2;

  activeDice.forEach((die: any, visualIdx: number) => {
    const realIdx = dice.indexOf(die);
    const dx = startX + visualIdx * (diceSize + diceGap);
    const dieC = new Container();
    dieC.x = dx;
    dieC.y = die.selected ? -s(18) : 0;

    if (die.selected) {
      const glow = new Graphics();
      glow.beginFill(0x40c060, 0.12);
      glow.drawRoundedRect(-s(3), -s(3), diceSize + s(6), diceSize + s(8), s(4));
      glow.endFill();
      dieC.addChild(glow);
    }

    const defId = die.diceDefId || 'standard';
    const dieElement = die.collapsedElement || (die.element !== 'normal' ? die.element : undefined);
    const pixelDie = renderPixelDice(die.value, defId, diceSize, die.selected, dieElement);
    dieC.addChild(pixelDie);

    if (die.element && die.element !== 'normal') {
      const elemColors: Record<string, number> = {
        fire: 0xff8040, ice: 0x60c0f0, thunder: 0xe0d040,
        poison: 0x60e060, holy: 0xe0d8a0, shadow: 0xa080d0,
      };
      const badge = new Graphics();
      badge.beginFill(elemColors[die.element] || 0xaaaaaa, 1);
      badge.drawCircle(diceSize - s(2), s(2), s(5));
      badge.endFill();
      badge.lineStyle(1, 0x000000, 0.4);
      badge.drawCircle(diceSize - s(2), s(2), s(5));
      badge.lineStyle(0);
      dieC.addChild(badge);
    }

    dieC.eventMode = 'static';
    dieC.cursor = 'pointer';

    const hoverGlow = new Graphics();
    hoverGlow.lineStyle(2, 0x60e090, 0.5);
    hoverGlow.drawRoundedRect(-s(3), -s(3), diceSize + s(6), diceSize + s(6), s(4));
    hoverGlow.lineStyle(0);
    hoverGlow.visible = false;
    dieC.addChild(hoverGlow);

    dieC.on('pointerover', () => {
      if (!die.selected) { hoverGlow.visible = true; dieC.scale.set(1.08); dieC.y -= s(4); }
    });
    dieC.on('pointerout', () => {
      hoverGlow.visible = false; dieC.scale.set(1); dieC.y = die.selected ? -s(18) : 0;
    });
    dieC.on('pointertap', () => {
      if (ctrl) { ctrl.toggleSelect(die.id); }
      else {
        gameApp.setGame((prev: any) => ({
          ...prev,
          dice: prev.dice.map((d: any, i: number) => i === realIdx ? { ...d, selected: !d.selected } : d),
        }));
        rebuild();
      }
    });
    c.addChild(dieC);
  });

  if (activeDice.length === 0) {
    const empty = createText('所有骰子已使用', { size: s(11), color: COLORS.textDim });
    empty.anchor.set(0.5, 0.5);
    empty.x = W / 2; empty.y = s(20);
    c.addChild(empty);
  }
  return c;
}

function buildActionButtons(game: BattleGameState, _gameApp: GameApp, _rebuild: () => void, ctrl?: BattleController): Container {
  const c = new Container();
  const dice = game.dice || [];
  const hasSelected = dice.some((d: any) => d.selected && !d.spent);

  const freeRerolls = game.freeRerollsLeft || 0;
  const rerollLabel = freeRerolls > 0 ? `🔄 ${freeRerolls}` : '🔄 -3';
  const rerollBtn = createButton(rerollLabel, s(48), s(36), {
    variant: freeRerolls > 0 ? 'primary' : 'danger', fontSize: s(10),
  });
  rerollBtn.x = s(6); rerollBtn.y = 0;
  rerollBtn.on('pointertap', () => { if (ctrl) ctrl.reroll(); });
  c.addChild(rerollBtn);

  const handInfo = ctrl ? ctrl.getCurrentHand() : { bestHand: '' };
  const canPlay = hasSelected && (game.playsLeft ?? 0) > 0;
  const isEndTurn = !hasSelected && game.playsLeft === 0;
  const playLabel = canPlay
    ? `▶ 出牌: ${handInfo.bestHand || '普通攻击'}`
    : isEndTurn ? '→ 结束回合' : '选择骰子...';
  const mainBtnW = W - s(62);
  const playBtn = createButton(playLabel, mainBtnW, s(36), {
    variant: canPlay ? 'primary' : isEndTurn ? 'gold' : 'ghost',
    fontSize: s(12), disabled: !canPlay && !isEndTurn,
  });
  playBtn.x = s(58); playBtn.y = 0;
  c.addChild(playBtn);

  if (canPlay) playBtn.on('pointertap', () => { if (ctrl) ctrl.playHand(); });
  else if (isEndTurn) playBtn.on('pointertap', () => { if (ctrl) ctrl.endTurn(); });
  return c;
}

function buildRelicBar(game: BattleGameState): Container {
  const c = new Container();
  const barW = W - s(24);
  const barH = s(28);
  const relicBg = new Graphics();
  relicBg.beginFill(0x12101a, 0.9);
  relicBg.drawRoundedRect(0, 0, barW, barH, s(3));
  relicBg.endFill();
  relicBg.lineStyle(1, 0x2a2535, 1);
  relicBg.drawRoundedRect(0, 0, barW, barH, s(3));
  relicBg.lineStyle(0);
  c.addChild(relicBg);

  const relics = game.relics || [];
  if (relics.length === 0) {
    const emptyText = createText('▲ 遗物库（空）', { size: s(10), color: COLORS.textDim });
    emptyText.anchor.set(0.5, 0.5);
    emptyText.x = barW / 2; emptyText.y = barH / 2;
    c.addChild(emptyText);
  } else {
    const label = createText(`▲ 遗物 ×${relics.length}`, { size: s(10), color: COLORS.gold });
    label.x = s(8); label.y = s(6);
    c.addChild(label);
    relics.slice(0, 8).forEach((r: any, i: number) => {
      const rIcon = new Graphics();
      rIcon.beginFill(0x2a2535, 0.8);
      rIcon.drawRoundedRect(s(50) + i * s(24), s(3), s(20), s(20), s(2));
      rIcon.endFill();
      rIcon.lineStyle(1, COLORS.gold, 0.4);
      rIcon.drawRoundedRect(s(50) + i * s(24), s(3), s(20), s(20), s(2));
      rIcon.lineStyle(0);
      c.addChild(rIcon);
      const rText = createText(r.icon || '?', { size: s(10) });
      rText.x = s(53) + i * s(24); rText.y = s(5);
      c.addChild(rText);
    });
  }
  return c;
}

// ===================== 主导出 =====================

export interface PlayerHudResult { container: Container; }

export function buildPlayerHud(gameApp: GameApp, game: BattleGameState, rebuild: () => void, ctrl?: BattleController): PlayerHudResult {
  const container = new Container();
  const H = getH(gameApp);
  const STAGE_H = H * 0.58;
  const HUD_H = H - STAGE_H;
  const hudY = STAGE_H;

  // HUD 背景
  const hudBg = new Graphics();
  hudBg.beginFill(0x1a1814, 0.98);
  hudBg.drawRect(0, hudY, W, HUD_H);
  hudBg.endFill();
  hudBg.beginFill(0x141210, 0.5);
  hudBg.drawRect(0, hudY, W, s(10));
  hudBg.endFill();
  hudBg.lineStyle(s(3), 0x2a2420, 1);
  hudBg.moveTo(0, hudY); hudBg.lineTo(W, hudY);
  hudBg.lineStyle(0);
  hudBg.beginFill(0x000000, 0.3);
  hudBg.drawRect(0, hudY + s(3), W, s(5));
  hudBg.endFill();
  container.addChild(hudBg);

  container.addChild(buildWaveInfo(game, STAGE_H));

  let yOff = hudY + s(8);

  const statusRow = buildStatusRow(game);
  statusRow.y = yOff;
  container.addChild(statusRow);
  yOff += s(20);

  const hpBar = buildHpBar(game);
  hpBar.x = s(12); hpBar.y = yOff;
  container.addChild(hpBar);
  yOff += s(18);

  const diceFlow = buildDiceFlow(game);
  diceFlow.y = yOff;
  container.addChild(diceFlow);
  yOff += s(24);

  const diceHand = buildDiceHand(game, gameApp, rebuild, ctrl);
  diceHand.y = yOff;
  container.addChild(diceHand);
  yOff += s(80);

  const actions = buildActionButtons(game, gameApp, rebuild, ctrl);
  actions.y = yOff;
  container.addChild(actions);
  yOff += s(44);

  const relicBar = buildRelicBar(game);
  relicBar.x = s(12);
  relicBar.y = Math.min(yOff, H - s(32));
  container.addChild(relicBar);

  return { container };
}

export function createFloatingDamage(
  text: string, x: number, y: number, color: number = 0xff4444,
): { container: Container; update: (dt: number) => boolean } {
  const c = new Container();
  const t = createText(text, { size: s(22), color, bold: true });
  t.anchor.set(0.5);
  t.x = x; t.y = y;
  c.addChild(t);
  let elapsed = 0;
  const duration = 1.2;
  return {
    container: c,
    update(dt: number): boolean {
      elapsed += dt;
      t.y = y - elapsed * s(30);
      t.alpha = 1 - elapsed / duration;
      return elapsed >= duration;
    },
  };
}
