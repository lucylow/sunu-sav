import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

// Simplified button variants without class-variance-authority
const getButtonClasses = (variant?: string, size?: string, className?: string) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "hover:bg-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline",
  };
  
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-10 px-6",
    icon: "h-9 w-9",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-10 w-10",
  };
  
  return cn(
    baseClasses,
    variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default,
    className
  );
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={getButtonClasses(variant, size, className)}
      {...props}
    />
  );
}

export { Button };
