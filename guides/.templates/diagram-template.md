## Mermaid 图表模板

### 支持的图表类型

本指南使用 Mermaid.js 创建以下类型的图表：

#### 1. 流程图 (Flowchart)

用于展示流程、步骤和决策。

```mermaid
flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[操作 1]
    B -->|否| D[操作 2]
    C --> E[结束]
    D --> E
```

**示例：Cornerstone3D 初始化流程**

```mermaid
flowchart TD
    A[开始] --> B[安装依赖]
    B --> C[导入模块]
    C --> D[调用 init]
    D --> E{初始化成功?}
    E -->|是| F[配置渲染引擎]
    E -->|否| G[错误处理]
    F --> H[创建视口]
    G --> I[退出]
    H --> J[加载影像]
    J --> K[完成]
```

#### 2. 序列图 (Sequence Diagram)

用于展示对象之间的交互顺序。

```mermaid
sequenceDiagram
    participant 用户
    participant 应用
    participant Cornerstone3D

    用户->>应用: 加载影像
    应用->>Cornerstone3D: 调用 ImageLoader
    Cornerstone3D-->>应用: 返回影像数据
    应用-->>用户: 显示影像
```

**示例：DICOM 影像加载流程**

```mermaid
sequenceDiagram
    participant User as 用户
    participant App as 应用
    participant Core as @cornerstonejs/core
    participant Loader as ImageLoader
    participant Server as DICOM Server

    User->>App: 请求查看影像
    App->>Core: createAndCacheVolume
    Core->>Loader: loadImage
    Loader->>Server: WADO-RS 请求
    Server-->>Loader: DICOM 数据
    Loader-->>Core: 影像对象
    Core-->>App: Volume ID
    App->>Core: setVolumes
    Core-->>User: 渲染影像
```

#### 3. 类图 (Class Diagram)

用于展示类、接口和它们之间的关系。

```mermaid
classDiagram
    class RenderingEngine {
        +String id
        +Map viewports
        +enableElement()
        +disableElement()
        +destroy()
    }

    class Viewport {
        +String id
        +HTMLElement element
        +Type type
        +render()
        +setProperties()
    }

    class StackViewport {
        +Stack stack
        +getCurrentImageId()
    }

    class VolumeViewport {
        +Volume volume
        +setVolumes()
    }

    RenderingEngine "1" --> "*" Viewport : manages
    Viewport <|-- StackViewport
    Viewport <|-- VolumeViewport
```

#### 4. 状态图 (State Diagram)

用于展示对象的状态转换。

```mermaid
stateDiagram-v2
    [*] --> 未初始化
    未初始化 --> 初始化中: init()
    初始化中 --> 已初始化: 成功
    初始化中 --> 初始化失败: 失败
    已初始化 --> 运行中: enableElement()
    运行中 --> 已销毁: destroy()
    已销毁 --> [*]
```

#### 5. 实体关系图 (ER Diagram)

用于展示数据实体和它们之间的关系。

```mermaid
erDiagram
    Document ||--o{ Section : contains
    Document }o--|| Category : belongs_to
    Section ||--o{ Content : contains
    Content }o--|| ContentType : is_type
```

### 图表使用规范

#### 图表标题和说明

每个图表都应该有：

```mermaid
flowchart TD
    A[图表标题]
    A[图表说明]
```

**示例**：

```mermaid
flowchart TD
    Title[Cornerstone3D 架构概览]
    Title[展示核心组件之间的关系]

    Core[Core<br/>核心库]
    Tools[Tools<br/>工具库]
    DICOM[DICOM Loader<br/>加载器]

    Core --> Tools
    Core --> DICOM
```

#### 图表样式

##### 主题样式

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#ffcc00'}}}%%
flowchart TD
    A[主题示例]
```

##### 节点样式

```mermaid
flowchart TD
    A[普通节点]
    B["圆角节点"]
    C[(数据库)]
    D[[形状]]
    E>/>不对称]
```

##### 箭头样式

```mermaid
flowchart LR
    A -->|普通箭头| B
    A -.->|虚线箭头| C
    A ==>|粗箭头| D
```

### 图表最佳实践

#### 1. 简洁性

- ✅ 保持图表简洁，避免过度复杂
- ✅ 只包含必要的节点和关系
- ✅ 使用有意义的节点名称

#### 2. 可读性

- ✅ 节点名称使用中文
- ✅ 合理使用颜色区分不同类型的节点
- ✅ 避免箭头交叉和混乱

#### 3. 一致性

- ✅ 相同类型的图表使用一致的样式
- ✅ 相同概念使用相同的颜色
- ✅ 遵循统一的命名规范

#### 4. 实用性

- ✅ 图表应该帮助理解复杂概念
- ✅ 专注于关键信息
- ✅ 避免不必要的细节

### 图表嵌入示例

#### 在文档中嵌入

```markdown
## 架构概览

Cornerstone3D 的核心架构如下：

```mermaid
flowchart TD
    Core[Core 核心库]
    Tools[Tools 工具库]
    Loader[Loader 加载器]

    Core --> Tools
    Core --> Loader
```

上图展示了核心组件之间的关系。
```

#### 图表说明

每个图表后都应该有文字说明：

```markdown
## 初始化流程

```mermaid
flowchart TD
    A[开始] --> B[初始化]
    B --> C{成功?}
    C -->|是| D[继续]
    C -->|否| E[报错]
```

**流程说明**：

1. **开始**: 应用启动
2. **初始化**: 调用 `init()` 函数
3. **判断**: 检查是否成功
4. **成功**: 继续执行后续逻辑
5. **失败**: 显示错误信息并退出
```

### 常见图表场景

#### 1. 架构图

展示系统组件和它们的关系。

#### 2. 流程图

展示操作步骤和决策流程。

#### 3. 时序图

展示对象之间的交互顺序。

#### 4. 状态图

展示对象的生命周期和状态转换。

### 参考资源

- [Mermaid 官方文档](https://mermaid.js.org/)
- [Mermaid 语法指南](https://mermaid.js.org/syntax/flowchart.html)
- [Mermaid 在线编辑器](https://mermaid.live/)
