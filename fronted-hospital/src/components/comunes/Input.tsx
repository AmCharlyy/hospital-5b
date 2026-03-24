import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.05] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
