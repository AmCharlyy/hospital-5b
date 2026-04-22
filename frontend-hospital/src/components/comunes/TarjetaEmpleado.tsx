import { MenuDropdown, OpcionDropdown } from "./MenuDropdown";

export interface Empleado {
  id: number;
  nombre: string;
  rol: string;
  estado: string;
  tipo: string;
  avatar: string;
}

interface Props {
  empleado: Empleado;
  colorEstado: string;
  onClick?: () => void;
  opciones?: OpcionDropdown[];
}

export function TarjetaEmpleado({ empleado, onClick, opciones }: Props) {  
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] hover:shadow-md transition-all cursor-pointer group bg-white hover:scale-[1.01]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-semibold text-lg">
          {empleado.avatar}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] group-hover:text-light_aqua transition-colors">{empleado.nombre}</h3>
          <p className="text-sm text-[#86868b]">{empleado.rol}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {opciones && <MenuDropdown opciones={opciones} />}
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
          empleado.estado === 'Activo' ? 'bg-brand-green/10 text-brand-green-dark' :
          empleado.estado === 'Inactivo' ? 'bg-gray-200 text-gray-600' :
          empleado.estado === 'Descanso' ? 'bg-blue-200 text-blue-700' :
          empleado.estado === 'En Consulta' ? 'bg-red-200 text-red-700' :
          empleado.estado === 'Ausente' ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {empleado.estado}
        </span>
      </div>
    </div>
  );
}
