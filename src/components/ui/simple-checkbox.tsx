import * as React from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className = '', onCheckedChange, onChange, style, ...props }: CheckboxProps & { style?: React.CSSProperties }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  return (
    <div className="relative">
      <input
        type="checkbox"
        className={`peer h-4 w-4 shrink-0 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${className}`}
        style={style}
        onChange={handleChange}
        {...props}
      />
      <svg
        className="absolute inset-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );
}