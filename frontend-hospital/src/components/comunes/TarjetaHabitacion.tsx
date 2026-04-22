import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export interface Habitacion {
  id: string;
  tipo: string;
  estado: "ocupada" | "disponible" | "mantenimiento" | "limpieza";
  paciente: string | null;
  tiempo: string | null;
}

interface Props {
  habitacion: Habitacion;
  onClick?: () => void;
}

export function TarjetaHabitacion({ habitacion, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className={`relative p-5 rounded-3xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        habitacion.estado === 'ocupada' ? 'bg-white border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.05)]' :
        habitacion.estado === 'disponible' ? 'bg-white border-[#37B7C3]/30 shadow-[0_4px_20px_rgba(55,183,195,0.05)]' :
        'bg-orange-50/50 border-orange-100'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-lg font-bold tracking-tight text-[#071952]">{habitacion.id}</span>
        {habitacion.estado === 'ocupada' && <AlertCircle className="w-5 h-5 text-red-500" />}
        {habitacion.estado === 'disponible' && <CheckCircle2 className="w-5 h-5 text-[#37B7C3]" />}
        {(habitacion.estado === 'mantenimiento' || habitacion.estado === 'limpieza') && <Clock className="w-5 h-5 text-orange-500" />}
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">{habitacion.tipo}</p>
        {habitacion.estado === 'ocupada' ? (
          <>
            <p className="text-[15px] font-medium text-[#071952] truncate">{habitacion.paciente}</p>
            <p className="text-xs text-[#86868b] flex items-center gap-1 mt-2">
              <Clock className="w-3 h-3" /> {habitacion.tiempo}
            </p>
          </>
        ) : habitacion.estado === 'disponible' ? (
          <p className="text-[15px] font-medium text-[#088395]">Lista para ingreso</p>
        ) : (
          <p className="text-[15px] font-medium text-orange-600">
            {habitacion.estado === 'limpieza' ? 'En limpieza' : 'Mantenimiento'}
          </p>
        )}
      </div>
    </div>
  );
}