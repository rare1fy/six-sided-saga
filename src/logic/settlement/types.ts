/**
 * settlement/types.ts — 结算演出接口定义
 *
 * ARCH-17 从 settlementAnimation.ts 拆出
 * 原文件 L20-L72：SettlementContext + SettlementData
 */

import type { Die, GameState, Enemy, HandResult, StatusEffect } from '../../types/game';
import type { ExpectedOutcomeResult } from '../expectedOutcomeTypes';

// ============================================================
// Context 接口
// ============================================================

export interface SettlementContext {
  // State 快照
  game: GameState;
  gameRef: { current: GameState };
  enemies: Enemy[];
  dice: Die[];
  currentHands: HandResult;
  selected: Die[];
  outcome: ExpectedOutcomeResult;
  targetEnemy: Enemy;
  comboFinisherBonus: number;
  straightUpgrade: number;
  isAoeActive: boolean;

  // Callbacks — React setState 稳定引用
  setSettlementData: (v: SettlementData | null | ((prev: SettlementData | null) => SettlementData | null)) => void;
  setSettlementPhase: (v: string | null | ((prev: string | null) => string | null)) => void;
  setShowRelicPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowDamageOverlay: (v: { damage: number; armor: number; heal: number } | null | ((prev: { damage: number; armor: number; heal: number } | null) => { damage: number; armor: number; heal: number } | null)) => void;
  setScreenShake: (v: boolean | ((prev: boolean) => boolean)) => void;
  setFlashingRelicIds: (v: string[] | ((prev: string[]) => string[])) => void;
  setGame: (v: GameState | ((prev: GameState) => GameState)) => void;
  addLog: (msg: string) => void;
  addToast: (msg: string, type?: string, options?: { icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }) => void;
  addFloatingText: (text: string, color: string, icon?: string, target?: string, persistent?: boolean) => void;
  playSound: (id: string) => void;
  playSettlementTick: (idx: number) => void;
  playMultiplierTick: (idx: number) => void;
  playHeavyImpact: (intensity: number) => void;
}

/** 结算面板数据（与 DiceHeroGame 中 useState 内联类型一致） */
export interface SettlementData {
  bestHand: string;
  selectedDice: Die[];
  diceScores: number[];
  baseValue: number;
  mult: number;
  currentBase: number;
  currentMult: number;
  triggeredEffects: { name: string; detail: string; icon?: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number; relicId?: string }[];
  currentEffectIdx: number;
  finalDamage: number;
  finalArmor: number;
  finalHeal: number;
  statusEffects: StatusEffect[];
  isSameElement?: boolean;
}