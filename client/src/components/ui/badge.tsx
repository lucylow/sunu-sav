import * as React from "react"

import { cn } from "@/lib/utils"

// Simplified badge variants without class-variance-authority
const getBadgeClasses = (variant?: string, className?: string) => {
  const baseClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variantClasses = {
    default: "border-transparent bg-blue-600 text-white",
    secondary: "border-transparent bg-gray-200 text-gray-900",
    destructive: "border-transparent bg-red-600 text-white",
    outline: "text-gray-900 border-gray-300",
  };
  
  return cn(
    baseClasses,
    variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
    className
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={getBadgeClasses(variant, className)} {...props} />
  )
}

export { Badge };
