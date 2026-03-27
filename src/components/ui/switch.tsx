import * as React from "react";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  className = '',
  onCheckedChange,
  onChange,
  checked = false,
  ...props
}: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    console.log('Switch internal change:', isChecked); // Debug log
    onCheckedChange?.(isChecked);
    onChange?.(e);
  };

  console.log('Switch render - checked:', checked); // Debug log

  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={handleChange}
        {...props}
      />
      <div className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'
        } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'left-4' : 'left-0.5'
          }`}></div>
      </div>
    </label>
  );
}