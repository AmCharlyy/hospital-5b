import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

export interface OpcionDropdown {
  etiqueta: string;
  accion: () => void;
  peligro?: boolean;
}

interface Props {
  opciones: OpcionDropdown[];
}

export function MenuDropdown({ opciones }: Props) {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setAbierto(!abierto); }}
        className="p-2 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 rounded-xl transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      
      {abierto && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/[0.05] py-2 z-50">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setAbierto(false);
                opcion.accion();
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5",
                opcion.peligro ? "text-red-600 hover:bg-red-50" : "text-[#1d1d1f]"
              )}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
