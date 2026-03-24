import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ label, className, children, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-[#1d1d1f]">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-[#1d1d1f] border border-black/[0.05] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all appearance-none pr-10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
      </div>
    </div>
  );
});

Select.displayName = "Select";
