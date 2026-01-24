import React from 'react';
import { IconButton, DropdownButton } from './common';
import SplitButton from './common/SplitButton';
import { ToolsPanel, ViewControlPanel, EnhancedLayoutPanel } from './panels';
import type { ViewportLayout } from './panels';
import './common/IconButton.css';
import './common/DropdownButton.css';
import './common/SplitButton.css';

export interface ToolbarProps {
  // 文件操作
  onLoadFiles: () => void;

  // 布局切换
  currentLayout: ViewportLayout;
  onLayoutChange: (layout: ViewportLayout) => void;

  // 工具选择
  activeTool: string;
  toolModes: Record<string, string>;
  onToolChange: (toolName: string) => void;
  onToolModeChange: (toolName: string, mode: string) => void;
  onToggleCrosshairs: () => void;
  showCrosshairs: boolean;
  viewportCount?: number; // 视口数量
  onToggleWindowLevel: () => void;
  isWindowLevelActive: boolean;

  // 视图控制
  onRotate: (angle: number, axis: 'x' | 'y' | 'z') => void;
  onResetRotation: () => void;
  slabThickness: number;
  onSlabThicknessChange: (value: number) => void;
  slabMode: 'max' | 'min' | 'avg';
  onSlabModeChange: (mode: 'max' | 'min' | 'avg') => void;

  // 比例尺
  showScale: boolean;
  scaleLocation: 'top' | 'bottom' | 'left' | 'right';
  onToggleScale: () => void;
  onScaleLocationChange: (location: 'top' | 'bottom' | 'left' | 'right') => void;

  // 测量
  onDeleteSelected: () => void;

  // 序列面板
  seriesCount: number;
  showSeriesPanel: boolean;
  onToggleSeriesPanel: () => void;

  // 测量面板
  showAnnotationsPanel: boolean;
  onToggleAnnotationsPanel: () => void;

  // 通用状态
  hasVolume: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onLoadFiles,
  currentLayout,
  onLayoutChange,
  activeTool,
  toolModes,
  onToolChange,
  onToolModeChange,
  onToggleCrosshairs,
  showCrosshairs,
  viewportCount = 1,
  onRotate,
  onResetRotation,
  slabThickness,
  onSlabThicknessChange,
  slabMode,
  onSlabModeChange,
  showScale,
  scaleLocation,
  onToggleScale,
  onScaleLocationChange,
  onDeleteSelected,
  seriesCount,
  showSeriesPanel,
  onToggleSeriesPanel,
  showAnnotationsPanel,
  onToggleAnnotationsPanel,
  hasVolume,
  onToggleWindowLevel,
  isWindowLevelActive,
}) => {
  // 工具配置
  const allTools = [
    { name: 'Length', icon: '📏', label: '长度测量' },
    { name: 'Angle', icon: '📐', label: '角度测量' },
    { name: 'Bidirectional', icon: '✛', label: '双向测量' },
    { name: 'Probe', icon: '🔍', label: '探针' },
    { name: 'RectangleROI', icon: '⬜', label: '矩形 ROI' },
    { name: 'EllipticalROI', icon: '⭕', label: '椭圆 ROI' },
  ];

  const toolIcons: Record<string, string> = {
    Length: '📏',
    Angle: '📐',
    Bidirectional: '✛',
    Probe: '🔍',
    RectangleROI: '⬜',
    EllipticalROI: '⭕',
  };

  const toolLabels: Record<string, string> = {
    Length: '长度测量',
    Angle: '角度测量',
    Bidirectional: '双向测量',
    Probe: '探针',
    RectangleROI: '矩形 ROI',
    EllipticalROI: '椭圆 ROI',
  };

  // 当前工具的图标和提示
  const currentToolIcon = toolIcons[activeTool] || '📏';
  const currentToolLabel = toolLabels[activeTool] || activeTool;

  // 下拉面板状态
  const [toolsPanelOpen, setToolsPanelOpen] = React.useState(false);
  const [layoutPanelOpen, setLayoutPanelOpen] = React.useState(false);
  const [measurementMenuOpen, setMeasurementMenuOpen] = React.useState(false);

  // 包装工具切换函数，选中后关闭面板
  const handleToolChange = (toolName: string) => {
    onToolChange(toolName);
    setToolsPanelOpen(false);
  };

  // 处理布局切换
  const handleLayoutChange = (layout: ViewportLayout) => {
    onLayoutChange(layout);
    setLayoutPanelOpen(false);
  };

  // 构建测量工具菜单项
  const measurementMenuItems = React.useMemo(() => {
    return allTools.map(tool => ({
      id: tool.name,
      icon: tool.icon,
      label: tool.label,
      active: activeTool === tool.name && !showCrosshairs && !isWindowLevelActive,
      onClick: () => onToolChange(tool.name),
    }));
  }, [activeTool, onToolChange, showCrosshairs, isWindowLevelActive]);

  // 获取当前激活的测量工具
  const activeMeasurementTool = React.useMemo(() => {
    // 只有当没有激活十字线或窗宽窗位时，才显示测量工具为激活
    if (showCrosshairs || isWindowLevelActive) {
      // 返回第一个工具但不激活
      return {
        ...measurementMenuItems[0],
        active: false,
      };
    }
    return measurementMenuItems.find(item => item.active) || measurementMenuItems[0];
  }, [measurementMenuItems, showCrosshairs, isWindowLevelActive]);

  // 主按钮点击 - 激活当前测量工具
  const handleMeasurementPrimaryClick = () => {
    onToolChange(activeMeasurementTool.id);
  };

  return (
    <div className="toolbar-compact">
      {/* 文件操作组 */}
      <div className="toolbar-group">
        <IconButton
          icon="📁"
          onClick={onLoadFiles}
          tooltip="加载 DICOM 文件"
          primary
        />
        {seriesCount > 0 && (
          <IconButton
            icon="📚"
            onClick={onToggleSeriesPanel}
            tooltip={showSeriesPanel ? '隐藏序列面板' : '显示序列面板'}
            active={showSeriesPanel}
            badge={seriesCount}
          />
        )}
        {hasVolume && (
          <IconButton
            icon="📏"
            onClick={onToggleAnnotationsPanel}
            tooltip={showAnnotationsPanel ? '隐藏测量面板' : '显示测量面板'}
            active={showAnnotationsPanel}
          />
        )}
      </div>

      {/* 布局切换组 */}
      <div className="toolbar-group">
        <DropdownButton
          icon="▦"
          tooltip="切换视口布局"
          disabled={!hasVolume}
          isOpen={layoutPanelOpen}
          onOpen={() => setLayoutPanelOpen(true)}
          onClose={() => setLayoutPanelOpen(false)}
        >
          <EnhancedLayoutPanel
            isOpen={layoutPanelOpen}
            onClose={() => setLayoutPanelOpen(false)}
            currentLayout={currentLayout}
            onLayoutChange={handleLayoutChange}
          />
        </DropdownButton>
      </div>

      {/* 十字线和窗宽窗位控制组 */}
      <div className="toolbar-group">
        <IconButton
          icon="🎯"
          onClick={onToggleCrosshairs}
          tooltip={showCrosshairs ? '隐藏十字线' : '显示十字线'}
          active={showCrosshairs}
          disabled={!hasVolume || viewportCount < 3}
        />
        <IconButton
          icon="🎨"
          onClick={onToggleWindowLevel}
          tooltip={isWindowLevelActive ? '退出窗宽窗位调节' : '窗宽窗位调节'}
          active={isWindowLevelActive}
          disabled={!hasVolume}
        />
      </div>

      {/* 测量工具组 */}
      <div className="toolbar-group">
        <SplitButton
          icon={activeMeasurementTool.icon}
          tooltip={activeMeasurementTool.label}
          active={activeMeasurementTool.active}
          disabled={!hasVolume}
          onPrimaryClick={handleMeasurementPrimaryClick}
          menuItems={measurementMenuItems}
          isOpen={measurementMenuOpen}
          onToggleMenu={setMeasurementMenuOpen}
        />
      </div>

      {/* 工具设置组 */}
      <div className="toolbar-group">
        <DropdownButton
          icon="⚙️"
          tooltip="工具设置"
          disabled={!hasVolume}
          isOpen={toolsPanelOpen}
          onOpen={() => setToolsPanelOpen(true)}
          onClose={() => setToolsPanelOpen(false)}
        >
          <ToolsPanel
            activeTool={activeTool}
            toolModes={toolModes}
            onToolModeChange={onToolModeChange}
            onDeleteSelected={onDeleteSelected}
            hasVolume={hasVolume}
          />
        </DropdownButton>
      </div>

      {/* 视图控制组 */}
      <div className="toolbar-group">
        <IconButton
          icon="↻"
          onClick={() => onRotate(-15, 'z')}
          tooltip="向右旋转"
          disabled={!hasVolume}
        />
        <IconButton
          icon="🔄"
          onClick={onResetRotation}
          tooltip="重置旋转"
          disabled={!hasVolume}
        />
        <DropdownButton
          icon="⚙️"
          tooltip="视图设置"
          disabled={!hasVolume}
        >
          <ViewControlPanel
            onRotate={onRotate}
            onResetRotation={onResetRotation}
            slabThickness={slabThickness}
            onSlabThicknessChange={onSlabThicknessChange}
            slabMode={slabMode}
            onSlabModeChange={onSlabModeChange}
            showScale={showScale}
            scaleLocation={scaleLocation}
            onToggleScale={onToggleScale}
            onScaleLocationChange={onScaleLocationChange}
            hasVolume={hasVolume}
          />
        </DropdownButton>
      </div>

      <style>{`
        .toolbar-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          height: 52px;
          overflow-x: auto;
          flex-shrink: 0;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-right: 12px;
          border-right: 1px solid #3e3e42;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .info-badge {
          padding: 4px 8px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          font-size: 11px;
          color: #858585;
          white-space: nowrap;
        }

        /* 滚动条样式 */
        .toolbar-compact::-webkit-scrollbar {
          height: 6px;
        }

        .toolbar-compact::-webkit-scrollbar-track {
          background: #2d2d30;
        }

        .toolbar-compact::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 3px;
        }

        .toolbar-compact::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style>
    </div>
  );
};

export default Toolbar;
