/**
 * GlobalTopBar.ts - 全局顶部状态栏 (PixiJS)
 *
 * 对标原版 GlobalTopBar.tsx:
 * 左侧: 魂晶(紫) | 金币(金) | 总伤害(红)
 * 右侧: 章节名标签 | 设置齿轮
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import { createText, createButton, COLORS } from '../UIFactory';

const W = 720;
const BAR_H = 38;

export interface TopBarData {
  soulCrystals: number;
  soulMultiplier: number;
  gold: number;
  totalDamage: number;
  chapterName: string;
}

export class GlobalTopBar {
  container: Container;
  private soulText: any = null;
  private soulMultText: any = null;
  private goldText: any = null;
  private dmgText: any = null;
  private chapterText: any = null;

  constructor(
    data: TopBarData,
    onSettingsClick: () => void,
    onDamageClick?: () => void,
  ) {
    this.container = new Container();
    this.container.zIndex = 80;

    // 背景
    const bg = new Graphics();
    bg.beginFill(0x0c0a10, 0.95);
    bg.drawRect(0, 0, W, BAR_H);
    bg.endFill();
    // 底部边框线
    bg.lineStyle(2, COLORS.panelBorder, 1);
    bg.moveTo(0, BAR_H - 1);
    bg.lineTo(W, BAR_H - 1);
    bg.lineStyle(0);
    this.container.addChild(bg);

    let leftX = 8;

    // === 魂晶 ===
    leftX = this.buildStatBadge(
      leftX, '\ud83d\udd2e', data.soulCrystals.toString(), `${Math.round(data.soulMultiplier * 100)}%`,
      0x9040c8, 0xc080ff,
    );

    // 分隔线
    leftX = this.addSeparator(leftX);

    // === 金币 ===
    leftX = this.buildStatBadge(
      leftX, '\ud83d\udcb0', data.gold.toString(), undefined,
      COLORS.gold, 0xfff0c0,
    );

    leftX = this.addSeparator(leftX);

    // === 总伤害 ===
    const dmgContainer = new Container();
    dmgContainer.x = leftX;
    dmgContainer.y = (BAR_H - 22) / 2;
    dmgContainer.eventMode = 'static';
    dmgContainer.cursor = 'pointer';
    if (onDamageClick) dmgContainer.on('pointertap', onDamageClick);

    const dmgBg = new Graphics();
    dmgBg.beginFill(0x0a0a0a, 1);
    dmgBg.drawRoundedRect(0, 0, 68, 22, 2);
    dmgBg.endFill();
    dmgBg.lineStyle(2, COLORS.panelBorder, 1);
    dmgBg.drawRoundedRect(0, 0, 68, 22, 2);
    dmgBg.lineStyle(0);
    dmgContainer.addChild(dmgBg);

    const dmgIcon = createText('\u2694', { size: 10 });
    dmgIcon.x = 6; dmgIcon.y = 4;
    dmgContainer.addChild(dmgIcon);

    this.dmgText = createText(String(data.totalDamage), {
      size: 10, color: COLORS.red, bold: true,
    });
    this.dmgText.x = 22; this.dmgText.y = 5;
    dmgContainer.addChild(this.dmgText);

    this.container.addChild(dmgContainer);

    // === 右侧 ===
    // 章节名
    const chapterBg = new Graphics();
    const chapterW = 80;
    chapterBg.beginFill(0x0a0a0a, 1);
    chapterBg.drawRoundedRect(0, 0, chapterW, 22, 2);
    chapterBg.endFill();
    chapterBg.lineStyle(2, COLORS.panelBorder, 1);
    chapterBg.drawRoundedRect(0, 0, chapterW, 22, 2);
    chapterBg.lineStyle(0);
    chapterBg.x = W - 130;
    chapterBg.y = (BAR_H - 22) / 2;
    this.container.addChild(chapterBg);

    this.chapterText = createText(data.chapterName, {
      size: 9, color: COLORS.gold, bold: true,
    });
    this.chapterText.anchor.set(0.5, 0.5);
    this.chapterText.x = W - 130 + chapterW / 2;
    this.chapterText.y = BAR_H / 2;
    this.container.addChild(this.chapterText);

    // 设置按钮
    const settingsBtn = createButton('\u2699', 30, 30, {
      bg: 0x1a1a1a, border: 0x333333, textColor: COLORS.textDim, fontSize: 15,
    });
    settingsBtn.x = W - 40;
    settingsBtn.y = (BAR_H - 30) / 2;
    settingsBtn.on('pointertap', onSettingsClick);
    this.container.addChild(settingsBtn);
  }

  private buildStatBadge(
    x: number, icon: string, value: string, subValue: string | undefined,
    borderColor: number, textColor: number,
  ): number {
    const badge = new Container();
    badge.x = x;
    badge.y = (BAR_H - 22) / 2;

    const badgeW = subValue ? 72 : 56;
    const badgeBg = new Graphics();
    badgeBg.beginFill(0x0a0a0a, 1);
    badgeBg.drawRoundedRect(0, 0, badgeW, 22, 2);
    badgeBg.endFill();
    badgeBg.lineStyle(2, COLORS.panelBorder, 1);
    badgeBg.drawRoundedRect(0, 0, badgeW, 22, 2);
    badgeBg.lineStyle(0);
    badge.addChild(badgeBg);

    const iconT = createText(icon, { size: 10 });
    iconT.x = 5; iconT.y = 4;
    badge.addChild(iconT);

    const valT = createText(value, { size: 10, color: textColor, bold: true });
    valT.x = 22; valT.y = 5;
    badge.addChild(valT);

    if (subValue) {
      const subT = createText(subValue, { size: 8, color: borderColor });
      subT.x = badgeW - subT.width - 5; subT.y = 6;
      badge.addChild(subT);
    }

    this.container.addChild(badge);
    return x + badgeW + 6;
  }

  private addSeparator(x: number): number {
    const sep = new Graphics();
    sep.beginFill(COLORS.panelBorder, 1);
    sep.drawRect(x, (BAR_H - 16) / 2, 2, 16);
    sep.endFill();
    this.container.addChild(sep);
    return x + 8;
  }

  /** 更新魂晶 */
  updateSoulCrystals(count: number, mult: number): void {
    if (this.soulText) this.soulText.text = String(count);
    if (this.soulMultText) this.soulMultText.text = `${Math.round(mult * 100)}%`;
  }

  /** 更新金币 */
  updateGold(gold: number): void {
    if (this.goldText) this.goldText.text = String(gold);
  }

  /** 更新总伤害 */
  updateDamage(dmg: number): void {
    if (this.dmgText) this.dmgText.text = String(dmg);
  }

  /** 更新章节名 */
  updateChapter(name: string): void {
    if (this.chapterText) this.chapterText.text = name;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
