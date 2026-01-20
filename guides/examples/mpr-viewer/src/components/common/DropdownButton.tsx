import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownButtonProps {
  icon: string;
  tooltip?: string;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  isOpen?: boolean; // 支持受控模式
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  icon,
  tooltip,
  disabled = false,
  active = false,
  children,
  className = '',
  onOpen,
  onClose,
  isOpen: controlledIsOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 使用受控或非受控模式
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleDropdown = () => {
    if (disabled) return;

    const newState = !isOpen;

    // 更新状态（非受控模式）
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newState);
    }

    // 触发回调
    if (newState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const closeDropdown = () => {
    // 更新状态（非受控模式）
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(false);
    }

    // 触发回调
    onClose?.();
  };

  // 点击外部区域关闭下拉面板
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 计算 Dropdown 面板的位置
  const getPanelStyle = (): React.CSSProperties => {
    if (!buttonRef.current) {
      return {};
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: buttonRect.bottom + 4,
      left: buttonRect.left,
    };
  };

  const buttonClass = [
    'icon-button',
    isOpen ? 'active' : '',
    active ? 'active' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        ref={buttonRef}
        className={buttonClass}
        onClick={toggleDropdown}
        disabled={disabled}
        title={tooltip}
      >
        <span className="icon">{icon}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && createPortal(
        <div ref={panelRef} className="dropdown-panel" style={getPanelStyle()}>
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

export default DropdownButton;
