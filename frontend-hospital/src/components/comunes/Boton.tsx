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
        // Color Primario: Navy con hover Teal
        variante === "primario" && "bg-[#071952] text-white hover:bg-[#088395] shadow-sm",
        // Color Secundario: Blanco con borde Aqua y texto Teal, hover Off-White
        variante === "secundario" && "bg-white text-[#088395] border border-[#37B7C3] hover:bg-[#EBF4F6] shadow-sm",
        variante === "peligro" && "bg-red-50 text-red-600 hover:bg-red-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}