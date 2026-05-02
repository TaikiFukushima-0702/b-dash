import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
