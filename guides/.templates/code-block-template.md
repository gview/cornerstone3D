## 代码块模板

### 基本格式

所有代码示例必须遵循以下格式：

#### 1. 带中文注释的代码块

```typescript
// 导入 Cornerstone3D 核心库
import { init, RenderingEngine, Enums } from '@cornerstonejs/core';

// 初始化 Cornerstone3D
async function initializeCornerstone() {
  try {
    // 配置渲染引擎模式
    await init({
      core: {
        renderingEngineMode: Enums.RenderingEngineMode.CONTEXT_POOL,
      },
    });

    console.log('✅ Cornerstone3D 初始化成功！');
  } catch (error) {
    // 错误处理
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}
```

**要求**：
- ✅ 所有代码必须包含中文注释
- ✅ 关键步骤必须有说明
- ✅ 错误处理必须有注释
- ✅ 使用 emoji 标记重要状态（✅ 成功、❌ 错误、⚠️ 警告）

#### 2. 代码块标题和说明

**文件路径**: `src/App.tsx`

```typescript
// App 组件 - 应用的主入口
import { useEffect, useRef } from 'react';
import { RenderingEngine } from '@cornerstonejs/core';

function App() {
  // 视口容器的引用
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    // 创建渲染引擎
    const renderingEngine = new RenderingEngine('my-engine');

    // 清理函数
    return () => {
      renderingEngine.destroy();
    };
  }, []);

  return (
    <div>
      <h1>我的 Cornerstone3D 应用</h1>
      <div
        ref={divRef}
        style={{ width: '512px', height: '512px', border: '1px solid black' }}
      />
    </div>
  );
}

export default App;
```

**代码说明**：
- 这段代码创建了一个简单的 React 组件
- `useRef` 用于获取 DOM 元素的引用
- `RenderingEngine` 负责管理视口
- 清理函数确保资源正确释放

#### 3. 配置文件示例

**文件路径**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**配置说明**：
- `plugins`: 配置 React 插件
- `server`: 开发服务器配置
  - `port`: 端口号
  - `open`: 自动打开浏览器
- `build`: 构建配置
  - `outDir`: 输出目录
  - `sourcemap`: 生成 source map

#### 4. 命令行示例

```bash
# 安装依赖
yarn add @cornerstonejs/core @cornerstonejs/tools

# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 运行测试
yarn test
```

#### 5. JSON 配置示例

**文件路径**: `package.json`

```json
{
  "name": "my-cornerstone-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@cornerstonejs/core": "^latest",
    "@cornerstonejs/tools": "^latest",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 代码块规范

#### 语言标识符

必须指定正确的语言标识符：

```javascript
// JavaScript
```javascript
const example = 'value';
```

// TypeScript
```typescript
const example: string = 'value';
```

// Bash/Shell
```bash
npm install @cornerstonejs/core
```

// JSON
```json
{
  "key": "value"
}
```

// YAML
```yaml
key: value
```
```

#### 代码高亮

- ✅ 使用正确的语言标识符启用语法高亮
- ✅ TypeScript 代码使用 `typescript`
- ✅ JavaScript 代码使用 `javascript` 或 `js`
- ✅ Shell 命令使用 `bash` 或 `sh`
- ✅ 配置文件使用相应的格式（`json`、`yaml` 等）

#### 行号和高亮

```typescript {1,3-5,8}
// 第 1 行
const line1 = 'value';

// 第 3-5 行会高亮
const line3 = 'value';
const line4 = 'value';
const line5 = 'value';

// 第 8 行会高亮
const line8 = 'value';
```

#### 文件名指示

在代码块顶部指定文件名：

**文件路径**: `src/utils/helper.ts`

```typescript
export function helper() {
  return 'helper value';
}
```

### 代码注释规范

#### 单行注释

```typescript
// 这是一个单行注释
const value = 'example';
```

#### 多行注释

```typescript
/**
 * 这是一个多行注释
 * 用于详细说明函数或类的用途
 */
function example() {
  // 实现
}
```

#### TODO 注释

```typescript
// TODO: 添加错误处理
// FIXME: 这里的性能需要优化
// NOTE: 这是一个临时的解决方案
// HACK: 绕过某个限制
```

### 代码块最佳实践

1. **完整性**: 代码示例必须完整可运行
2. **简洁性**: 只包含必要的代码，删除冗余部分
3. **可读性**: 使用有意义的变量名和函数名
4. **注释**: 关键逻辑必须有中文注释
5. **格式化**: 代码必须通过 Prettier 格式化
6. **类型安全**: TypeScript 代码必须通过类型检查
