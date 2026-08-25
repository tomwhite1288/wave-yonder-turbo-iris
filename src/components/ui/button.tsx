import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg hover:opacity-90",
        secondary: "bg-elevated text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        ghost: "text-fg hover:bg-elevated",
        outline: "border border-border bg-transparent text-fg hover:bg-elevated",
        danger: "bg-danger text-fg hover:opacity-90",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
