import React from "react";
import { Building2 } from "lucide-react"; // <-- Este es el icono del edificio

interface Props {
  consultorio: any;
  onClick: () => void;
}

export function TarjetaConsultorio({ consultorio, onClick }: Props) {
  // Ahora manejamos 3 estados visuales
  const isOcupado = consultorio.estado === 'ocupado' || consultorio.estado === 'ocupada';
  const isDisponible = consultorio.estado === 'disponible';
  const isInactivo = consultorio.estado === 'inactivo';

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all hover:-translate-y-1 group ${
        isInactivo ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-black/[0.05] hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${
          isInactivo ? 'bg-gray-200 text-gray-500' : 
          isOcupado ? 'bg-red-50 text-red-600' : 
          isDisponible ? 'bg-[#EBF4F6] text-[#088395]' : 
          'bg-orange-50 text-orange-600'
        }`}>
          {/* Aquí se usa el icono */}
          <Building2 className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
          isInactivo ? 'bg-gray-200 text-gray-600' :
          isOcupado ? 'bg-red-100 text-red-700' : 
          isDisponible ? 'bg-[#EBF4F6] text-[#088395]' : 
          'bg-orange-100 text-orange-700'
        }`}>
          {consultorio.estado}
        </span>
      </div>
      
      <h3 className={`text-lg font-bold mb-1 truncate transition-colors ${
        isInactivo ? 'text-gray-500' : 'text-[#071952] group-hover:text-[#37B7C3]'
      }`} title={consultorio.nombre_consultorio}>
        {consultorio.nombre_consultorio}
      </h3>
      
      <div className="space-y-1 mt-2">
        <p className="text-xs text-[#86868b] font-medium flex justify-between">
          <span>ID Consultorio:</span>
          <span className={isInactivo ? 'text-gray-500' : 'text-[#071952]'}>{consultorio.id_consultorio}</span>
        </p>
        <p className="text-xs text-[#86868b] font-medium flex justify-between">
          <span>Ubicación:</span>
          <span className={isInactivo ? 'text-gray-500' : 'text-[#071952]'}>{consultorio.edificio} - Piso {consultorio.piso}</span>
        </p>
      </div>
    </div>
  );
}