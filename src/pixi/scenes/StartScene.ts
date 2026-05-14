/**
 * StartScene - 瀵偓婵鏅棃?(PixiJS)
 * 缁墽鈥樻潻妯哄斧閸樼喓澧?React StartScreen
 * 閸樼喓澧楃拋鎹愵吀鐎硅棄瀹?448px -> Canvas 720px, S = 1.607
 *
 * 閸欐垵鍘滈弫鍫熺亯閺傝顢嶉敍姘缂佹ê顦跨仦鍌氭倱韫囧啫宕愰柅蹇旀 Graphics 閻?+ 缁帒鐡欓崗澶嬫閵?
 * 鐎瑰苯鍙忔稉宥勫▏閻?filter閿涘湙lowFilter / BlurFilter閿涘绱濋崓蹇曠閸ョ偓妗堟潻婊堟敿閸掆斂鈧?
 * - 闂堟瑦鈧礁绨抽崗澶涚窗婢舵艾婀€濞撴劕褰夐柅蹇旀濡烆厼娓?Graphics閿涘本膩閹风喐鐓嶉崪灞藉帨閺呮洖绨抽懝?
 * - 缁帒鐡欓崗澶嬫閿涙艾鐨弬鐟版健缁帒鐡欏▽鎸庛亶閸﹀棜寤洪柆鎾跺箚缂佹洟顥濋崝顭掔礉鐎靛棝娉﹂崣鐘插瑜般垺鍨氶崝銊︹偓浣稿帨閺?
 * - 閸涚厧鎯涢崝銊ф暰閿涙碍鏆ｆ担?alpha 闂?sin 濞夈垹濮╅敍灞灸侀幏鐔峰斧閻?CSS drop-shadow 閸涚厧鎯?
 */
import { Container, Text, TextStyle, Sprite } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, COLORS, FONT } from '../UIFactory';
import { getPixelSprite, getIcon } from '../AssetProvider';
import { playSfx } from '../SoundBridge';
import { TweenManager, Ease } from '../animation/Tween';
import { SoulShopModal } from '../ui/SoulShopModal';
import imgStartN from '../../assets/img_btn_start_normal.png';
import imgStartP from '../../assets/img_btn_start_pressed.png';
import imgShopN from '../../assets/img_btn_soulshop_normal.png';
import imgShopP from '../../assets/img_btn_soulshop_pressed.png';

/** 9:16 开始界面背景图（public/ui/ 下） */
const BG_IMAGE_URL = 'ui/img_bg_loading.png';

const W = 720;
// 720x1280 寮€鍙戝垎杈ㄧ巼涓嬬洿鎺ヤ娇鐢?px 鍊?
const s = (v: number) => v;


/** 閼冲本娅欏鍌涜癁缁帒鐡?*/
interface FloatParticle {
  g: Graphics;
  x: number; y: number;
  vy: number; vx: number;
  life: number; maxLife: number;
  size: number; opacity: number;
}

/** 閸忓妾跨划鎺戠摍閿涙碍閮ㄥ顓炴妇鏉炪劑浜鹃悳顖滅搏 */
interface GlowMote {
  g: Graphics;
  angle: number;
  speed: number;
  radiusX: number;
  radiusY: number;
  baseAlpha: number;
  size: number;
  /** 鐠烘繄顬囨稉顓炵妇閻ㄥ嫬鐪扮痪?0=閺堚偓閸? 1=娑? 2=閺堚偓婢?閿涘矁绉烘径鏍Ш濞?*/
  layer: number;
}

/** 缁帒鐡欓崗澶嬫缁崵绮?*/
interface ParticleAura {
  container: Container;
  staticGlow: Graphics;
  motes: GlowMote[];
}

export class StartScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private contentLayer: Container | null = null;
  private diceWrapper: Container | null = null;
  private diceBaseY = 0;
  private diceAura: ParticleAura | null = null;
  private glowGraphics: Graphics | null = null;
  private subtitleText: Text | null = null;
  private btnAura: ParticleAura | null = null;
  private particles: FloatParticle[] = [];
  private fading = false;
  private contentTotalH = 0;
  private soulShopModal: SoulShopModal | null = null;
  private bgSprite: Sprite | null = null;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.fading = false;
    this.time = 0;
    this.build();
  }

  onExit() {
    TweenManager.killTweensOf(this.container);
    this.container.removeChildren();
    this.particles = [];
    this.contentLayer = null;
    this.diceWrapper = null;
    this.diceAura = null;
    this.glowGraphics = null;
    this.subtitleText = null;
    this.btnAura = null;
    this.contentTotalH = 0;
    this.bgSprite = null;
    if (this.soulShopModal) {
      this.soulShopModal.destroy();
      this.soulShopModal = null;
    }
  }

  onGameStateChanged() {}

  onTick = (delta: number) => {
    const dt = delta * 0.016;
    this.time += dt;

    // 鐎圭偞妞傜仦鍛厬闁倿鍘ら敍姝瀍signH 闂呭繒鐛ラ崣锝呭綁閸栨牭绱漜ontent 鐟曚礁顫愮紒鍫濈€惄鏉戠湷娑?
    if (this.contentLayer && this.contentTotalH > 0) {
      const H = this.gameApp.designH;
      this.contentLayer.y = Math.max((H - this.contentTotalH) / 2, s(39));
    }

    // 妤犳澘鐡欏ù顔煎З
    if (this.diceWrapper) {
      this.diceWrapper.y = this.diceBaseY + Math.sin(this.time * 2.1) * s(13);
      this.diceWrapper.rotation = Math.sin(this.time * 0.8) * 0.07;
    }

    // 妤犳澘鐡欑划鎺戠摍閸忓妾块崨鐓庢儧
    if (this.diceAura) {
      const phase = (Math.sin(this.time * 2.51) + 1) / 2; // 0閳?
      // 闂堟瑦鈧礁绨抽崗澶婃嚑閸? alpha 0.25閳?.65
      this.diceAura.staticGlow.alpha = 0.25 + phase * 0.40;
      this.updateAuraMotes(this.diceAura, dt, phase);
    }

    // 娑擃厼绺鹃懘澶婂暱閸忓妾?
    if (this.glowGraphics) {
      this.glowGraphics.alpha = 0.03 + (Math.sin(this.time * 1.57) + 1) / 2 * 0.05;
    }

    // 閸擃垱鐖ｆ０妯烘嚑閸?
    if (this.subtitleText) {
      this.subtitleText.alpha = 0.6 + (Math.sin(this.time * 2.1) + 1) / 2 * 0.4;
    }

    // 閹稿鎸崇划鎺戠摍閸忓妾块崨鐓庢儧
    if (this.btnAura) {
      const btnPhase = (Math.sin(this.time * 3.14) + 1) / 2;
      this.btnAura.staticGlow.alpha = 0.12 + btnPhase * 0.23;
      this.updateAuraMotes(this.btnAura, dt, btnPhase);
    }

    // 閼冲本娅欏鍌涜癁缁帒鐡?
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) this.resetBgParticle(p);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.g.x = Math.floor(p.x);
      p.g.y = Math.floor(p.y);
      const progress = 1 - p.life / p.maxLife;
      if (progress < 0.1) p.g.alpha = (progress / 0.1) * p.opacity;
      else if (progress > 0.9) p.g.alpha = ((1 - progress) / 0.1) * p.opacity;
      else p.g.alpha = p.opacity;
    }
  };

  /** 閺囧瓨鏌婇崗澶嬫缁帒鐡欓敍姘儴濡烆厼娓炬潪銊╀壕鏉╂劕濮?+ 閸涚厧鎯?alpha */
  private updateAuraMotes(aura: ParticleAura, dt: number, breathPhase: number) {
    for (const m of aura.motes) {
      m.angle += m.speed * dt;
      m.g.x = Math.cos(m.angle) * m.radiusX;
      m.g.y = Math.sin(m.angle) * m.radiusY;
      // 鐏炲倻楠囩搾濠傤樆閸╄櫣顢卆lpha鐡掑﹣缍嗛敍灞芥嚑閸氬憡妞傞弫缈犵秼閸欐ü瀵?
      const layerMul = m.layer === 0 ? 1.0 : m.layer === 1 ? 0.75 : 0.45;
      m.g.alpha = m.baseAlpha * layerMul * (0.5 + breathPhase * 0.5);
    }
  }

  private resetBgParticle(p: FloatParticle) {
    const H = this.gameApp.designH;
    p.x = Math.random() * W;
    p.y = H * 0.3 + Math.random() * H * 0.6;
    const duration = 2 + Math.random() * 3;
    p.life = duration;
    p.maxLife = duration;
    p.vy = -s(161) / duration;
    p.vx = s(24) / duration;
  }

  private build() {
    const H = this.gameApp.designH;
    this.drawBackground(H);
    this.createBgParticles(H);
    this.buildContent(H);
    this.drawScanlines(H);
    const version = createText('v0.9', { size: s(11), color: COLORS.textDim });
    version.x = s(16);
    version.y = H - s(32);
    this.container.addChild(version);
    this.playEntrance();
  }

  private buildContent(H: number) {
    const content = new Container();
    this.contentLayer = content;
    const diceSize = s(90);
    const diceGap = s(58);    // 妤犳澘鐡欓崚鐗堢垼妫版娈戦梻纾嬬獩閿涘牊濯烘径褝绱?
    const titleH = s(64);
    const subH = s(22);
    const btnH = s(64);
    const shopBtnH = s(58);
    const tutH = s(22);
    this.contentTotalH = diceSize + diceGap + titleH + s(13) + subH + s(64)
      + btnH + s(45) + shopBtnH + s(32) + tutH;
    let curY = 0;
    this.createGoldDice(content, curY + diceSize / 2);
    curY += diceSize + diceGap;
    this.createTitle(content, curY + titleH / 2);
    curY += titleH + s(13);
    this.createSubtitle(content, curY);
    curY += subH + s(64);
    this.createStartButton(content, curY);
    curY += btnH + s(45);
    this.createShopButton(content, curY);
    curY += shopBtnH + s(32);
    this.createTutorialButton(content, curY);
    content.x = 0;
    content.y = Math.max((H - this.contentTotalH) / 2, s(39));
    this.container.addChild(content);
  }

  // ===== 缁帒鐡欓崗澶嬫缁崵绮?=====

  /**
   * 閸掓稑缂撶划鎺戠摍閸忓妾块敍姘纯缂佹洜娲伴弽鍥﹁厬韫囧啰娈戞径姘湴閸楀﹪鈧繑妲戠亸蹇旀煙閸?+ 闂堟瑦鈧焦绗庨崣妯虹俺閸忓鈧?
   * 鐎瑰苯鍙忔稉宥勫▏閻?filter閿涘瞼鏁?additive blending 閼割剛娈戦崡濠団偓蹇旀閸欑姴濮炵€圭偟骞囬弻鏂挎嫲閺佸牊鐏夐妴?
   *
   * @param halfW 閻╊喗鐖ｉ崡濠傤啍
   * @param halfH 閻╊喗鐖ｉ崡濠囩彯
   * @param color 閸忓妾挎０婊嗗
   * @param moteCount 缁帒鐡欓幀缁樻殶 (瀵ら缚顔?20~40)
   * @param layers 鐏炲倹鏆熼柊宥囩枂 [{radiusScale, count}]
   */
  private createParticleAura(
    halfW: number, halfH: number, color: number,
    layers: { radiusScale: number; count: number; sizeRange: [number, number] }[],
  ): ParticleAura {
    const auraContainer = new Container();

    // 1) 闂堟瑦鈧礁绨抽崗澶涚窗婢舵艾婀€閸氬苯绺惧〒鎰綁濡烆厼娓鹃敍灞炬￥ filter
    const staticGlow = new Graphics();
    const ringCount = 12;
    for (let i = ringCount; i >= 0; i--) {
      const ratio = i / ringCount;
      const rx = halfW * (1.0 + ratio * 1.8);
      const ry = halfH * (1.0 + ratio * 1.8);
      // 娴犲骸顦婚崚鏉垮敶閿涙艾顦婚崷鍫熺€ǎ鈽呯礉閸愬懎婀€閻ｃ儲绁?
      const a = 0.06 * (1 - ratio * 0.6);
      staticGlow.beginFill(color, a);
      staticGlow.drawEllipse(0, 0, rx, ry);
      staticGlow.endFill();
    }
    staticGlow.alpha = 0.45;
    auraContainer.addChild(staticGlow);

    // 2) 閸忓妾跨划鎺戠摍閿涙艾鍨庣仦鍌滃箚缂?
    const motes: GlowMote[] = [];
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      for (let i = 0; i < layer.count; i++) {
        const angle = (Math.PI * 2 / layer.count) * i + Math.random() * 0.5;
        const sizeMin = layer.sizeRange[0];
        const sizeMax = layer.sizeRange[1];
        const size = sizeMin + Math.random() * (sizeMax - sizeMin);

        const g = new Graphics();
        g.beginFill(color);
        g.drawRect(-size / 2, -size / 2, size, size);
        g.endFill();

        const rx = halfW * layer.radiusScale * (0.9 + Math.random() * 0.2);
        const ry = halfH * layer.radiusScale * (0.9 + Math.random() * 0.2);
        const speed = (0.3 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);

        g.x = Math.cos(angle) * rx;
        g.y = Math.sin(angle) * ry;
        g.alpha = 0;
        auraContainer.addChild(g);

        motes.push({
          g, angle, speed,
          radiusX: rx, radiusY: ry,
          baseAlpha: 0.35 + Math.random() * 0.40,
          size, layer: li,
        });
      }
    }

    return { container: auraContainer, staticGlow, motes };
  }

  // ===== 閼冲本娅?=====

  private drawBackground(H: number) {
    // 1) Fallback solid color (visible before image loads)
    const bg = new Graphics();
    bg.beginFill(0x0c0810);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);

    // 2) 9:16 background image - cover mode to fill design area
    const bgSprite = Sprite.from(BG_IMAGE_URL);
    bgSprite.anchor.set(0.5, 0.5);
    bgSprite.x = W / 2;
    bgSprite.y = H / 2;

    const applyCover = () => {
      const texW = bgSprite.texture.width;
      const texH = bgSprite.texture.height;
      if (texW === 0 || texH === 0) return;
      // cover: use the larger scale ratio to ensure full coverage
      const coverScale = Math.max(W / texW, H / texH);
      bgSprite.scale.set(coverScale, coverScale);
    };

    if (bgSprite.texture.valid) {
      applyCover();
    } else {
      bgSprite.texture.baseTexture.once('loaded', applyCover);
    }
    this.bgSprite = bgSprite;
    this.container.addChild(bgSprite);

    // 3) Lightweight vignette - only darken edges so BG image stays visible
    this.drawVignette(H);

    // 4) Subtle top fog (just enough for title readability)
    const topFog = new Graphics();
    for (let i = 0; i < 20; i++) {
      topFog.beginFill(0x060410, 0.18 * (1 - i / 20));
      topFog.drawRect(0, Math.floor(H * 0.2 * i / 20), W, Math.ceil(H * 0.2 / 20) + 1);
      topFog.endFill();
    }
    this.container.addChild(topFog);

    // 5) Subtle bottom fog
    const bottomFog = new Graphics();
    for (let i = 0; i < 20; i++) {
      bottomFog.beginFill(0x060410, 0.25 * (i / 20));
      bottomFog.drawRect(0, Math.floor(H * 0.8 + H * 0.2 * i / 20), W, Math.ceil(H * 0.2 / 20) + 1);
      bottomFog.endFill();
    }
    this.container.addChild(bottomFog);

    // 6) Center glow (reduced to not overpower BG)
    const glow = new Graphics();
    const glowR = s(289);
    for (let i = 20; i >= 0; i--) {
      const r = glowR * (i / 20);
      glow.beginFill(0xd4a030, 0.06 * (1 - i / 20));
      glow.drawEllipse(W / 2, H * 0.28, r * 1.2, r * 0.8);
      glow.endFill();
    }
    this.glowGraphics = glow;
    this.container.addChild(glow);
  }


  private drawVignette(H: number) {
    const vig = new Graphics();
    const cx = W / 2;
    const cy = H * 0.4;
    const maxR = Math.max(W, H) * 0.8;
    for (let i = 30; i >= 0; i--) {
      const ratio = i / 30;
      const r = maxR * ratio;
      // Only darken the outermost edges; keep center transparent
      let alpha: number;
      if (ratio > 0.7) alpha = 0.35 * ((ratio - 0.7) / 0.3);
      else alpha = 0;
      vig.beginFill(0x0c0810, alpha);
      vig.drawEllipse(cx, cy, r * 1.1, r * 0.9);
      vig.endFill();
    }
    this.container.addChild(vig);
  }

  // ===== 閼冲本娅欏鍌涜癁缁帒鐡?=====

  private createBgParticles(H: number) {
    for (let i = 0; i < 8; i++) {
      const size = s(3 + Math.random() * 3);
      const g = new Graphics();
      const color = this.hslToHex(42 + Math.random() * 20, 80, 50 + Math.random() * 20);
      g.beginFill(color);
      g.drawRect(0, 0, size, size);
      g.endFill();
      const duration = 2 + Math.random() * 3;
      const x = Math.random() * W;
      const y = H * 0.2 + Math.random() * H * 0.6;
      g.x = Math.floor(x);
      g.y = Math.floor(y);
      g.alpha = 0;
      this.container.addChild(g);
      this.particles.push({
        g, x, y,
        vy: -s(161) / duration, vx: s(24) / duration,
        life: Math.random() * duration, maxLife: duration,
        size, opacity: 0.5 + Math.random() * 0.3,
      });
    }
  }

  // ===== 闁叉垼澹婃鏉跨摍 =====

  private createGoldDice(parent: Container, centerY: number) {
    const wrapper = new Container();
    const B = '#6b5520', HL = '#f0d860', F = '#dcc040', D = '#a88a28', DOT = '#3a2a10';
    const dicePixels = [
      [B, HL, HL, HL, HL, HL, B],
      [HL, F, F, F, F, F, D],
      [HL, F, DOT, F, F, F, D],
      [HL, F, F, DOT, F, F, D],
      [HL, F, F, F, DOT, F, D],
      [HL, F, F, F, F, F, D],
      [B, D, D, D, D, D, B],
    ];
    const diceScale = s(13);
    const diceW = 7 * diceScale;
    const diceH = 7 * diceScale;

    // 1) 缁帒鐡欓崗澶嬫閿涘牊鏂侀崷銊╊€忕€涙劒绗呴弬鐧哥礉娑撳鐪伴悳顖滅搏閿?
    const aura = this.createParticleAura(
      diceW / 2, diceH / 2, 0xd4a030,
      [
        { radiusScale: 1.1, count: 8,  sizeRange: [s(5), s(10)] },   // 閸愬懎鐪伴敍姘辨彛鐠愭挳顎忕€?
        { radiusScale: 1.8, count: 9,  sizeRange: [s(6), s(11)] },   // 娑擃厼鐪?
        { radiusScale: 2.8, count: 6,  sizeRange: [s(5), s(8)] },   // 婢舵牕鐪伴敍姘崇箼鐠烘繄顬囧ǎ鈥冲帨
      ],
    );
    wrapper.addChild(aura.container);
    this.diceAura = aura;

    // 2) 閸嶅繒绀屾鏉跨摍閿涘牊妫?filter閿涘奔绻氶幐渚€鏀奸崚鈺嬬礆
    const dice = getPixelSprite(dicePixels, diceScale, 'gold_dice_start');
    dice.x = -diceW / 2;
    dice.y = -diceH / 2;
    wrapper.addChild(dice);

    wrapper.x = W / 2;
    wrapper.y = centerY;
    this.diceBaseY = centerY;
    this.diceWrapper = wrapper;
    parent.addChild(wrapper);
  }

  // ===== 閺嶅洭顣?=====

  private createTitle(parent: Container, centerY: number) {
    const baseStyle = {
      fontFamily: FONT.pixel,
      fontSize: s(58),
      fontWeight: 'bold' as const,
      letterSpacing: s(8),
      padding: s(13),
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: s(6),
      dropShadowAngle: Math.PI / 4,
      dropShadowBlur: 0,
      dropShadowAlpha: 0.9,
    };
    const titleLeft = new Text('\u516d\u9762', new TextStyle({ ...baseStyle, fill: COLORS.textBright }));
    titleLeft.anchor.set(1, 0.5);
    titleLeft.x = W / 2 + s(5);
    titleLeft.y = centerY;
    parent.addChild(titleLeft);
    const titleRight = new Text('\u6218\u5f79', new TextStyle({ ...baseStyle, fill: COLORS.green }));
    titleRight.anchor.set(0, 0.5);
    titleRight.x = W / 2 + s(5);
    titleRight.y = centerY;
    parent.addChild(titleRight);
  }

  private createSubtitle(parent: Container, topY: number) {
    const subtitle = new Text('\u25c6  SIX-SIDED BATTLE  \u25c6', new TextStyle({
      fontFamily: FONT.pixel, fontSize: s(16), fill: COLORS.gold,
      letterSpacing: s(3), padding: s(6),
      dropShadow: true, dropShadowColor: 0x000000,
      dropShadowDistance: s(3), dropShadowAngle: Math.PI / 4,
      dropShadowBlur: 0, dropShadowAlpha: 0.8,
    }));
    subtitle.anchor.set(0.5, 0);
    subtitle.x = W / 2;
    subtitle.y = topY;
    this.subtitleText = subtitle;
    parent.addChild(subtitle);
  }

  // ===== 閹稿鎸?=====

  /** 閺嬪嫬缂撻崶鍓у閹稿鎸抽敍姘⒈瀵姷瀚粩瀣禈閻楀洤浠汵ormal/Pressed閸掑洦宕?*/
  private buildImageButton(
    parent: Container, topY: number,
    normalUrl: string, pressedUrl: string,
    label: string, btnW: number,
    iconName: string, iconSize: number,
    textColor: number, fontSize: number,
    onTap: () => void,
    /** 閺傚洤鐡ч崹鍌滄纯娴ｅ秶鐤嗙化缁樻殶 0~1, 姒涙顓?.45 */
    contentY = 0.45,
    /** 閺勵垰鎯侀崝鐘电煈鐎涙劕鍘滈弲?*/
    withAura = false,
  ) {
    const wrapper = new Container();
    wrapper.eventMode = 'static';
    wrapper.cursor = 'pointer';

    const normalBg = Sprite.from(normalUrl);
    const pressedBg = Sprite.from(pressedUrl);

    // 缁涘娴橀悧鍥у鏉炶棄鐣崘宥呯鐏炩偓
    const tryLayout = () => {
      if (!normalBg.texture.valid || !pressedBg.texture.valid) return;

      // 缁涘鐦紓鈺傛杹閸掓壆娲伴弽鍥ь啍鎼?
      const scale = btnW / normalBg.texture.width;
      normalBg.scale.set(scale, scale);
      pressedBg.scale.set(scale, scale);
      pressedBg.visible = false;
      wrapper.addChild(normalBg);
      wrapper.addChild(pressedBg);

      const btnH = normalBg.height;

      // 閸ョ偓鐖?+ 閺傚洤鐡?
      const icon = getIcon(iconName, iconSize);
      const text = createText(label, {
        size: fontSize, color: textColor, bold: true,
        shadow: true, shadowDistance: 3, shadowAlpha: 0.9,
      });
      const gap = s(10);
      const totalW = icon.width + gap + text.width;
      const startX = (btnW - totalW) / 2;
      const cy = btnH * contentY;

      icon.anchor?.set(0, 0.5);
      icon.x = startX;
      icon.y = cy;
      text.anchor.set(0, 0.5);
      text.x = startX + icon.width + gap;
      text.y = cy;

      const contentLayer = new Container();
      contentLayer.addChild(icon);
      contentLayer.addChild(text);
      wrapper.addChild(contentLayer);

      // 閹稿绗呴敍姘瀼閹广垼鍎楅弲?+ 閺傚洤鐡ч崶鐐垼鐠虹喖娈㈡稉瀣?
      const pressOff = 3;
      wrapper.on('pointerdown', () => {
        normalBg.visible = false;
        pressedBg.visible = true;
        contentLayer.y = pressOff;
      });
      wrapper.on('pointerup', () => {
        normalBg.visible = true;
        pressedBg.visible = false;
        contentLayer.y = 0;
      });
      wrapper.on('pointerupoutside', () => {
        normalBg.visible = true;
        pressedBg.visible = false;
        contentLayer.y = 0;
      });
      wrapper.on('pointertap', onTap);

      // 閸忓妾?
      if (withAura) {
        const aura = this.createParticleAura(
          btnW / 2, btnH / 2, 0x3cc864,
          [
            { radiusScale: 1.2, count: 8, sizeRange: [s(5), s(8)] },
            { radiusScale: 2.0, count: 6, sizeRange: [s(3), s(6)] },
          ],
        );
        aura.container.x = btnW / 2;
        aura.container.y = btnH / 2;
        wrapper.addChildAt(aura.container, 0);
        this.btnAura = aura;
      }
    };

    // 绾喕绻氱痪鍦倞閸旂姾娴囩€瑰本鍨?
    if (normalBg.texture.valid && pressedBg.texture.valid) {
      tryLayout();
    } else {
      let loaded = 0;
      const onLoaded = () => { if (++loaded >= 2) tryLayout(); };
      if (normalBg.texture.valid) loaded++; else normalBg.texture.baseTexture.once('loaded', onLoaded);
      if (pressedBg.texture.valid) loaded++; else pressedBg.texture.baseTexture.once('loaded', onLoaded);
      if (loaded >= 2) tryLayout();
    }

    wrapper.x = (W - btnW) / 2;
    wrapper.y = topY;
    parent.addChild(wrapper);
  }

  private createStartButton(parent: Container, topY: number) {
    this.buildImageButton(
      parent, topY,
      imgStartN, imgStartP,
      '\u5f00\u542f\u5f81\u7a0b', s(321),
      'sword', s(32),
      0xf0ffe0, s(24),
      () => this.handleStart(),
      0.45, true,
    );
  }

  private createShopButton(parent: Container, topY: number) {
    this.buildImageButton(
      parent, topY,
      imgShopN, imgShopP,
      '\u9b42\u6676\u5546\u5e97', s(321),
      'soul_crystal', s(29),
      0xe0c0ff, s(22),
      () => this.openSoulShop(),
    );
  }

  private createTutorialButton(parent: Container, topY: number) {
    const tutorialBtn = new Container();
    tutorialBtn.eventMode = 'static';
    tutorialBtn.cursor = 'pointer';
    const bookSmall = getIcon('book', s(22));
    tutorialBtn.addChild(bookSmall);
    const tutText = createText('\u67e5\u770b\u6559\u7a0b', { size: s(14), color: COLORS.textDim });
    tutText.x = bookSmall.width + s(6);
    tutText.y = (bookSmall.height - tutText.height) / 2;
    tutorialBtn.addChild(tutText);
    const totalW = bookSmall.width + s(6) + tutText.width;
    tutorialBtn.x = (W - totalW) / 2;
    tutorialBtn.y = topY;
    tutorialBtn.on('pointerover', () => { tutText.style.fill = COLORS.green; });
    tutorialBtn.on('pointerout', () => { tutText.style.fill = COLORS.textDim; });
    parent.addChild(tutorialBtn);
  }

  // ===== 鐟曞棛娲婄仦?=====

  private drawScanlines(H: number) {
    const scanlines = new Graphics();
    for (let y = 0; y < H; y += 4) {
      scanlines.beginFill(0x000000, 0.08);
      scanlines.drawRect(0, y + 2, W, 2);
      scanlines.endFill();
    }
    this.container.addChild(scanlines);
  }

  // ===== 閸忋儱婧€閸斻劎鏁?=====

  private playEntrance() {
    if (!this.contentLayer) return;
    for (let i = 0; i < this.contentLayer.children.length; i++) {
      const child = this.contentLayer.children[i] as Container;
      if (!child) continue;
      const origY = child.y;
      const origAlpha = child.alpha;
      child.y = origY + s(32);
      child.alpha = 0;
      TweenManager.to(child, { y: origY, alpha: origAlpha }, {
        duration: 0.8, ease: Ease.easeOut, delay: 0.1 + i * 0.06,
      });
    }
  }

  // ===== 娴溿倓绨?=====

  private openSoulShop() {
    if (this.soulShopModal) {
      this.soulShopModal.open();
      return;
    }
    const modal = new SoulShopModal(this.gameApp);
    this.soulShopModal = modal;
    this.container.addChild(modal.container);
    modal.open();
  }

  private handleStart() {
    if (this.fading) return;
    this.fading = true;
    playSfx('gate_close');
    const H = this.gameApp.designH;
    const mask = new Graphics();
    mask.beginFill(0x000000);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    mask.alpha = 0;
    this.container.addChild(mask);
    TweenManager.to(mask as any, { alpha: 1 }, {
      duration: 1.2, ease: Ease.easeIn,
      onComplete: () => { this.gameApp.switchPhase('classSelect'); },
    });
  }

  // ===== 瀹搞儱鍙?=====

  private hslToHex(h: number, sat: number, l: number): number {
    const sn = sat / 100;
    const ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = ln - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255);
  }
}
