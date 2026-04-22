import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[#071952]">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-[#071952] placeholder:text-[#86868b] border border-black/[0.05] focus:outline-none focus:ring-2 focus:ring-[#088395]/30 shadow-sm transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";