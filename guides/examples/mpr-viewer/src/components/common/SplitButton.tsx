import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './SplitButton.css';

export interface SplitButtonProps {
  /** 主按钮图标 */
  icon: string;
  /** 主按钮提示文本 */
  tooltip: string;
  /** 主按钮是否激活 */
  active?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击主按钮的回调 */
  onPrimaryClick: () => void;
  /** 下拉菜单项列表 */
  menuItems: Array<{
    id: string;
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }>;
  /** 下拉菜单是否打开 */
  isOpen?: boolean;
  /** 下拉菜单打开/关闭回调 */
  onToggleMenu: (open: boolean) => void;
}

const SplitButton: React.FC<SplitButtonProps> = ({
  icon,
  tooltip,
  active = false,
  disabled = false,
  onPrimaryClick,
  menuItems,
  isOpen = false,
  onToggleMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在按钮容器内
      const clickedInsideButton = containerRef.current &&
        containerRef.current.contains(event.target as Node);

      // 检查点击是否在菜单内
      const clickedInsideMenu = menuRef.current &&
        menuRef.current.contains(event.target as Node);

      // 如果点击既不在按钮内也不在菜单内，则关闭菜单
      if (isOpen && !clickedInsideButton && !clickedInsideMenu) {
        onToggleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggleMenu]);

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && dropdownButtonRef.current) {
      const buttonRect = dropdownButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        position: 'fixed',
        top: buttonRect.bottom + 4,
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, [isOpen]);

  const handleMenuClick = (item: typeof menuItems[0]) => {
    item.onClick();
    onToggleMenu(false);
  };

  return (
    <>
      <div className="split-button-container" ref={containerRef}>
        {/* 主按钮 */}
        <button
          className={`split-button-primary ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={onPrimaryClick}
          disabled={disabled}
          title={tooltip}
        >
          <span className="split-button-icon">{icon}</span>
        </button>

        {/* 分隔符 */}
        <div className={`split-button-divider ${active ? 'opacity-0' : 'opacity-100'}`} />

        {/* 下拉按钮 */}
        <button
          ref={dropdownButtonRef}
          className={`split-button-dropdown ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMenu(!isOpen);
          }}
          disabled={disabled}
          title="更多选项"
        >
          <span className="split-button-arrow">▼</span>
        </button>
      </div>

      {/* 下拉菜单通过 Portal 渲染到 body */}
      {isOpen && createPortal(
        <div ref={menuRef} className="split-button-menu" style={menuPosition}>
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`split-button-menu-item ${item.active ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
              title={item.label}
            >
              <span className="menu-item-icon">{item.icon}</span>
              <span className="menu-item-label">{item.label}</span>
              {item.active && <span className="menu-item-check">✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default SplitButton;
