import React from 'react';
import {
  W_bloodthirst, W_warcry, W_ironwall, W_fury,
  W_armorbreak, W_revenge, W_roar,
  W_lifefurnace, W_execute, W_leech, W_titanfist,
  W_unyielding, W_warhammer, W_bloodblade,
  W_giantshield, W_berserk, W_bloodgod,
  W_overlord, W_whirlwind, W_splinter,
} from './dicePatternWarrior';
import {
  M_elemental, M_reverse, M_missile,
  M_barrier, M_meditate, M_amplify,
  M_mirror, M_crystal, M_temporal,
  M_prism, M_resonance, M_devour,
  M_purify, M_surge, M_elemstorm,
  M_burnecho,
  M_star,
  M_meteor, M_frostecho,
  M_elemheart,
} from './dicePatternMage';
import {
  R_envenom, R_throwing,
  R_pursuit, R_sleeve,
  R_quickdraw, R_combomastery, R_toxblade, R_shadow_clone, R_boomerang, R_corrosion,
  R_chain_strike, R_shadowstrike, R_venomfang,
  R_tripleflash, R_shadowdance,
  R_plaguedet, R_phantom, R_purifyblade,
  R_deathtouch, R_bladestorm,
} from './dicePatternRogue';

const S = 'crispEdges'; // shapeRendering

export const PATTERN_MAP: Record<string, React.FC> = {
  // 嗜血狂战 (21)
  w_bloodthirst: W_bloodthirst, w_ironwall: W_ironwall, w_warcry: W_warcry, w_fury: W_fury,
  w_armorbreak: W_armorbreak, w_revenge: W_revenge, w_roar: W_roar,
  w_lifefurnace: W_lifefurnace, w_execute: W_execute, w_leech: W_leech, w_titanfist: W_titanfist,
  w_unyielding: W_unyielding, w_warhammer: W_warhammer, w_bloodblade: W_bloodblade,
  w_giantshield: W_giantshield, w_berserk: W_berserk, w_bloodgod: W_bloodgod,
  w_overlord: W_overlord,
  // 新增战士
  w_whirlwind: W_whirlwind, w_cleave: W_splinter, // cleave业务ID → splinter图案函数（复用破甲劈斩视觉）

  // 星界魔导 (20)
  mage_elemental: M_elemental, mage_reverse: M_reverse, mage_missile: M_missile,
  mage_barrier: M_barrier, mage_meditate: M_meditate, mage_amplify: M_amplify,
  mage_mirror: M_mirror, mage_crystal: M_crystal, mage_temporal: M_temporal,
  mage_prism: M_prism, mage_resonance: M_resonance, mage_devour: M_devour,
  mage_purify: M_purify, mage_surge: M_surge, mage_elemstorm: M_elemstorm,
  mage_burnecho: M_burnecho,
  mage_star: M_star, mage_frostecho: M_frostecho, mage_meteor: M_meteor,
  mage_elemheart: M_elemheart,

  // 影锋刺客 (20)
  r_envenom: R_envenom, r_throwing: R_throwing,
  r_pursuit: R_pursuit, r_sleeve: R_sleeve,
  r_quickdraw: R_quickdraw, r_combomastery: R_combomastery, r_toxblade: R_toxblade, r_shadow_clone: R_shadow_clone, r_boomerang: R_boomerang, r_corrosion: R_corrosion,
  r_chain_strike: R_chain_strike, r_shadowstrike: R_shadowstrike, r_venomfang: R_venomfang,
  r_tripleflash: R_tripleflash, r_shadowdance: R_shadowdance,
  r_plaguedet: R_plaguedet, r_phantom: R_phantom, r_purifyblade: R_purifyblade,
  r_deathtouch: R_deathtouch, r_bladestorm: R_bladestorm,


  // === v0.5 新增骰子 (内联图案) ===
  w_bloodchain: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="4" y="4" width="2" height="16" fill="#c03048"/><rect x="18" y="4" width="2" height="16" fill="#c03048"/>
      <rect x="6" y="9" width="12" height="2" fill="#ff5070"/><rect x="6" y="13" width="12" height="2" fill="#ff5070"/>
      <rect x="11" y="6" width="2" height="12" fill="#ff8090"/>
    </svg>
  ),
  w_quake: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="2" y="16" width="20" height="2" fill="#b09038"/><rect x="4" y="14" width="16" height="2" fill="#d0b050"/>
      <rect x="6" y="12" width="12" height="2" fill="#e8d070"/><rect x="11" y="6" width="2" height="6" fill="#f0e080"/>
      <rect x="9" y="8" width="2" height="2" fill="#c0a040" opacity=".6"/><rect x="13" y="8" width="2" height="2" fill="#c0a040" opacity=".6"/>
    </svg>
  ),
  mage_counter: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="6" y="4" width="12" height="2" fill="#6068d8"/><rect x="4" y="6" width="2" height="12" fill="#5058c0"/>
      <rect x="18" y="6" width="2" height="12" fill="#5058c0"/><rect x="6" y="18" width="12" height="2" fill="#6068d8"/>
      <rect x="11" y="10" width="2" height="4" fill="#c0c8ff"/><rect x="9" y="11" width="6" height="2" fill="#8088e0" opacity=".6"/>
    </svg>
  ),
  mage_gale: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="2" y="7" width="6" height="2" fill="#48d0a8"/><rect x="8" y="10" width="8" height="2" fill="#38b888"/>
      <rect x="14" y="13" width="8" height="2" fill="#48d0a8"/><rect x="4" y="16" width="6" height="2" fill="#28a078" opacity=".6"/>
      <rect x="11" y="4" width="2" height="4" fill="#90ffe0"/>
    </svg>
  ),
  mage_polymorph: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="8" y="4" width="8" height="2" fill="#9888c0"/><rect x="6" y="6" width="12" height="10" fill="#e0d8f8"/>
      <rect x="8" y="9" width="2" height="2" fill="#504070"/><rect x="14" y="9" width="2" height="2" fill="#504070"/>
      <rect x="8" y="14" width="8" height="2" fill="#c8c0e0"/><rect x="6" y="16" width="2" height="2" fill="#9888c0"/>
      <rect x="16" y="16" width="2" height="2" fill="#9888c0"/>
    </svg>
  ),

  // 临时骰子
  temp_rogue: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="6" y="6" width="12" height="12" fill="#205030" opacity=".5"/>
      <rect x="8" y="8" width="8" height="8" fill="#308040" opacity=".4"/>
      <rect x="10" y="10" width="4" height="4" fill="#50c060" opacity=".3"/>
      <rect x="6" y="6" width="2" height="2" fill="#40a050"/><rect x="16" y="6" width="2" height="2" fill="#40a050"/>
      <rect x="6" y="16" width="2" height="2" fill="#40a050"/><rect x="16" y="16" width="2" height="2" fill="#40a050"/>
    </svg>
  ),
};
