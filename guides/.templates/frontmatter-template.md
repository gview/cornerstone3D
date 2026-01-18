---
id: document-id
title: 文档标题
category: architecture|getting-started|advanced|examples|troubleshooting
order: 1
description: 文档简短描述，1-2 句话说明
prerequisites: []
estimatedTime: "10 分钟"
difficulty: beginner|intermediate|advanced
tags: ["标签1", "标签2", "标签3"]
---

**使用说明**：

1. **id (必填)**: 文档唯一标识符，使用 kebab-case 格式
   - 示例: `project-setup`, `initialization`, `basic-viewer`
   - 必须在整个指南中唯一

2. **title (必填)**: 文档标题（中文）
   - 示例: `项目初始化`, `Cornerstone3D 初始化`, `基础影像查看器`

3. **category (必填)**: 文档所属分类
   - 可选值: `architecture`, `getting-started`, `advanced`, `examples`, `troubleshooting`

4. **order (必填)**: 同类文档中的顺序号
   - 从 1 开始的整数
   - 用于确定文档在导航中的显示顺序

5. **description (必填)**: 文档简短描述
   - 1-2 句话说明本文档的内容和价值
   - 示例: `如何创建和初始化一个新的 Cornerstone3D 项目`

6. **prerequisites (可选)**: 前置文档 ID 列表
   - 阅读本文档前需要先完成的文档
   - 空数组 `[]` 表示无前置要求
   - 示例: `["project-setup", "initialization"]`

7. **estimatedTime (可选)**: 预计阅读或完成时间
   - 格式: `"[数字] [单位]"`
   - 示例: `"10 分钟"`, `"2 小时"`, `"30 秒"`

8. **difficulty (可选)**: 难度级别
   - 可选值: `beginner`, `intermediate`, `advanced`
   - 默认根据 category 推断

9. **tags (可选)**: 标签列表
   - 用于文档搜索和分类
   - 示例: `["项目", "初始化", "Vite", "React"]`

**完整示例**：

```yaml
---
id: project-setup
title: 项目初始化
category: getting-started
order: 1
description: 如何创建和初始化一个新的 Cornerstone3D 项目
prerequisites: []
estimatedTime: "10 分钟"
difficulty: beginner
tags: ["项目", "初始化", "Vite"]
---
```

**高级示例**（有前置要求）：

```yaml
---
id: first-viewer
title: 第一个影像查看器
category: getting-started
order: 3
description: 创建您的第一个 DICOM 影像查看器应用
prerequisites: ["project-setup", "initialization"]
estimatedTime: "20 分钟"
difficulty: beginner
tags: ["查看器", "DICOM", "影像加载", "StackViewport"]
---
```
