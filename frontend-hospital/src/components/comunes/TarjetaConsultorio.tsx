import React from "react";
import { Building2 } from "lucide-react";

interface Props {
  consultorio: any;
  onClick: () => void;
}

export function TarjetaConsultorio({ consultorio, onClick }: Props) {
  // Ajustamos los colores dependiendo del estado
  const isOcupado = consultorio.estado === 'ocupado' || consultorio.estado === 'ocupada';
  const isDisponible = consultorio.estado === 'disponible';

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${isOcupado ? 'bg-red-50 text-red-600' : isDisponible ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
          <Building2 className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
          isOcupado ? 'bg-red-100 text-red-700' : isDisponible ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {consultorio.estado}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-[#1d1d1f] mb-1 truncate" title={consultorio.nombre_consultorio}>
        {consultorio.nombre_consultorio}
      </h3>
      
      <div className="space-y-1 mt-2">
        <p className="text-xs text-[#86868b] font-medium flex justify-between">
          <span>ID Consultorio:</span>
          <span className="text-[#1d1d1f]">{consultorio.id_consultorio}</span>
        </p>
        <p className="text-xs text-[#86868b] font-medium flex justify-between">
          <span>Ubicación:</span>
          <span className="text-[#1d1d1f]">{consultorio.edificio} - Piso {consultorio.piso}</span>
        </p>
      </div>
    </div>
  );
}