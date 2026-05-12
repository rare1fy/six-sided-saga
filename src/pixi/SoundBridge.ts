/**
 * SoundBridge — 音效桥接
 * 
 * 原项目的音效系统(soundPlayer.ts + soundEffects.ts)使用 Web Audio API，
 * 微信小游戏也支持 Web Audio，所以可以直接复用。
 * 
 * 但原项目的 playSound 依赖一些 DOM 环境检测，这里做一个安全包装。
 */

let soundEnabled = true;

/** 安全播放音效 */
export function playSfx(soundId: string) {
  if (!soundEnabled) return;
  try {
    // 动态导入避免循环依赖
    import('../utils/sound').then(({ playSound }) => {
      playSound(soundId as any);
    }).catch(() => {
      // 小游戏环境可能加载失败，静默
    });
  } catch {
    // 忽略
  }
}

/** 开关音效 */
export function toggleSound(enabled: boolean) {
  soundEnabled = enabled;
}

/** 安全播放 BGM */
export function playBgm(trackId: 'battle' | 'explore' | 'start') {
  try {
    import('../engine/soundPlayer').then(({ SoundPlayer }) => {
      // 如果 SoundPlayer 单例存在就调用
      if (typeof SoundPlayer?.playBGM === 'function') {
        SoundPlayer.playBGM(trackId);
      }
    }).catch(() => {});
  } catch {}
}
