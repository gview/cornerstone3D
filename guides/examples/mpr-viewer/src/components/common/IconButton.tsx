import React from 'react';

export interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  tooltip?: string;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  badge?: number | string;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  tooltip,
  active = false,
  disabled = false,
  primary = false,
  danger = false,
  badge,
  className = '',
}) => {
  const buttonClass = [
    'icon-button',
    active ? 'active' : '',
    primary ? 'primary' : '',
    danger ? 'danger' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      <span className="icon">{icon}</span>
      {badge !== undefined && badge !== 0 && (
        <span className="badge">{badge}</span>
      )}
    </button>
  );
};

export default IconButton;
