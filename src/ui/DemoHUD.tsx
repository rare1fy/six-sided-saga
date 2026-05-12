/**
 * DemoHUD — 演示用 DOM HUD 叠加层
 * 
 * 这个文件展示了 "PixiJS Canvas + DOM UI叠加" 的混合架构。
 * 后续迁移时，这里的 DOM UI 可以：
 *   A) 保持 DOM（如果小游戏平台支持覆盖 DOM）
 *   B) 逐步迁移为 Pixi Layout 组件
 * 
 * 当前先用内联样式（不依赖 Tailwind），后续可引入。
 */
interface DemoHUDProps {
  width: number;
  height: number;
}

export function DemoHUD({ width, height }: DemoHUDProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Microsoft YaHei, sans-serif',
      }}
    >
      {/* ===== 顶部 HUD ===== */}
      <div
        style={{
          background: 'rgba(10,8,4,0.9)',
          borderBottom: '1px solid #333',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 12, color: '#fc6', fontSize: 12 }}>
          <span>💰 186</span>
          <span>🏠 8</span>
          <span>⚔️ 8</span>
        </div>
        <span style={{ color: '#f96', fontSize: 13, fontWeight: 'bold' }}>
          幽暗森林
        </span>
      </div>

      {/* ===== 中间区域留给 PixiJS 渲染 ===== */}
      <div style={{ flex: 1 }} />

      {/* ===== 底部 UI 面板 ===== */}
      <div
        style={{
          background: 'rgba(10,8,4,0.95)',
          borderTop: '2px solid #c44',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 技能栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '6px 12px',
            gap: 8,
          }}
        >
          <button
            style={{
              background: 'linear-gradient(180deg, #3a1a0a, #2a0e06)',
              border: '2px solid #e63',
              borderRadius: 6,
              color: '#fc6',
              fontSize: 13,
              fontWeight: 'bold',
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            普通攻击 ⚡7
          </button>
        </div>

        {/* 角色信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 12px',
            gap: 10,
            borderTop: '1px solid #333',
          }}
        >
          <span style={{ color: '#f88', fontSize: 13, fontWeight: 'bold' }}>
            🩸 嗜血狂战
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 6,
                background: '#222',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 3,
              }}
            >
              <div
                style={{
                  width: '80%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #2a2, #4c4)',
                }}
              />
            </div>
            <div
              style={{
                height: 6,
                background: '#222',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #26c, #48f)',
                }}
              />
            </div>
          </div>
          <span style={{ color: '#888', fontSize: 11 }}>R1</span>
        </div>

        {/* 骰子区域 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px',
            gap: 12,
            borderTop: '1px solid #333',
          }}
        >
          {[4, 1, 3].map((val, i) => (
            <div
              key={i}
              style={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #ddd, #999)',
                border: '3px solid #666',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                color: '#333',
                cursor: 'pointer',
              }}
            >
              {val}
            </div>
          ))}
        </div>

        {/* 操作栏 */}
        <div
          style={{
            display: 'flex',
            padding: '8px 12px',
            gap: 10,
            borderTop: '1px solid #555',
          }}
        >
          <button
            style={{
              background: 'linear-gradient(180deg, #333, #222)',
              border: '2px solid #666',
              borderRadius: 8,
              color: '#aaa',
              fontSize: 12,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            🔄 1次
          </button>
          <button
            style={{
              flex: 1,
              background: 'linear-gradient(180deg, #c30, #900)',
              border: '2px solid #f63',
              borderRadius: 8,
              color: '#fff',
              fontSize: 15,
              fontWeight: 'bold',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            ▶ 出牌: 普通攻击
          </button>
          <button
            style={{
              background: 'linear-gradient(180deg, #333, #222)',
              border: '2px solid #666',
              borderRadius: 8,
              color: '#aaa',
              fontSize: 12,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            🔒 0
          </button>
        </div>
      </div>
    </div>
  );
}
