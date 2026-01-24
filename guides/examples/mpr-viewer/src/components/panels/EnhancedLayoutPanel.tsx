import React, { useState } from 'react';

export type ViewportLayout =
  | 'grid-1x1'
  | 'grid-1x2'
  | 'grid-2x1'
  | 'grid-2x2'
  | 'grid-3x1'
  | 'grid-1x3'
  | 'grid-3x2'
  | 'grid-2x3'
  | 'grid-3x3'
  | 'grid-1-2'
  | 'dual-mpr'
  | 'mpr'
  | 'advanced'
  | '3d-four-up'
  | '3d-main'
  | 'axial-primary'
  | '3d-only'
  | '3d-primary'
  | 'frame-view';

interface GridLayoutOption {
  id: ViewportLayout;
  name: string;
  icon: string;
  rows: number;
  cols: number;
  category: 'Grid';
}

interface ProtocolLayoutOption {
  id: ViewportLayout;
  name: string;
  icon: string;
  category: 'Protocol';
  description?: string;
}

type LayoutOption = GridLayoutOption | ProtocolLayoutOption;

interface EnhancedLayoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: ViewportLayout;
  onLayoutChange: (layout: ViewportLayout) => void;
}

// 网格布局配置
const gridLayouts: GridLayoutOption[] = [
  { id: 'grid-1x1', name: '1×1 单视图', icon: '◻', rows: 1, cols: 1, category: 'Grid' },
  { id: 'grid-1x2', name: '1×2 横向', icon: '▬', rows: 1, cols: 2, category: 'Grid' },
  { id: 'grid-2x1', name: '2×1 纵向', icon: '▮', rows: 2, cols: 1, category: 'Grid' },
  { id: 'grid-2x2', name: '2×2 四视图', icon: '▦', rows: 2, cols: 2, category: 'Grid' },
  { id: 'grid-3x1', name: '3×1 纵向', icon: '▯', rows: 3, cols: 1, category: 'Grid' },
  { id: 'grid-1x3', name: '1×3 横向', icon: '▭', rows: 1, cols: 3, category: 'Grid' },
  { id: 'grid-1-2', name: '1|2 主副视图', icon: '▰', rows: 2, cols: 2, category: 'Grid' },
  { id: 'grid-3x2', name: '3×2 六视图', icon: '▲', rows: 3, cols: 2, category: 'Grid' },
  { id: 'grid-2x3', name: '2×3 六视图', icon: '▶', rows: 2, cols: 3, category: 'Grid' },
  { id: 'grid-3x3', name: '3×3 九视图', icon: '▣', rows: 3, cols: 3, category: 'Grid' },
];

// 双序列 MPR 布局配置
const dualSequenceLayouts: ProtocolLayoutOption[] = [
  {
    id: 'dual-mpr',
    name: '双序列 MPR',
    icon: '🔷🔷',
    description: '两行三视图，每行显示不同序列的 MPR',
    category: 'Protocol',
  },
];

// 协议布局配置
const protocolLayouts: ProtocolLayoutOption[] = [
  {
    id: 'mpr',
    name: 'MPR 三视图',
    icon: '🔷',
    description: '轴向、冠状、矢状三视图',
    category: 'Protocol',
  },
  {
    id: '3d-four-up',
    name: '3D 四视图',
    icon: '🔶',
    description: '3D 主视图 + 三平面视图',
    category: 'Protocol',
  },
  {
    id: '3d-main',
    name: '3D 主视图',
    icon: '🔸',
    description: '3D 主视图 + 辅助视图',
    category: 'Protocol',
  },
  {
    id: 'axial-primary',
    name: '轴位主视图',
    icon: '🔹',
    description: '以轴位为主的多视图',
    category: 'Protocol',
  },
  {
    id: '3d-only',
    name: '仅 3D',
    icon: '🔺',
    description: '纯 3D 渲染视图',
    category: 'Protocol',
  },
  {
    id: '3d-primary',
    name: '3D 为主',
    icon: '🔻',
    description: '3D 视图为主的多视图',
    category: 'Protocol',
  },
  {
    id: 'frame-view',
    name: '帧视图',
    icon: '⬡',
    description: '逐帧显示模式',
    category: 'Protocol',
  },
  {
    id: 'advanced',
    name: '高级视图',
    icon: '⬢',
    description: '自定义高级配置',
    category: 'Protocol',
  },
];

// 自定义网格选择器组件
interface GridLayoutSelectorProps {
  currentLayout: ViewportLayout;
  onLayoutSelect: (layout: ViewportLayout) => void;
}

const GridLayoutSelector: React.FC<GridLayoutSelectorProps> = ({
  currentLayout,
  onLayoutSelect,
}) => {
  console.log('🔧 GridLayoutSelector 渲染，当前布局:', currentLayout);

  const handleLayoutClick = (layoutId: ViewportLayout) => {
    console.log('🔘 网格布局按钮被点击:', layoutId);
    onLayoutSelect(layoutId);
  };

  return (
    <div className="grid-layout-selector">
      <div className="grid-layouts-grid">
        {gridLayouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => handleLayoutClick(layout.id)}
            className={`grid-layout-item ${
              currentLayout === layout.id ? 'active' : ''
            }`}
            title={layout.name}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="layout-icon-container">
              <span className="layout-icon">{layout.icon}</span>
            </div>
            <div className="layout-info">
              <span className="layout-name">{layout.name}</span>
              <span className="layout-size">
                {layout.rows}×{layout.cols}
              </span>
            </div>
            {currentLayout === layout.id && (
              <div className="layout-check">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// 协议布局选择器组件
interface ProtocolLayoutSelectorProps {
  currentLayout: ViewportLayout;
  onLayoutSelect: (layout: ViewportLayout) => void;
}

const ProtocolLayoutSelector: React.FC<ProtocolLayoutSelectorProps> = ({
  currentLayout,
  onLayoutSelect,
}) => {
  console.log('🔧 ProtocolLayoutSelector 渲染，当前布局:', currentLayout);

  const handleLayoutClick = (layoutId: ViewportLayout) => {
    console.log('🔘 协议布局按钮被点击:', layoutId);
    onLayoutSelect(layoutId);
  };

  return (
    <div className="protocol-layout-selector">
      <div className="protocol-layouts-list">
        {protocolLayouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => handleLayoutClick(layout.id)}
            className={`protocol-layout-item ${
              currentLayout === layout.id ? 'active' : ''
            }`}
            title={layout.description}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="protocol-icon">{layout.icon}</div>
            <div className="protocol-info">
              <div className="protocol-name">{layout.name}</div>
              {layout.description && (
                <div className="protocol-description">{layout.description}</div>
              )}
            </div>
            {currentLayout === layout.id && (
              <div className="protocol-check">✓</div>
            )}
          </button>
        ))}
        {dualSequenceLayouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => handleLayoutClick(layout.id)}
            className={`protocol-layout-item ${
              currentLayout === layout.id ? 'active' : ''
            }`}
            title={layout.description}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="protocol-icon">{layout.icon}</div>
            <div className="protocol-info">
              <div className="protocol-name">{layout.name}</div>
              {layout.description && (
                <div className="protocol-description">{layout.description}</div>
              )}
            </div>
            {currentLayout === layout.id && (
              <div className="protocol-check">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Tab 切换组件
interface Tab {
  id: 'grid' | 'protocol';
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'grid', label: '网格布局', icon: '▦' },
  { id: 'protocol', label: '协议布局', icon: '🔷' },
];

const EnhancedLayoutPanel: React.FC<EnhancedLayoutPanelProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onLayoutChange,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'protocol'>('grid');

  console.log('🔧 EnhancedLayoutPanel 渲染，isOpen:', isOpen, 'currentLayout:', currentLayout, 'activeTab:', activeTab);

  // ❌ 移除这段代码：它会根据当前布局强制切换 Tab
  // 这导致用户点击 Tab 后立即被切换回去
  //
  // const currentLayoutType = currentLayout.startsWith('grid-') ? 'grid' : 'protocol';
  // if (currentLayoutType !== activeTab) {
  //   setActiveTab(currentLayoutType);
  // }

  if (!isOpen) return null;

  return (
    <div className="layout-panel-overlay" onClick={onClose} style={{ pointerEvents: 'auto' }}>
      <div className="layout-panel" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
        {/* 面板头部 */}
        <div className="layout-panel-header">
          <div className="header-title">
            <span className="header-icon">▦</span>
            <h3>视口布局</h3>
          </div>
          <button
            onClick={onClose}
            className="close-button"
            title="关闭面板"
          >
            ✕
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="layout-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log('🔘 Tab按钮被点击:', tab.id);
                setActiveTab(tab.id);
              }}
              className={`layout-tab ${activeTab === tab.id ? 'active' : ''}`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="layout-panel-content" style={{ pointerEvents: 'auto' }}>
          {activeTab === 'grid' ? (
            <GridLayoutSelector
              currentLayout={currentLayout}
              onLayoutSelect={onLayoutChange}
            />
          ) : (
            <ProtocolLayoutSelector
              currentLayout={currentLayout}
              onLayoutSelect={onLayoutChange}
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className="layout-panel-footer">
          <div className="footer-tip">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              {activeTab === 'grid'
                ? '网格布局: 自定义行列排列的视口'
                : '协议布局: 预定义的专业医学图像视图'}
            </span>
          </div>
        </div>

        <style>{`
          .layout-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .layout-panel {
            background: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 12px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
            width: 90%;
            max-width: 640px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .layout-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: #2d2d30;
            border-bottom: 1px solid #3e3e42;
          }

          .header-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .header-icon {
            font-size: 20px;
            line-height: 1;
          }

          .header-title h3 {
            margin: 0;
            font-size: 16px;
            color: #cccccc;
            font-weight: 600;
          }

          .close-button {
            width: 32px;
            height: 32px;
            background: none;
            border: none;
            color: #cccccc;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            opacity: 0.7;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
          }

          .close-button:hover {
            opacity: 1;
            background: #3e3e42;
          }

          .layout-tabs {
            display: flex;
            gap: 2px;
            padding: 8px 16px 0;
            background: #252526;
            border-bottom: 1px solid #3e3e42;
          }

          .layout-tab {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: #858585;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .layout-tab:hover {
            color: #cccccc;
            background: #2d2d30;
          }

          .layout-tab.active {
            color: #007acc;
            border-bottom-color: #007acc;
          }

          .tab-icon {
            font-size: 16px;
          }

          .layout-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #1e1e1e;
          }

          /* 网格布局选择器 */
          .grid-layouts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
          }

          .grid-layout-item {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 16px 12px;
            background: #2d2d30;
            border: 2px solid #3e3e42;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .grid-layout-item:hover {
            background: #37373d;
            border-color: #007acc;
            transform: translateY(-2px);
          }

          .grid-layout-item.active {
            background: #007acc;
            border-color: #007acc;
          }

          .layout-icon-container {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1e1e1e;
            border-radius: 8px;
          }

          .layout-icon {
            font-size: 28px;
            line-height: 1;
          }

          .layout-info {
            display: flex;
            flex-direction: column;
    align-items: center;
            gap: 2px;
            text-align: center;
          }

          .layout-name {
            font-size: 12px;
            color: #cccccc;
            font-weight: 500;
          }

          .grid-layout-item.active .layout-name {
            color: #ffffff;
          }

          .layout-size {
            font-size: 11px;
            color: #858585;
          }

          .grid-layout-item.active .layout-size {
            color: rgba(255, 255, 255, 0.8);
          }

          .layout-check {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #ffffff;
          }

          /* 协议布局选择器 */
          .protocol-layouts-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .protocol-layout-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: #2d2d30;
            border: 2px solid #3e3e42;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
          }

          .protocol-layout-item:hover {
            background: #37373d;
            border-color: #007acc;
          }

          .protocol-layout-item.active {
            background: #007acc;
            border-color: #007acc;
          }

          .protocol-icon {
            font-size: 24px;
            line-height: 1;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1e1e1e;
            border-radius: 8px;
            flex-shrink: 0;
          }

          .protocol-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .protocol-name {
            font-size: 14px;
            color: #cccccc;
            font-weight: 600;
          }

          .protocol-layout-item.active .protocol-name {
            color: #ffffff;
          }

          .protocol-description {
            font-size: 12px;
            color: #858585;
          }

          .protocol-layout-item.active .protocol-description {
            color: rgba(255, 255, 255, 0.8);
          }

          .protocol-check {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 14px;
            color: #ffffff;
          }

          /* 底部提示 */
          .layout-panel-footer {
            padding: 12px 20px;
            background: #2d2d30;
            border-top: 1px solid #3e3e42;
          }

          .footer-tip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #3c3c3c;
            border-radius: 6px;
          }

          .tip-icon {
            font-size: 16px;
          }

          .tip-text {
            font-size: 12px;
            color: #858585;
          }

          /* 滚动条样式 */
          .layout-panel-content::-webkit-scrollbar {
            width: 10px;
          }

          .layout-panel-content::-webkit-scrollbar-track {
            background: #1e1e1e;
          }

          .layout-panel-content::-webkit-scrollbar-thumb {
            background: #424242;
            border-radius: 5px;
            border: 2px solid #1e1e1e;
          }

          .layout-panel-content::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
          }

          /* 响应式设计 */
          @media (max-width: 640px) {
            .layout-panel {
              width: 95%;
              max-height: 85vh;
            }

            .grid-layouts-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 8px;
            }

            .grid-layout-item {
              padding: 12px 8px;
            }

            .layout-icon-container {
              width: 40px;
              height: 40px;
            }

            .layout-icon {
              font-size: 24px;
            }

            .layout-panel-content {
              padding: 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EnhancedLayoutPanel;
export type { ViewportLayout };
