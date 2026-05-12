/**
 * PixelDice — 将原版 PixelDiceRenderer SVG 翻译为 PixiJS Graphics
 * 每个骰子 = 26×30 像素块网格 → 按 scale 放大到目标尺寸
 */
import { Container, RenderTexture, Sprite } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { Application } from 'pixi.js';

interface DiceColorScheme {
  border: string; outer: string; inner: string;
  highlight: string; shadow: string; digit: string; digitShadow: string;
}

// 像素字模 (3×5)
const PIXEL_DIGITS: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '?': [[1,1,1],[0,0,1],[0,1,0],[0,0,0],[0,1,0]],
};

// 配色表（完整版，从 PixelDiceRenderer.tsx 直接搬运）
const DICE_COLORS: Record<string, DiceColorScheme> = {
  // === 通用 ===
  standard:  { border: '#687078', outer: '#889098', inner: '#a0a8b0', highlight: '#d0d8e0', shadow: '#484850', digit: '#1a1e25', digitShadow: '#b0b8c0' },
  blade:     { border: '#606068', outer: '#787880', inner: '#909098', highlight: '#c0c0c8', shadow: '#404048', digit: '#f0f0f8', digitShadow: '#505058' },
  amplify:   { border: '#382058', outer: '#503080', inner: '#6840a0', highlight: '#a070e0', shadow: '#201038', digit: '#d8b8ff', digitShadow: '#302050' },
  split:     { border: '#104838', outer: '#186858', inner: '#209870', highlight: '#50d8a0', shadow: '#083020', digit: '#a0ffd0', digitShadow: '#104838' },
  magnet:    { border: '#401828', outer: '#603040', inner: '#804858', highlight: '#c07888', shadow: '#280810', digit: '#ffc0d0', digitShadow: '#401828' },
  joker:     { border: '#402048', outer: '#604070', inner: '#885898', highlight: '#c088d0', shadow: '#281030', digit: '#f0d0ff', digitShadow: '#402048' },
  chaos:     { border: '#481810', outer: '#703020', inner: '#a04830', highlight: '#e07040', shadow: '#300808', digit: '#ffd040', digitShadow: '#481810' },
  cursed:    { border: '#281030', outer: '#402050', inner: '#583070', highlight: '#8858a0', shadow: '#180818', digit: '#c088e0', digitShadow: '#281030' },
  cracked:   { border: '#303030', outer: '#404040', inner: '#505050', highlight: '#787878', shadow: '#202020', digit: '#a8a8a8', digitShadow: '#303030' },
  elemental: { border: '#282848', outer: '#383868', inner: '#484888', highlight: '#7070c0', shadow: '#181830', digit: '#c0c0ff', digitShadow: '#282848' },
  heavy:     { border: '#505058', outer: '#686870', inner: '#808088', highlight: '#a8a8b0', shadow: '#383840', digit: '#e0e0e8', digitShadow: '#484850' },
  // === 战士 ===
  w_bloodthirst: { border: '#581010', outer: '#802020', inner: '#a83030', highlight: '#e05040', shadow: '#380808', digit: '#ffc0b0', digitShadow: '#501010' },
  w_ironwall:    { border: '#584018', outer: '#806020', inner: '#a88030', highlight: '#d0a848', shadow: '#382808', digit: '#ffe8c0', digitShadow: '#504018' },
  w_warcry:      { border: '#584810', outer: '#806818', inner: '#b09028', highlight: '#e0c040', shadow: '#383008', digit: '#fff8a0', digitShadow: '#504010' },
  w_fury:        { border: '#582008', outer: '#804010', inner: '#b06020', highlight: '#e88830', shadow: '#381008', digit: '#ffe0a0', digitShadow: '#502008' },
  w_charge:      { border: '#584008', outer: '#806010', inner: '#a88020', highlight: '#d8b030', shadow: '#382808', digit: '#fff0b0', digitShadow: '#503808' },
  w_armorbreak:  { border: '#582810', outer: '#804018', inner: '#a85828', highlight: '#d88038', shadow: '#381808', digit: '#ffc890', digitShadow: '#502010' },
  w_revenge:     { border: '#581818', outer: '#803028', inner: '#a84838', highlight: '#d06850', shadow: '#380808', digit: '#ffb0a0', digitShadow: '#501010' },
  w_roar:        { border: '#585010', outer: '#807018', inner: '#a89828', highlight: '#d0c040', shadow: '#383808', digit: '#fff0a0', digitShadow: '#504810' },
  w_lifefurnace: { border: '#580810', outer: '#801820', inner: '#a82830', highlight: '#e04848', shadow: '#380408', digit: '#ffa8a0', digitShadow: '#500810' },
  w_bloodpact:   { border: '#480808', outer: '#681010', inner: '#901818', highlight: '#c02828', shadow: '#300404', digit: '#ff8080', digitShadow: '#480808' },
  w_execute:     { border: '#504010', outer: '#786018', inner: '#a08028', highlight: '#c8a838', shadow: '#382808', digit: '#ffe8a0', digitShadow: '#483810' },
  w_quake:       { border: '#483810', outer: '#685018', inner: '#887028', highlight: '#b09038', shadow: '#302808', digit: '#e8d090', digitShadow: '#403010' },
  w_leech:       { border: '#501010', outer: '#702020', inner: '#983030', highlight: '#c84848', shadow: '#300808', digit: '#ffb0b0', digitShadow: '#481010' },
  w_titanfist:   { border: '#480408', outer: '#680810', inner: '#901018', highlight: '#c82028', shadow: '#280204', digit: '#ff9090', digitShadow: '#400408' },
  w_unyielding:  { border: '#504818', outer: '#706828', inner: '#988838', highlight: '#c0b050', shadow: '#383010', digit: '#f0e0a0', digitShadow: '#484018' },
  w_warhammer:   { border: '#583008', outer: '#805010', inner: '#a87020', highlight: '#d89830', shadow: '#382008', digit: '#ffe8a0', digitShadow: '#502808' },
  w_bloodblade:  { border: '#502018', outer: '#703828', inner: '#985038', highlight: '#c07050', shadow: '#381010', digit: '#f0c0a0', digitShadow: '#481818' },
  w_giantshield: { border: '#484018', outer: '#686028', inner: '#908038', highlight: '#b8a850', shadow: '#302810', digit: '#e8d8a0', digitShadow: '#403818' },
  w_berserk:     { border: '#580808', outer: '#801010', inner: '#b02020', highlight: '#e83830', shadow: '#380404', digit: '#ff8878', digitShadow: '#500808' },
  w_bloodgod:    { border: '#400408', outer: '#600810', inner: '#801018', highlight: '#b02028', shadow: '#280204', digit: '#ff7868', digitShadow: '#380408' },
  w_overlord:    { border: '#504010', outer: '#706018', inner: '#988028', highlight: '#c0a840', shadow: '#382810', digit: '#f0e0b0', digitShadow: '#483810' },
  w_whirlwind:   { border: '#582800', outer: '#804010', inner: '#b06818', highlight: '#e0a030', shadow: '#381800', digit: '#fff0a8', digitShadow: '#502000' },
  w_cleave:      { border: '#5a1010', outer: '#882020', inner: '#b83030', highlight: '#e05050', shadow: '#380808', digit: '#ffe8e8', digitShadow: '#501818' },
  // === 法师 ===
  mage_elemental:{ border: '#202848', outer: '#304068', inner: '#405888', highlight: '#6080c0', shadow: '#101830', digit: '#c0d8ff', digitShadow: '#202040' },
  mage_reverse:  { border: '#301848', outer: '#483070', inner: '#604898', highlight: '#8868c0', shadow: '#200830', digit: '#d8c0ff', digitShadow: '#281040' },
  mage_missile:  { border: '#102048', outer: '#203870', inner: '#305098', highlight: '#4878d0', shadow: '#081030', digit: '#a0c8ff', digitShadow: '#101838' },
  mage_barrier:  { border: '#103848', outer: '#185868', inner: '#287888', highlight: '#48a8c0', shadow: '#082830', digit: '#90e0ff', digitShadow: '#102830' },
  mage_meditate: { border: '#282048', outer: '#403868', inner: '#585088', highlight: '#7870b0', shadow: '#181030', digit: '#d0c0f0', digitShadow: '#201838' },
  mage_amplify:  { border: '#281048', outer: '#402070', inner: '#583098', highlight: '#7850d0', shadow: '#180828', digit: '#c8a8ff', digitShadow: '#200838' },
  mage_mirror:   { border: '#103048', outer: '#184868', inner: '#286088', highlight: '#4890c0', shadow: '#082030', digit: '#a0d8ff', digitShadow: '#102838' },
  mage_crystal:  { border: '#082848', outer: '#104068', inner: '#186090', highlight: '#3898d0', shadow: '#041828', digit: '#80d0ff', digitShadow: '#082038' },
  mage_temporal: { border: '#201848', outer: '#303068', inner: '#404888', highlight: '#6068b0', shadow: '#100830', digit: '#c0c8f0', digitShadow: '#181040' },
  mage_prism:    { border: '#301050', outer: '#482078', inner: '#6838a0', highlight: '#9058d0', shadow: '#200830', digit: '#d8b0ff', digitShadow: '#280840' },
  mage_resonance:{ border: '#282850', outer: '#404070', inner: '#585898', highlight: '#8080d0', shadow: '#181838', digit: '#d0d0ff', digitShadow: '#202040' },
  mage_devour:   { border: '#180830', outer: '#281050', inner: '#381870', highlight: '#5030a8', shadow: '#100418', digit: '#a870f0', digitShadow: '#180828' },
  mage_purify:   { border: '#103848', outer: '#185870', inner: '#287898', highlight: '#40a8d0', shadow: '#082830', digit: '#90e8ff', digitShadow: '#103040' },
  mage_surge:    { border: '#200848', outer: '#381070', inner: '#502098', highlight: '#7038d0', shadow: '#100428', digit: '#c0a0ff', digitShadow: '#180838' },
  mage_elemstorm:{ border: '#182048', outer: '#283870', inner: '#385098', highlight: '#5070c8', shadow: '#101030', digit: '#b0c8ff', digitShadow: '#182040' },
  mage_burnecho: { border: '#180838', outer: '#301058', inner: '#481880', highlight: '#6838c0', shadow: '#100420', digit: '#b880ff', digitShadow: '#180830' },
  mage_weave:    { border: '#282850', outer: '#404070', inner: '#585890', highlight: '#8080c0', shadow: '#181838', digit: '#d0d0f8', digitShadow: '#202040' },
  mage_permafrost:{ border: '#084048', outer: '#106068', inner: '#188088', highlight: '#30b8d0', shadow: '#043030', digit: '#80e8ff', digitShadow: '#083838' },
  mage_star:     { border: '#181848', outer: '#283068', inner: '#384890', highlight: '#5868c8', shadow: '#101030', digit: '#c0d0ff', digitShadow: '#181840' },
  mage_frostecho:{ border: '#103048', outer: '#184870', inner: '#286898', highlight: '#4098d0', shadow: '#082030', digit: '#a0d8ff', digitShadow: '#103040' },
  mage_meteor:   { border: '#281040', outer: '#402060', inner: '#603080', highlight: '#8848b8', shadow: '#180828', digit: '#d8a8f0', digitShadow: '#201030' },
  mage_elemheart:{ border: '#202850', outer: '#304870', inner: '#406890', highlight: '#6898d0', shadow: '#101838', digit: '#d0e8ff', digitShadow: '#182040' },
  // === 盗贼 ===
  r_dagger:       { border: '#183818', outer: '#285828', inner: '#388838', highlight: '#58c058', shadow: '#102810', digit: '#c0ffc0', digitShadow: '#183018' },
  r_envenom:      { border: '#084818', outer: '#106828', inner: '#189838', highlight: '#30d050', shadow: '#043010', digit: '#80ffa0', digitShadow: '#084018' },
  r_throwing:     { border: '#183838', outer: '#285858', inner: '#388878', highlight: '#58c0b0', shadow: '#102828', digit: '#a0fff0', digitShadow: '#183030' },
  r_pursuit:      { border: '#104038', outer: '#186058', inner: '#288878', highlight: '#48c8b0', shadow: '#083028', digit: '#90fff0', digitShadow: '#103830' },
  r_poison_vial:  { border: '#284010', outer: '#406018', inner: '#588820', highlight: '#80c030', shadow: '#182808', digit: '#c0ff60', digitShadow: '#283810' },
  r_sleeve:       { border: '#184018', outer: '#286028', inner: '#389038', highlight: '#58c858', shadow: '#103010', digit: '#a0ffb0', digitShadow: '#183818' },
  r_quickdraw:    { border: '#104038', outer: '#186058', inner: '#289078', highlight: '#48c8a8', shadow: '#083028', digit: '#90fff0', digitShadow: '#103838' },
  r_combomastery: { border: '#304010', outer: '#486018', inner: '#688828', highlight: '#90c038', shadow: '#202808', digit: '#d0ff70', digitShadow: '#283810' },
  r_lethal:       { border: '#284018', outer: '#406028', inner: '#589038', highlight: '#80c858', shadow: '#183010', digit: '#c8ffa0', digitShadow: '#283818' },
  r_toxblade:     { border: '#104810', outer: '#186818', inner: '#209828', highlight: '#38d038', shadow: '#083008', digit: '#80ff80', digitShadow: '#104010' },
  r_shadow_clone: { border: '#204020', outer: '#306830', inner: '#409848', highlight: '#60d068', shadow: '#102810', digit: '#b0ffc0', digitShadow: '#203020' },
  r_miasma:       { border: '#304010', outer: '#486020', inner: '#688830', highlight: '#98c048', shadow: '#202808', digit: '#d8ff80', digitShadow: '#283810' },
  r_boomerang:    { border: '#184020', outer: '#286030', inner: '#389040', highlight: '#58c060', shadow: '#103018', digit: '#a0f8b0', digitShadow: '#183820' },
  r_corrosion:    { border: '#284810', outer: '#406818', inner: '#589828', highlight: '#80d038', shadow: '#183008', digit: '#c0ff68', digitShadow: '#284010' },
  r_chain_strike: { border: '#104840', outer: '#187060', inner: '#28a080', highlight: '#48e0b0', shadow: '#083028', digit: '#90fff0', digitShadow: '#103830' },
  r_shadowstrike: { border: '#183020', outer: '#284830', inner: '#387040', highlight: '#58a060', shadow: '#082010', digit: '#d0ffd0', digitShadow: '#204020' },
  r_shadow:       { border: '#183818', outer: '#285838', inner: '#388850', highlight: '#58c070', shadow: '#102810', digit: '#a0f8b0', digitShadow: '#183018' },
  r_steal:        { border: '#384810', outer: '#506818', inner: '#709828', highlight: '#98d038', shadow: '#283008', digit: '#d8ff70', digitShadow: '#384010' },
  r_venomfang:    { border: '#085010', outer: '#107018', inner: '#18a028', highlight: '#30e040', shadow: '#043808', digit: '#70ff90', digitShadow: '#084810' },
  r_tripleflash:  { border: '#204010', outer: '#306018', inner: '#409028', highlight: '#68c838', shadow: '#182808', digit: '#b0ff80', digitShadow: '#203810' },
  r_shadowdance:  { border: '#103828', outer: '#185840', inner: '#288858', highlight: '#48c080', shadow: '#082818', digit: '#90ffc8', digitShadow: '#103020' },
  r_plaguedet:    { border: '#284010', outer: '#406820', inner: '#589830', highlight: '#80d048', shadow: '#182808', digit: '#c8ff78', digitShadow: '#283810' },
  r_phantom:      { border: '#183830', outer: '#285848', inner: '#388868', highlight: '#58c098', shadow: '#102820', digit: '#a0ffd8', digitShadow: '#183028' },
  r_purifyblade:  { border: '#184818', outer: '#286828', inner: '#389838', highlight: '#58d058', shadow: '#103010', digit: '#a0ffb0', digitShadow: '#184018' },
  r_deathtouch:   { border: '#183818', outer: '#285838', inner: '#388850', highlight: '#58b868', shadow: '#102810', digit: '#a0f0b8', digitShadow: '#183018' },
  r_bladestorm:   { border: '#085018', outer: '#107028', inner: '#18a038', highlight: '#30e050', shadow: '#043808', digit: '#80ffa0', digitShadow: '#084818' },
  temp_rogue:     { border: '#103818', outer: '#185028', inner: '#287038', highlight: '#48a058', shadow: '#082810', digit: '#80d890', digitShadow: '#103018' },
  // === 元素坍缩配色 ===
  fire:    { border: '#682010', outer: '#984020', inner: '#c06030', highlight: '#ff9050', shadow: '#481008', digit: '#fff0c0', digitShadow: '#601810' },
  ice:     { border: '#103050', outer: '#184870', inner: '#286898', highlight: '#60b8e0', shadow: '#082040', digit: '#d0f0ff', digitShadow: '#102840' },
  thunder: { border: '#484010', outer: '#686018', inner: '#988828', highlight: '#e0d040', shadow: '#303008', digit: '#fffff0', digitShadow: '#484010' },
  poison:  { border: '#183818', outer: '#285828', inner: '#389838', highlight: '#60e060', shadow: '#102810', digit: '#c0ffc0', digitShadow: '#183018' },
  holy:    { border: '#484030', outer: '#686050', inner: '#989078', highlight: '#e0d8b8', shadow: '#303020', digit: '#fffff0', digitShadow: '#484030' },
  shadow:  { border: '#181020', outer: '#281838', inner: '#382848', highlight: '#604878', shadow: '#100818', digit: '#c0a0e0', digitShadow: '#181020' },
};

// 像素图案（从原版 PixelDiceRenderer.tsx 翻译：每个 SVG rect → [x,y,w,h,color,alpha?]）
type PxRect = [number, number, number, number, string, number?];

const DICE_PATTERNS: Record<string, PxRect[]> = {
  standard: [[8,8,2,2,'#a0a8b0'],[16,8,2,2,'#a0a8b0'],[12,12,2,2,'#a0a8b0'],[8,16,2,2,'#a0a8b0'],[16,16,2,2,'#a0a8b0']],
  blade: [[6,6,2,12,'#b0b8c0'],[8,10,10,2,'#98a0a8'],[18,8,2,6,'#b0b8c0']],
  amplify: [[12,4,2,8,'#9070d0'],[8,8,2,2,'#7050b0'],[16,8,2,2,'#7050b0'],[10,14,6,2,'#8060c0']],
  split: [[8,6,4,4,'#50c880'],[14,12,4,4,'#40b070'],[12,10,2,2,'#80ffd0']],
  magnet: [[4,6,8,10,'#c04860'],[14,6,8,10,'#3878c0'],[10,10,6,4,'#707880']],
  joker: [[6,6,4,4,'#e06090'],[14,6,4,4,'#60a0e0'],[6,14,4,4,'#60c060'],[14,14,4,4,'#e0c040'],[10,10,4,4,'#e0e0e0']],
  chaos: [[8,6,8,2,'#d05040'],[6,8,4,4,'#c03830'],[14,8,4,4,'#c03830'],[10,12,4,4,'#ffd040'],[10,16,4,2,'#b09030']],
  cursed: [[8,6,8,2,'#8050b0'],[6,8,2,6,'#7040a0'],[16,8,2,6,'#7040a0'],[8,14,8,2,'#6030a0'],[12,10,2,2,'#c080f0']],
  cracked: [[8,6,2,4,'#585858'],[10,10,2,2,'#606060'],[12,12,2,4,'#585858'],[14,16,2,2,'#505050']],
  elemental: [[8,6,4,4,'#e07830'],[14,6,4,4,'#50b8e0'],[8,14,4,4,'#70c030'],[14,14,4,4,'#8060c0'],[11,11,4,2,'#d4a030']],
  heavy: [[8,8,8,2,'#6a6a78'],[6,10,12,4,'#5a5a68'],[8,14,8,2,'#4a4a58'],[10,10,4,2,'#808090']],
  // 战士
  w_bloodthirst: [[12,4,2,2,'#ffffff'],[10,6,6,2,'#e0e0e0'],[8,8,10,4,'#c8c8c8'],[8,12,10,2,'#e0e0e0'],[10,14,6,2,'#a0a0a0'],[12,16,2,2,'#808080'],[12,10,2,2,'#ff6060']],
  w_warcry: [[12,10,2,2,'#80f0ff'],[10,8,6,2,'#60d8e8',0.7],[8,6,10,2,'#40c0d0',0.5],[6,14,14,2,'#40c0d0',0.5]],
  w_ironwall: [[8,4,10,2,'#60e8ff'],[6,6,14,10,'#3098c0'],[8,8,10,6,'#40b0d8'],[12,8,2,6,'#80e8ff'],[8,16,10,2,'#2080a0']],
  w_fury: [[12,4,2,2,'#80ffff'],[10,6,6,2,'#60e8e0'],[8,8,10,4,'#40d0c0'],[8,12,10,2,'#30b0a0'],[10,14,6,2,'#209888'],[12,10,2,2,'#ffffff']],
  w_armorbreak: [[8,6,10,2,'#c040ff'],[6,8,14,8,'#9020d0'],[8,8,2,8,'#b030e8',0.7],[8,8,10,2,'#b030e8',0.5]],
  w_revenge: [[6,10,10,4,'#f06050'],[16,8,2,2,'#ff7060'],[16,14,2,2,'#ff7060'],[18,10,2,4,'#ff8070']],
  w_roar: [[4,8,18,2,'#40e0ff'],[4,14,18,2,'#30c8e8',0.8],[6,10,14,2,'#20b0d0',0.5]],
  w_lifefurnace: [[10,6,2,2,'#60f0ff'],[14,6,2,2,'#60f0ff'],[8,8,4,4,'#40d0e0'],[14,8,4,4,'#40d0e0'],[12,10,2,2,'#80ffff'],[10,12,6,4,'#30b0c0'],[12,16,2,2,'#2098a8']],
  w_execute: [[12,4,2,14,'#ff4080'],[6,6,6,6,'#d02060'],[14,6,6,6,'#d02060'],[8,8,2,2,'#ff60a0'],[16,8,2,2,'#ff60a0']],
  w_leech: [[10,8,6,2,'#80e0ff'],[8,10,10,4,'#50c0e0'],[10,14,6,2,'#80e0ff'],[12,10,2,4,'#ffffff']],
  w_titanfist: [[8,10,10,8,'#2060e0'],[10,6,2,6,'#3080f0'],[12,4,2,8,'#40a0ff'],[14,6,2,6,'#3080f0'],[16,8,2,4,'#1850c0']],
  w_unyielding: [[10,4,6,2,'#a0f0ff'],[8,6,10,8,'#60a8d8'],[10,8,6,4,'#80c8f0'],[12,14,2,4,'#a0f0ff']],
  w_warhammer: [[12,10,2,10,'#4080ff'],[6,4,14,6,'#3060e0'],[8,6,10,2,'#60a0ff']],
  w_bloodblade: [[12,4,2,10,'#40c0ff'],[11,4,4,2,'#60d8ff'],[8,14,10,2,'#2090d0'],[10,16,6,2,'#1070b0']],
  w_giantshield: [[6,4,14,2,'#a0f0ff'],[4,6,18,10,'#5098d0'],[6,8,14,6,'#68b8e8'],[12,8,2,6,'#c0f8ff'],[8,10,10,2,'#c0f8ff',0.5],[8,16,10,2,'#3878b0']],
  w_berserk: [[10,6,2,2,'#80f0ff'],[14,6,2,2,'#80f0ff'],[8,8,4,4,'#50d0e0'],[14,8,4,4,'#50d0e0'],[12,10,2,2,'#a0ffff'],[10,12,6,4,'#30b0c0'],[12,6,2,12,'#ffffff',0.4]],
  w_bloodgod: [[6,10,14,4,'#3060c0'],[8,8,10,2,'#4080e0'],[8,14,10,2,'#4080e0'],[12,6,2,12,'#60a0ff'],[12,10,2,4,'#ffffff']],
  w_overlord: [[6,4,14,4,'#4080e0'],[4,8,18,8,'#3060c0'],[6,10,14,2,'#5098e0'],[10,12,6,2,'#70b8ff'],[6,16,14,2,'#2048a0']],
  // 法师
  mage_elemental: [[6,6,4,4,'#ff9030'],[16,6,4,4,'#50d8ff'],[6,14,4,4,'#90ff40'],[16,14,4,4,'#ff60b0'],[11,11,4,2,'#ffe040']],
  mage_reverse: [[14,6,4,2,'#ff8040'],[16,8,2,4,'#ff6830'],[12,10,4,2,'#ff5020'],[8,12,2,4,'#ff6830'],[8,16,4,2,'#ff8040']],
  mage_missile: [[8,6,4,4,'#ff6040'],[16,8,2,2,'#ff4830',0.7],[10,14,6,4,'#ff3018',0.6]],
  mage_barrier: [[12,4,2,2,'#ffe040'],[8,6,2,2,'#ffd030'],[16,6,2,2,'#ffd030'],[6,8,2,6,'#ffc020'],[18,8,2,6,'#ffc020'],[8,14,2,2,'#ffd030'],[16,14,2,2,'#ffd030'],[12,16,2,2,'#ffe040']],
  mage_meditate: [[12,6,2,2,'#ffe080'],[10,8,2,2,'#ffd060',0.5],[14,8,2,2,'#ffd060',0.5],[8,10,10,4,'#ffc040'],[6,14,4,4,'#ffb030',0.6],[16,14,4,4,'#ffb030',0.6]],
  mage_amplify: [[12,4,2,2,'#ff8040'],[10,6,2,2,'#ff6830'],[14,6,2,2,'#ff6830'],[8,8,10,2,'#ff5020'],[10,10,6,8,'#ff3810'],[12,12,2,4,'#ff8040']],
  mage_mirror: [[12,4,2,16,'#ffe040'],[6,8,4,6,'#ffd030',0.5],[16,8,4,6,'#ffd030',0.5]],
  mage_crystal: [[12,4,2,2,'#ffe040'],[10,6,2,2,'#ffd030'],[14,6,2,2,'#ffd030'],[8,8,2,6,'#ffc020'],[16,8,2,6,'#ffc020'],[10,14,2,2,'#ffd030'],[14,14,2,2,'#ffd030'],[12,16,2,2,'#ffe040'],[12,10,2,2,'#ffffff']],
  mage_temporal: [[8,4,8,2,'#ffe060'],[10,6,4,2,'#ffd050'],[12,8,2,2,'#ffc040'],[10,10,4,2,'#ffd050'],[8,12,8,2,'#ffe060'],[10,14,4,2,'#ffd050'],[8,16,8,2,'#ffe060']],
  mage_prism: [[12,4,2,2,'#ff60a0'],[10,6,2,2,'#ff4090'],[14,6,2,2,'#ff4090'],[8,8,2,2,'#ff2080'],[16,8,2,2,'#ff2080'],[6,16,14,2,'#ff2080']],
  mage_resonance: [[12,10,2,2,'#ffe040'],[10,8,6,2,'#ffd030',0.6],[8,6,10,2,'#ffc020',0.4],[8,14,10,2,'#ffc020',0.4]],
  mage_devour: [[8,8,10,8,'#ff3010'],[10,10,6,4,'#ff4820'],[12,10,2,4,'#ff6030'],[12,12,2,2,'#ffffff']],
  mage_purify: [[12,4,2,16,'#ffe060'],[4,10,18,2,'#ffe060'],[12,10,2,2,'#ffffff']],
  mage_surge: [[12,4,2,2,'#ff6040'],[12,6,2,4,'#ff4830'],[10,10,6,2,'#ff3020'],[12,12,2,6,'#ff2010']],
  mage_elemstorm: [[8,6,4,4,'#ff6030'],[14,8,4,4,'#60d0ff'],[10,14,4,4,'#60ff80'],[12,10,2,2,'#ffffff']],
  mage_burnecho: [[6,10,14,4,'#ff3050'],[8,8,10,2,'#ff1840'],[8,14,10,2,'#ff1840'],[12,6,2,12,'#ff4870'],[12,10,2,4,'#ffffff']],
  mage_star: [[12,4,2,2,'#ffe060'],[10,6,2,2,'#ffd050'],[14,6,2,2,'#ffd050'],[6,8,14,2,'#ffc040'],[8,10,2,2,'#ffd050'],[16,10,2,2,'#ffd050'],[10,12,2,2,'#ffe060'],[14,12,2,2,'#ffe060'],[8,14,2,2,'#ffd050'],[16,14,2,2,'#ffd050']],
  mage_frostecho: [[12,4,2,2,'#ffe040'],[8,6,10,2,'#ffd030'],[6,8,14,6,'#ffc020'],[8,10,10,2,'#ffe040'],[10,14,6,4,'#ffb010']],
  mage_meteor: [[12,10,6,6,'#ff5040'],[14,12,2,2,'#ffffff'],[6,4,2,2,'#ff7060'],[8,6,2,2,'#ff6050'],[10,8,2,2,'#ff5040'],[4,8,2,2,'#ff4030',0.5],[8,4,2,2,'#ff4030',0.5]],
  mage_elemheart: [[10,8,6,6,'#ff8050'],[12,10,2,2,'#ffffff'],[12,4,2,4,'#ffa060'],[12,14,2,4,'#ffa060'],[4,10,6,2,'#ffa060'],[16,10,6,2,'#ffa060']],
  // 盗贼
  r_envenom: [[12,4,2,2,'#e040ff'],[10,6,6,2,'#c830e0'],[8,8,10,2,'#b020c0'],[8,10,10,4,'#c830e0'],[10,14,6,2,'#b020c0'],[12,16,2,2,'#9010a0'],[12,10,2,2,'#ff80ff']],
  r_throwing: [[12,4,2,16,'#ff8040'],[4,12,18,2,'#ff8040'],[12,12,2,2,'#ffe0c0']],
  r_pursuit: [[12,4,2,2,'#ff6080'],[10,6,2,2,'#ff4870'],[14,6,2,2,'#ff4870'],[8,8,2,2,'#ff3060'],[16,8,2,2,'#ff3060'],[12,12,2,2,'#ff6080'],[10,14,2,2,'#ff4870'],[14,14,2,2,'#ff4870'],[8,16,2,2,'#ff3060'],[16,16,2,2,'#ff3060']],
  r_sleeve: [[16,4,2,2,'#e0a0ff'],[16,6,2,2,'#e0a0ff'],[14,8,2,2,'#e0a0ff'],[12,10,2,2,'#e0a0ff'],[10,12,2,2,'#e0a0ff'],[8,14,2,2,'#e0a0ff'],[6,16,2,2,'#e0a0ff'],[16,4,4,2,'#ffc0ff']],
  r_quickdraw: [[6,10,10,4,'#ff8040'],[18,10,2,4,'#ffc090'],[16,8,2,2,'#ffa060'],[16,14,2,2,'#ffa060'],[4,10,4,4,'#ff6020']],
  r_combomastery: [[12,4,2,2,'#ff4080'],[10,6,2,2,'#e83070'],[14,6,2,2,'#e83070'],[8,8,2,2,'#d02060'],[16,8,2,2,'#d02060'],[12,12,2,2,'#ff4080'],[10,14,2,2,'#e83070'],[14,14,2,2,'#e83070']],
  r_toxblade: [[16,4,2,2,'#ff50ff'],[14,6,2,2,'#eb48f3'],[12,8,2,2,'#d740e7'],[10,10,2,2,'#c338db'],[8,12,2,2,'#af30cf'],[8,14,2,2,'#9b28c3'],[16,16,2,2,'#ff80ff'],[16,18,2,2,'#e060e0']],
  r_shadow_clone: [[6,8,4,8,'#e060a0'],[7,9,2,2,'#ff80c0'],[16,8,4,8,'#c04080'],[17,9,2,2,'#e060a0']],
  r_boomerang: [[6,16,2,2,'#ff7828'],[6,14,2,2,'#f78034'],[6,12,2,2,'#ef8840'],[8,10,2,2,'#e7904c'],[10,8,2,2,'#df9858'],[12,6,2,2,'#d7a064'],[14,6,2,2,'#cfa870'],[16,8,2,2,'#c7b07c'],[18,10,2,2,'#bfb888'],[18,12,2,2,'#b7c094']],
  r_corrosion: [[8,8,4,4,'#e060ff'],[16,12,4,4,'#d040e0'],[10,14,4,4,'#c030d0']],
  r_venomfang: [[8,6,2,2,'#ff80d0'],[8,8,2,4,'#e060c0'],[8,12,2,4,'#c040a0'],[16,6,2,2,'#ff90e0'],[16,8,2,4,'#e070d0'],[16,12,2,4,'#c050b0']],
  r_tripleflash: [[6,8,2,8,'#ff5040'],[12,6,2,12,'#ff8060'],[18,8,2,8,'#ff5040']],
  r_shadowdance: [[8,4,2,2,'#ff50c8'],[12,6,2,2,'#f75ac0'],[16,8,2,2,'#ef64b8'],[16,10,2,2,'#e76eb0'],[12,12,2,2,'#df78a8'],[8,14,2,2,'#d782a0'],[8,16,2,2,'#cf8c98'],[12,18,2,2,'#c79690']],
  r_plaguedet: [[10,10,6,4,'#a060d0'],[12,4,2,6,'#7038a0'],[12,14,2,6,'#7038a0'],[4,12,6,2,'#7038a0'],[16,12,6,2,'#7038a0'],[12,12,2,2,'#c060e0']],
  r_phantom: [[10,6,6,2,'#90b8b0'],[16,8,2,2,'#80a8a0'],[12,10,4,2,'#709888'],[12,12,2,2,'#609080'],[12,16,2,2,'#b0d0c8']],
  r_purifyblade: [[6,6,6,12,'#c0e0d0'],[12,6,6,12,'#283830'],[10,10,4,2,'#283830'],[12,14,4,2,'#c0e0d0']],
  r_deathtouch: [[12,6,2,12,'#504840'],[14,4,4,2,'#808888'],[18,6,2,2,'#a0a8a8'],[16,8,2,2,'#707878'],[8,16,4,2,'#603020']],
  r_bladestorm: [[12,4,2,6,'#40c060'],[16,12,6,2,'#38b058'],[12,16,2,6,'#309848'],[4,12,6,2,'#288838'],[12,12,2,2,'#80ffa0']],
  temp_rogue: [[8,8,10,8,'#308040',0.4],[10,10,6,4,'#50c060',0.3],[8,8,2,2,'#40a050'],[16,8,2,2,'#40a050'],[8,14,2,2,'#40a050'],[16,14,2,2,'#40a050']],
  // 元素坍缩图案
  fire: [[10,4,4,2,'#ff9050'],[8,6,8,2,'#e07030'],[6,8,12,4,'#c05820'],[8,12,8,4,'#ff8040'],[10,16,4,2,'#e06020'],[11,8,2,4,'#ffc060']],
  ice: [[11,4,2,14,'#60b8e0'],[5,10,14,2,'#60b8e0'],[7,6,2,2,'#80d0f0'],[15,6,2,2,'#80d0f0'],[7,14,2,2,'#80d0f0'],[15,14,2,2,'#80d0f0']],
  thunder: [[12,4,4,2,'#e0d040'],[10,6,4,2,'#d0c030'],[8,8,6,2,'#f0e050'],[10,10,4,2,'#e0d040'],[12,12,4,2,'#d0c030'],[10,14,4,2,'#c0b020'],[10,16,2,2,'#b0a010']],
  poison: [[10,4,4,2,'#50d050'],[8,6,8,2,'#40c040'],[6,8,12,4,'#38a838'],[8,12,8,4,'#48c848'],[10,16,4,2,'#30a030'],[10,10,4,2,'#70ff70']],
  holy: [[11,4,2,14,'#e0d8a0'],[6,9,12,4,'#e0d8a0'],[9,7,6,2,'#d0c890',0.5],[9,14,6,2,'#d0c890',0.5]],
  shadow: [[8,8,8,8,'#382848'],[6,6,6,6,'#281838',0.6],[12,12,6,6,'#201030',0.4],[10,10,4,4,'#604878']],
};

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** 渲染一个像素骰子到 Container（26×30 虚拟网格，由 scale 决定实际大小） */
export function renderPixelDice(
  value: number | string, diceDefId: string, size: number,
  selected: boolean = false, element?: string,
): Container {
  // 元素坍缩时使用元素配色（打破职业色系）
  const elementColors = element && element !== 'normal' ? DICE_COLORS[element] : null;
  const colors = elementColors || DICE_COLORS[diceDefId] || DICE_COLORS.standard;
  const scale = size / 26; // viewBox 宽度 26
  const c = new Container();
  const g = new Graphics();

  const r = (x: number, y: number, w: number, h: number, color: string, alpha: number = 1) => {
    g.beginFill(hexToNum(color), alpha);
    g.drawRect(x * scale, y * scale, w * scale, h * scale);
    g.endFill();
  };

  // === 底部厚度 ===
  r(0, 24, 26, 2, colors.shadow);
  r(0, 26, 26, 2, colors.shadow, 0.6);
  r(2, 28, 22, 2, '#000000', 0.25);

  // === 外边框 ===
  r(0, 0, 26, 2, colors.border);
  r(0, 22, 26, 2, colors.border);
  r(0, 0, 2, 24, colors.border);
  r(24, 0, 2, 24, colors.border);

  // === 底色 ===
  r(2, 2, 22, 20, colors.outer);

  // === 内层亮区 ===
  r(4, 4, 18, 16, colors.inner);

  // === 高光（左+上） ===
  r(2, 2, 22, 2, colors.highlight, 0.35);
  r(2, 2, 2, 20, colors.highlight, 0.2);
  r(4, 4, 4, 2, colors.highlight, 0.3);
  r(4, 4, 2, 4, colors.highlight, 0.25);

  // === 暗边（右+下） ===
  r(22, 4, 2, 18, colors.shadow, 0.4);
  r(4, 20, 20, 2, colors.shadow, 0.35);
  r(20, 18, 2, 2, colors.shadow, 0.3);

  // === 图案 ===
  const pattern = DICE_PATTERNS[diceDefId];
  if (pattern) {
    for (const [px, py, pw, ph, pc, pa] of pattern) {
      r(px, py, pw, ph, pc, (pa ?? 1) * 0.85);
    }
  }

  // === 数字 ===
  const digitStr = String(value);
  const digitData = PIXEL_DIGITS[digitStr] || PIXEL_DIGITS['?'];
  for (let ry = 0; ry < digitData.length; ry++) {
    for (let rx = 0; rx < digitData[ry].length; rx++) {
      if (!digitData[ry][rx]) continue;
      const x = 10 + rx * 2;
      const y = 7 + ry * 2;
      // 阴影
      r(x + 1, y + 1, 2, 2, colors.digitShadow);
      // 数字
      r(x, y, 2, 2, colors.digit);
    }
  }

  // === 选中态 ===
  if (selected) {
    r(0, 0, 26, 2, colors.highlight, 0.8);
    r(0, 26, 26, 2, colors.highlight, 0.5);
    r(0, 0, 2, 28, colors.highlight, 0.8);
    r(24, 0, 2, 28, colors.highlight, 0.8);
  }

  c.addChild(g);
  return c;
}

/** 检查是否有像素渲染配色 */
export function hasPixelDice(diceDefId: string): boolean {
  return !!DICE_COLORS[diceDefId];
}