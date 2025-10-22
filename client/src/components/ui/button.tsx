import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// Enhanced button variants with Senegalese-inspired design
const getButtonClasses = (variant?: string, size?: string, className?: string) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    destructive: "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl",
    outline: "border-2 border-gray-200 bg-transparent hover:bg-orange-50 hover:border-orange-300 text-gray-700 hover:text-orange-700",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 shadow-sm",
    ghost: "hover:bg-orange-100 text-gray-700 hover:text-orange-700",
    link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700",
    success: "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl",
    warning: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-lg hover:shadow-xl",
  };
  
  const sizeClasses = {
    default: "h-10 px-6 py-2",
    sm: "h-8 px-4 text-sm",
    lg: "h-12 px-8 text-base",
    xl: "h-14 px-10 text-lg",
    icon: "h-10 w-10",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-12 w-12",
  };
  
  return cn(
    baseClasses,
    variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
    sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default,
    className
  );
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning";
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";
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

// Export buttonVariants for compatibility with other components
export const buttonVariants = getButtonClasses;

export { Button };