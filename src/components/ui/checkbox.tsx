import * as React from "react";
import { useId } from "react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function Checkbox({ className = '', checked, onCheckedChange, style, disabled }: CheckboxProps) {
  const id = useId();

  return (
    <>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
      />
      <label
        htmlFor={id}
        className={`h-5 w-5 flex-shrink-0 rounded border flex items-center justify-center cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        style={style}
      >
        {checked && (
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'white', display: 'block' }}>
            <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
          </svg>
        )}
      </label>
    </>
  );
}