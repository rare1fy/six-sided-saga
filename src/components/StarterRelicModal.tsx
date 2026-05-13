/**
 * StarterRelicModal.tsx — 开局遗物三选一 UI（v0.5）
 *
 * 进入第一个战斗节点前弹出，展示3个职业专属遗物供选择。
 * 每个遗物有HP/maxHP代价，玩家可选择1个或跳过。
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelHeart } from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import type { StarterRelicChoice } from '../types/relics';
import { ALL_RELICS } from '../data/relics';

interface StarterRelicModalProps {
  choices: StarterRelicChoice[];
  playerHp: number;
  playerMaxHp: number;
  onSelect: (index: number) => void;
  onSkip: () => void;
}

export function StarterRelicModal({
  choices,
  playerHp,
  playerMaxHp,
  onSelect,
  onSkip,
}: StarterRelicModalProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const RARITY_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    common: { border: 'var(--dungeon-panel-border)', bg: 'rgba(200,200,200,0.08)', text: 'var(--dungeon-text)', glow: 'none' },
    uncommon: { border: 'rgba(60,180,80,0.6)', bg: 'rgba(60,180,80,0.08)', text: '#60d060', glow: '0 0 8px rgba(60,180,80,0.3)' },
    rare: { border: 'rgba(80,120,255,0.6)', bg: 'rgba(80,120,255,0.08)', text: '#80a0ff', glow: '0 0 12px rgba(80,120,255,0.3)' },
    legendary: { border: 'rgba(212,160,48,0.6)', bg: 'rgba(212,160,48,0.1)', text: 'var(--pixel-gold)', glow: '0 0 16px rgba(212,160,48,0.4)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        className="w-[90vw] max-w-md pixel-panel p-4 bg-[var(--dungeon-bg)]"
      >
        {/* 标题 */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-black text-[var(--pixel-gold)] pixel-text-shadow tracking-wider">
            选择起始遗物
          </h2>
          <p className="text-[10px] text-[var(--dungeon-text-dim)] mt-1">
            选择一件职业专属遗物开始冒险（需付出代价）
          </p>
        </div>

        {/* 三选一卡片 */}
        <div className="flex gap-2 mb-4">
          {choices.map((choice, idx) => {
            const relic = ALL_RELICS[choice.relicId];
            if (!relic) return null;
            const colors = RARITY_COLORS[relic.rarity] || RARITY_COLORS.common;
            const canAfford = playerHp > choice.hpCost;
            const isHovered = hoveredIndex === idx;

            return (
              <motion.button
                key={choice.relicId}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => canAfford && onSelect(idx)}
                disabled={!canAfford}
                whileHover={canAfford ? { scale: 1.03, y: -4 } : undefined}
                whileTap={canAfford ? { scale: 0.97 } : undefined}
                className={`flex-1 p-3 border-2 transition-all ${
                  canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
                style={{
                  borderColor: isHovered && canAfford ? colors.text : colors.border,
                  background: isHovered && canAfford
                    ? `linear-gradient(180deg, ${colors.bg} 0%, rgba(0,0,0,0.3) 100%)`
                    : colors.bg,
                  boxShadow: isHovered && canAfford ? colors.glow : 'none',
                  borderRadius: '4px',
                }}
              >
                {/* 遗物图标 */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <RelicPixelIcon relicId={choice.relicId} size={40} />
                  </div>
                </div>

                {/* 遗物名称 */}
                <div
                  className="text-[11px] font-bold text-center mb-1 pixel-text-shadow"
                  style={{ color: colors.text }}
                >
                  {relic.name}
                </div>

                {/* 稀有度标签 */}
                <div className="flex justify-center mb-2">
                  <span
                    className="text-[8px] px-1.5 py-0.5 border font-bold"
                    style={{
                      color: colors.text,
                      borderColor: colors.border,
                      borderRadius: '2px',
                    }}
                  >
                    {relic.rarity.toUpperCase()}
                  </span>
                </div>

                {/* 遗物描述 */}
                <div className="text-[9px] text-[var(--dungeon-text)] leading-snug text-center mb-3 min-h-[36px]">
                  {relic.description}
                </div>

                {/* 代价 */}
                <div className="flex items-center justify-center gap-1 pt-2 border-t border-[var(--dungeon-panel-border)]">
                  <PixelHeart size={1.2} />
                  <span className="text-[10px] font-mono font-bold text-[var(--pixel-red-light)]">
                    -{choice.hpCost} HP / -{choice.maxHpCost} MaxHP
                  </span>
                </div>

                {!canAfford && (
                  <div className="text-[8px] text-[var(--pixel-red)] mt-1 text-center">
                    HP不足
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 跳过按钮 */}
        <div className="flex justify-center">
          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-[var(--dungeon-panel)] border-2 border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] text-[11px] font-bold hover:text-[var(--dungeon-text)] hover:border-[var(--dungeon-text-dim)] transition-all"
            style={{ borderRadius: '3px' }}
          >
            跳过（不选择遗物）
          </motion.button>
        </div>

        {/* 当前HP提示 */}
        <div className="text-center mt-3">
          <span className="text-[9px] text-[var(--dungeon-text-dim)] font-mono">
            当前 HP: {playerHp}/{playerMaxHp}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
