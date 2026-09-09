import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black shadow-[rgba(255,255,255,0.18)_0_0.5px_0_0.5px,rgba(0,0,0,0.35)_0_12px_32px] hover:scale-[0.985] hover:bg-white/92",
        secondary:
          "border border-white/10 bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-sm hover:scale-[0.985] hover:bg-white/[0.14]",
        outline:
          "border border-[rgba(0,153,255,0.2)] bg-[rgba(9,9,9,0.92)] text-white shadow-[0_0_0_1px_rgba(0,153,255,0.15)] hover:scale-[0.985] hover:border-[rgba(0,153,255,0.35)] hover:bg-[rgba(255,255,255,0.06)]",
        ghost: "text-white hover:bg-white/8 hover:text-white",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[rgba(255,255,255,0.08)_0_0.5px_0_0.5px,rgba(0,0,0,0.35)_0_12px_32px] hover:scale-[0.985] hover:bg-destructive/90"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
