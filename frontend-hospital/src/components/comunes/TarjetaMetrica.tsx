import { LucideIcon } from "lucide-react";

interface Props {
  etiqueta: string;
  valor: string;
  Icono: LucideIcon;
  colorTexto: string;
  colorFondo: string;
}

export function TarjetaMetrica({ etiqueta, valor, Icono, colorTexto, colorFondo }: Props) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02]">
      <div className={`w-12 h-12 rounded-2xl ${colorFondo} flex items-center justify-center mb-4`}>
        <Icono className={`w-6 h-6 ${colorTexto}`} />
      </div>
      <p className="text-sm font-medium text-[#86868b]">{etiqueta}</p>
      <p className="text-3xl font-semibold tracking-tight text-[#071952] mt-1">{valor}</p>
    </div>
  );
}