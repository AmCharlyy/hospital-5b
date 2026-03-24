import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro";
}

export function Boton({ variante = "primario", className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
        variante === "primario" && "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        variante === "secundario" && "bg-white text-[#1d1d1f] border border-black/[0.05] hover:bg-gray-50 shadow-sm",
        variante === "peligro" && "bg-red-50 text-red-600 hover:bg-red-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
