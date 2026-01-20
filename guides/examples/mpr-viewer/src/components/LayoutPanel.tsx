import React from 'react';

export type ViewportLayout =
  | 'mpr'           // 标准MPR三视图
  | 'advanced'      // 高级视图
  | '3d-four-up'    // 3D四视图
  | '3d-main'       // 3D主视图
  | 'axial-primary' // 轴位主视图
  | '3d-only'       // 仅3D视图
  | '3d-primary'    // 3D为主
  | 'frame-view';   // 帧视图

interface LayoutOption {
  id: ViewportLayout;
  name: string;
  category: 'Common' | 'Advanced' | 'MPR' | '3D';
  icon?: string;
}

interface LayoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: ViewportLayout;
  onLayoutChange: (layout: ViewportLayout) => void;
}

// 布局选项配置
const layoutOptions: LayoutOption[] = [
  // Common 布局
  {
    id: 'mpr',
    name: 'MPR',
    category: 'Common',
    icon: '▦',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    category: 'Common',
    icon: '▥',
  },
  {
    id: '3d-four-up',
    name: '3D Four Up',
    category: 'Common',
    icon: '▤',
  },
  {
    id: '3d-main',
    name: '3D Main',
    category: 'Common',
    icon: '◫',
  },

  // Advanced 布局
  {
    id: 'axial-primary',
    name: 'Axial Primary',
    category: 'Advanced',
    icon: '◪',
  },
  {
    id: '3d-only',
    name: '3D Only',
    category: 'Advanced',
    icon: '◩',
  },

  // MPR 布局
  {
    id: '3d-primary',
    name: '3D Primary',
    category: 'MPR',
    icon: '⛶',
  },

  // 3D 布局
  {
    id: 'frame-view',
    name: 'Frame View',
    category: '3D',
    icon: '⛷',
  },
];

const LayoutPanel: React.FC<LayoutPanelProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onLayoutChange,
}) => {
  if (!isOpen) return null;

  // 按分类分组布局选项
  const categories: Array<{ category: LayoutOption['category']; options: LayoutOption[] }> = [];
  const categoryMap = new Map<LayoutOption['category'], LayoutOption[]>();

  layoutOptions.forEach((option) => {
    if (!categoryMap.has(option.category)) {
      categoryMap.set(option.category, []);
    }
    categoryMap.get(option.category)!.push(option);
  });

  categoryMap.forEach((options, category) => {
    categories.push({ category, options });
  });

  return (
    <div className="layout-panel-overlay" onClick={onClose}>
      <div className="layout-panel" onClick={(e) => e.stopPropagation()}>
        {/* 面板头部 */}
        <div className="layout-panel-header">
          <h3>视口布局</h3>
          <button
            onClick={onClose}
            className="close-button"
            title="关闭面板"
          >
            ✕
          </button>
        </div>

        {/* 布局选项列表 */}
        <div className="layout-panel-content">
          {categories.map(({ category, options }) => (
            <div key={category} className="layout-category">
              <h4 className="category-title">{category}</h4>
              <div className="layout-options">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => onLayoutChange(option.id)}
                    className={`layout-option ${currentLayout === option.id ? 'active' : ''}`}
                    title={option.name}
                  >
                    <span className="layout-icon">{option.icon}</span>
                    <span className="layout-name">{option.name}</span>
                    {currentLayout === option.id && (
                      <span className="layout-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .layout-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 10000;
          padding-top: 50px;
        }

        .layout-panel {
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          width: 90%;
          max-width: 400px;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .layout-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
        }

        .layout-panel-header h3 {
          margin: 0;
          font-size: 14px;
          color: #cccccc;
          font-weight: 500;
        }

        .close-button {
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: #cccccc;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-button:hover {
          opacity: 1;
          background: #3e3e42;
        }

        .layout-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .layout-category {
          margin-bottom: 20px;
        }

        .layout-category:last-child {
          margin-bottom: 0;
        }

        .category-title {
          font-size: 11px;
          color: #858585;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
          padding-bottom: 4px;
          border-bottom: 1px solid #3e3e42;
        }

        .layout-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 8px;
        }

        .layout-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #cccccc;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          text-align: left;
        }

        .layout-option:hover {
          background: #37373d;
          border-color: #007acc;
        }

        .layout-option.active {
          background: #007acc;
          border-color: #007acc;
          color: #ffffff;
        }

        .layout-icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .layout-name {
          flex: 1;
          font-weight: 400;
        }

        .layout-check {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 10px;
          opacity: 0.8;
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
      `}</style>
    </div>
  );
};

export default LayoutPanel;
export type { ViewportLayout };
