/**
 * vulnerableCalc.ts - 易伤层数化计算（v0.5 新增）
 *
 * 设计文档：板块01 §1.5.2
 * 易伤从固定×1.5改为层数化资源：
 * - 每层+0.5，封顶5层×3.5
 * - 每个敌方回合结束-1层
 * - 多次施加累计叠加（封顶5层）
 */

/** 易伤封顶层数 */
export const VULNERABLE_MAX_LAYERS = 5;

/** 每层易伤加成 */
export const VULNERABLE_BONUS_PER_LAYER = 0.5;

/**
 * 计算易伤系数
 * @param layers 当前易伤层数
 * @returns 易伤倍率（1.0 = 无易伤，3.5 = 5层封顶）
 */
export function calcVulnerableMultiplier(layers: number): number {
  if (layers <= 0) return 1.0;
  const clampedLayers = Math.min(layers, VULNERABLE_MAX_LAYERS);
  return 1 + VULNERABLE_BONUS_PER_LAYER * clampedLayers;
}

/**
 * 施加易伤层数（累加，封顶5层）
 * @param currentLayers 当前层数
 * @param addLayers 新增层数
 * @returns 施加后的层数
 */
export function applyVulnerableLayers(currentLayers: number, addLayers: number): number {
  return Math.min(currentLayers + addLayers, VULNERABLE_MAX_LAYERS);
}

/**
 * 衰减易伤层数（敌方回合结束-1层）
 * @param currentLayers 当前层数
 * @returns 衰减后的层数
 */
export function decayVulnerableLayers(currentLayers: number): number {
  return Math.max(0, currentLayers - 1);
}
