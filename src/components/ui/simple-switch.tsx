import * as React from "react";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ className = '', onCheckedChange, onChange, ...props }: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        onChange={handleChange}
        {...props}
      />
      <div className="relative h-5 w-9 rounded-full bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 peer-checked:bg-blue-500 transition-colors">
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm"></div>
      </div>
    </label>
  );
}