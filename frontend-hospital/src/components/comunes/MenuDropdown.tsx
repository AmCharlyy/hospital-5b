import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const abrirMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!botonRef.current) return;

    // Calculamos la posición exacta del botón en la pantalla
    const rect = botonRef.current.getBoundingClientRect();
    
    setPosicion({
      top: rect.bottom + window.scrollY,
      left: rect.right - 192 // 192 es el ancho w-48 (12rem)
    });

    setAbierto(!abierto);
  };

  useEffect(() => {
    if (!abierto) return;

    const cerrar = (e: MouseEvent) => {
      // Cierra si haces clic fuera o si haces scroll
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    const handleScroll = () => setAbierto(false);

    document.addEventListener("mousedown", cerrar);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", cerrar);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [abierto]);

  return (
    <>
      <button
        ref={botonRef}
        onClick={abrirMenu}
        className="p-2 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 rounded-xl transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {abierto && createPortal(
        <div
          ref={menuRef}
          style={{ 
            position: 'absolute',
            top: `${posicion.top}px`, 
            left: `${posicion.left}px` 
          }}
          className="w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/[0.05] py-2 z-[9999]"
        >
          {opciones.map((opcion, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setAbierto(false);
                opcion.accion();
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5",
                opcion.peligro ? "text-red-600" : "text-[#1d1d1f]"
              )}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}