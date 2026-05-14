# Cocos Creator 3.x 开发 Rule

> 萃取自 Cocos Creator 官方文档 + 社区框架（oops-framework / XForge）+ 抖音小游戏接入实践。
> 作用：Coder / Verify 动代码前的快速 checklist。
> 范围：Cocos Creator 3.8+ · TypeScript。
> 版本：v1.0 · 2026-05-13。

---

## 一、项目结构（8 条）

### 1.1 目录规范

```
project/
├── assets/
│   ├── scenes/              # 场景文件 (.scene)
│   ├── prefabs/             # 预制体 (.prefab)
│   │   ├── ui/              # UI 预制体
│   │   ├── battle/          # 战斗相关预制体
│   │   └── common/          # 通用预制体
│   ├── scripts/
│   │   ├── logic/           # 纯逻辑层（零引擎依赖，可直接从 PixiJS 迁移）
│   │   ├── data/            # 数据定义层（职业/骰子/敌人/遗物）
│   │   ├── components/      # 组件脚本（挂节点用）
│   │   ├── managers/        # 管理器（单例/Autoload 级）
│   │   └── utils/           # 工具函数
│   ├── resources/           # 动态加载资源（必须放这里才能 resources.load）
│   │   ├── textures/
│   │   ├── audio/
│   │   └── data/
│   ├── textures/            # 静态引用贴图（场景/预制体直接引用）
│   │   ├── ui/
│   │   ├── icons/
│   │   └── atlas/           # 图集 (.plist + .png)
│   ├── audio/
│   │   ├── bgm/
│   │   └── sfx/
│   ├── fonts/               # 字体文件 + BMFont
│   └── animations/          # 动画片段 (.anim)
├── extensions/              # 编辑器插件
├── settings/                # 项目设置（自动生成，不手动改）
└── native/                  # 原生平台构建产物
```

### 1.2 规则

1. **assets/scripts/logic/ 和 assets/scripts/data/ 禁止 import 任何 cc 模块**。这两个目录是纯 TS 逻辑，从 PixiJS 项目直接迁移，保持引擎无关。
2. **动态加载的资源必须放 resources/ 目录**。resources.load() 只能加载此目录下的资源。
3. **静态引用的资源放 textures/ / audio/**，通过 Inspector 拖拽绑定，不走 resources.load()。
4. **图集（Atlas）统一管理**。同一界面的散图打成一个图集，减少 DrawCall。不同界面的图不要混在同一图集。
5. **预制体按功能域分目录**，不要全堆在 prefabs/ 根目录。
6. **场景文件精简**。每个场景只放该场景的根节点结构，复杂 UI 用预制体实例化。
7. **第三方插件放 extensions/**，不要散落在 assets/ 里。
8. **.meta 文件必须提交到版本控制**。Cocos 靠 .meta 追踪资源 UUID，丢了就断链。

---

## 二、组件与脚本（12 条）

### 2.1 装饰器规范

```typescript
import { _decorator, Component, Node, Sprite, Label, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BattleHud')
export class BattleHud extends Component {
    // ── @property 暴露到 Inspector ──
    @property(Label)
    hpLabel: Label = null!;

    @property(Sprite)
    hpBar: Sprite = null!;

    @property(Prefab)
    damageTextPrefab: Prefab = null!;

    // ── 私有成员 ──
    private _currentHp: number = 0;
    private _maxHp: number = 0;

    // ── 生命周期 ──
    protected onLoad(): void { }
    protected start(): void { }
    protected update(dt: number): void { }
    protected onDestroy(): void { }

    // ── 公开方法 ──
    public setHp(current: number, max: number): void {
        this._currentHp = current;
        this._maxHp = max;
        this.hpLabel.string = current + '/' + max;
        this.hpBar.fillRange = current / max;
    }

    // ── 私有方法 ──
    private _spawnDamageText(value: number): void {
        const node = instantiate(this.damageTextPrefab);
        node.parent = this.node;
    }
}
```

### 2.2 规则

1. **@ccclass 名必须与类名一致**，且全局唯一。
2. **@property 类型必须显式声明**。@property(Node) 不要写 @property。
3. **非空断言用 null!**。@property 成员初始值写 null!，表示 Inspector 会赋值，运行时不为 null。
4. **脚本成员排序**：import → const { ccclass, property } → @ccclass → @property → private 成员 → onLoad → start → update → lateUpdate → onDestroy → public 方法 → private 方法
5. **一个脚本一个 @ccclass**。不要在同一文件里定义多个组件类。
6. **组件职责单一**。一个组件只做一件事，不要写 God Component。
7. **禁止在 update() 里做以下事情**：instantiate() / new Node() / resources.load() / find() / getChildByName() / 大量字符串拼接
8. **节点引用用 @property 拖拽绑定**，不要用 this.node.getChildByName('xxx')。如果必须代码查找，缓存到 onLoad() 里。
9. **事件监听在 onLoad/start 注册，在 onDestroy 注销**。防止内存泄漏。
10. **this.schedule / this.scheduleOnce 替代 setTimeout**。Cocos 的调度器跟引擎生命周期绑定，节点销毁自动清理。
11. **跨组件通信优先用事件**。this.node.emit() / this.node.on() 用于父子通信；全局事件用 EventTarget 单例。
12. **禁止循环依赖**。A import B，B import A → 必死。用事件或中间层解耦。

---

## 三、预制体（Prefab）规范（6 条）

1. **预制体 = 可复用的节点模板**。任何会被多次实例化的 UI 都应该做成预制体。
2. **预制体内部自给自足**。脚本不应该依赖外部场景的特定节点路径。通过 @property 或事件传入数据。
3. **预制体修改后必须点保存**。双击预制体进入编辑模式 → 修改 → 点击顶部保存按钮。
4. **动态实例化标准流程**：@property(Prefab) → instantiate() → getComponent() → init(data) → addChild()
5. **高频创建/销毁用对象池**。NodePool 或自定义池，避免反复 instantiate + destroy。
6. **预制体嵌套不超过 3 层**。过深的嵌套会导致编辑器卡顿和维护困难。

---

## 四、UI 系统规范（10 条）

### 4.1 适配

1. **Canvas 组件设置**：Design Resolution 720x1280（与 PixiJS 版本一致），Fit Height 优先。
2. **Widget 组件做锚点适配**。顶部 HUD 锚定顶部，底部按钮锚定底部，不要硬编码坐标。
3. **安全区适配**。刘海屏/异形屏通过 screen.safeAreaRect 获取安全区。

### 4.2 布局

4. **Layout 组件做自动排列**。列表、网格、卡片排列用 Layout，不要手动算坐标。
5. **ScrollView 做滚动列表**。内容超出屏幕用 ScrollView，内部 content 节点挂 Layout。
6. **九宫格（Sliced）做可拉伸面板**。面板背景用 Sprite 的 Sliced 模式，任意尺寸不变形。

### 4.3 交互

7. **Button 组件处理点击**。不要自己写触摸事件模拟按钮。
8. **触摸事件冒泡规则**：子节点 → 父节点。用 event.propagationStopped = true 阻止冒泡。
9. **BlockInputEvents 组件**挂在弹窗底层遮罩上，阻止穿透点击。
10. **UI 层级用 Canvas 的 priority 控制**。弹窗 > 主界面。

---

## 五、资源管理（8 条）

1. **静态引用 vs 动态加载**：@property 拖拽用于确定资源；resources.load() 用于运行时按需加载；assetManager.loadBundle() 用于分包。
2. **resources/ 目录不要放太多东西**。该目录下所有资源都会被打进首包。
3. **图集规则**：同界面图打一个图集，尺寸不超过 2048x2048，像素风用 Filter Mode: Point。
4. **音频格式**：BGM 用 .ogg（流式播放），SFX 用 .mp3 或 .ogg（预加载）。
5. **字体**：像素风用 BMFont（.fnt + .png），不用系统字体。
6. **资源释放**：场景切换时 assetManager.releaseAsset() 释放不再需要的资源。
7. **预加载**：进入战斗前 resources.preload() 预加载战斗资源。
8. **禁止在 update() 里加载资源**。

---

## 六、性能优化（10 条铁律）

### 6.1 DrawCall

1. **同一界面的 Sprite 用同一图集** → 自动合批，1 个 DrawCall。
2. **渲染顺序影响合批**。节点树中相邻的同图集 Sprite 才能合批。
3. **Label 打断合批**。Label 和 Sprite 交替排列会产生大量 DrawCall。解决：Label 统一放在 Sprite 层之上。
4. **目标：单帧 DrawCall <= 50**（2D 像素风游戏）。

### 6.2 内存

5. **对象池复用节点**。子弹、伤害数字、粒子等高频创建对象必须用池。
6. **及时释放不用的资源**。assetManager.releaseAsset() 或 decRef()。
7. **图片压缩**：像素风小图用 PNG（无损），大背景图用 ASTC/ETC2（有损但省内存）。

### 6.3 CPU

8. **update() 只放每帧必须的逻辑**。AI 计算、UI 数值刷新用 this.schedule(fn, 0.25) 降频。
9. **find() / getChildByName() 结果缓存**。不要每帧调用。
10. **Tween 替代手写插值**。tween(node).to(0.3, { position: v3(100, 0, 0) }).start() 比 update 里手算更高效。

---

## 七、场景管理（5 条）

1. **director.loadScene('SceneName') 切换场景**。自动释放旧场景资源。
2. **常驻节点用 director.addPersistRootNode(node)**。BGM 管理器、全局 UI 等跨场景存活。
3. **场景结构标准化**：Canvas(UI根) → Background + Content + Overlay(弹窗层)；GameWorld(非UI)；Managers(管理器)。
4. **场景间传参用全局单例**。不要用 localStorage 传参。
5. **Loading 场景做中转**。大场景切换时先跳 Loading 场景，异步预加载目标场景资源。

---

## 八、动画与 Tween（5 条）

1. **简单动画用 Tween API**：tween(node).to(0.3, { scale: new Vec3(1.2, 1.2, 1) }).start()
2. **复杂动画用 Animation 组件 + 动画编辑器**。关键帧动画在编辑器里可视化编辑。
3. **骨骼动画用 Spine / DragonBones**。Cocos 原生支持。
4. **Tween 链式调用不超过 5 步**。过长的链拆成多个 Tween 或用 Animation。
5. **Tween 必须在节点销毁前停止**。Tween.stopAllByTarget(this.node) 放在 onDestroy() 里。

---

## 九、音频（4 条）

1. **AudioSource 组件播放音频**。BGM 用常驻 AudioSource（loop=true），SFX 用 playOneShot()。
2. **音频管理器单例**。统一控制音量、静音、BGM 切换。
3. **音频格式**：.ogg 优先，.mp3 备选。不用 .wav。
4. **前后台切换暂停音频**。监听 Game.EVENT_HIDE 暂停，Game.EVENT_SHOW 恢复。

---

## 十、命名规范（6 条）

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名（脚本） | PascalCase | BattleHud.ts |
| 文件名（资源） | kebab-case | hp-bar-bg.png |
| 类名 | PascalCase | BattleHud |
| @ccclass 名 | PascalCase（与类名一致） | @ccclass('BattleHud') |
| 变量/函数 | camelCase | currentHp, getMaxHp() |
| 私有成员 | _ 前缀 + camelCase | _currentHp, _updateBar() |
| 常量 | UPPER_SNAKE_CASE | MAX_HP, CARD_WIDTH |
| 节点名 | PascalCase | HpBar, DamageText |
| 场景名 | PascalCase | BattleScene.scene |
| 预制体名 | PascalCase | CardView.prefab |

---

## 十一、抖音小游戏适配（7 条）

1. **Cocos Creator 是抖音小游戏官方一等公民**。构建面板直接选抖音小游戏平台。
2. **首包 <= 20MB**。用 Build 面板的分包功能拆分资源。
3. **tt.* API 通过 globalThis.tt 调用**。
4. **侧边栏必接**（2023-11-24 起未接拒审）。
5. **所有 HTTP 请求域名必须在开发者后台白名单登记**，且必须 https://。
6. **音频在小游戏环境下可能有延迟**。SFX 预加载。
7. **真机调试必须用预览扫码**。模拟器和真机行为可能不一致。

---

## 十二、从 PixiJS 迁移检查清单

### 可直接复制的（零改动）

| 模块 | 行数 | 说明 |
|------|------|------|
| src/logic/* | ~8,345 | 战斗/骰子/技能/AI/结算，纯 TS 逻辑 |
| src/data/* | ~6,422 | 职业/骰子/敌人/遗物数据定义 |

### 需要适配的

| PixiJS 概念 | Cocos 对应 | 改动方式 |
|------------|-----------|---------|
| new Graphics() | Graphics 组件 | API 相似，改方法名 |
| new Container() | Node | 概念一致 |
| new Text() | Label 组件 | Inspector 配置 |
| Sprite | Sprite 组件 | Inspector 拖图 |
| app.stage | Canvas 根节点 | 场景树 |
| Tween (自定义) | tween() API | 语法几乎一样 |
| SceneManager | director.loadScene() | 简化 |
| EventEmitter | EventTarget / node.emit() | 概念一致 |
| lil-gui Debug | Inspector 面板 | 不需要了 |
| 手动 resize 适配 | Canvas 组件 | 不需要了 |

### 需要重写的

| 模块 | 原因 |
|------|------|
| 所有 Scene 类 | PixiJS 手动绘制 → Cocos 场景编辑器 + 预制体 |
| UIComponents.ts | PixiJS Graphics 手绘 → Cocos Sprite + 九宫格 |
| UIFactory.ts | 不再需要，用预制体替代 |
| PixelTextures.ts | 代码生成贴图 → 编辑器导入 .png |
| DebugGUI.ts | 不再需要，Inspector 原生替代 |

---

## 附录 A · 反模式红名单

| 反模式 | 正确做法 |
|--------|---------|
| getChildByName('xxx') 每帧调用 | @property 拖拽绑定或 onLoad 缓存 |
| update() 里 instantiate() | 对象池 + 预创建 |
| update() 里 resources.load() | onLoad / start 预加载 |
| @property 不写类型 | @property(Node) 显式声明 |
| @ccclass 名与类名不一致 | 保持一致 |
| 所有资源都放 resources/ | 静态引用的放外面 |
| .meta 文件不提交 git | 必须提交 |
| setTimeout / setInterval | this.schedule() / this.scheduleOnce() |
| 弹窗不加 BlockInputEvents | 加上，防止穿透点击 |
| Label 和 Sprite 交替排列 | Label 统一放上层 |
| 预制体嵌套 5+ 层 | <= 3 层 |
| 跨场景用 localStorage 传参 | 全局单例 GameContext |

## 附录 B · 官方资源索引

| 资源 | URL |
|------|-----|
| Cocos Creator 官方文档 | https://docs.cocos.com/creator/manual/zh/ |
| API 参考 | https://docs.cocos.com/creator/api/zh/ |
| Cocos 中文社区 | https://forum.cocos.org/ |
| 抖音小游戏接入 | https://developer.open-douyin.com/ |
| oops-framework | https://forum.cocos.org/t/topic/116503 |
| XForge 框架 | https://gitee.com/DemonsJL/cococs-creator-frame-3d |

---

本文件为 Cocos Creator 通用技术规范，不绑定具体项目。任何基于 Cocos Creator 3.x 的项目都可直接引用。
