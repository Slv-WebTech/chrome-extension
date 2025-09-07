import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ 
  className = '', 
  variant = 'default', 
  size = 'default', 
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500",
    ghost: "hover:bg-gray-100 focus-visible:ring-gray-500",
    link: "text-blue-500 underline-offset-4 hover:underline focus-visible:ring-blue-500"
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3",
    lg: "h-10 rounded-md px-6",
    icon: "h-9 w-9"
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export const buttonVariants = Button;