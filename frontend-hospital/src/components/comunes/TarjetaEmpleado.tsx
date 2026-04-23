import { MenuDropdown, OpcionDropdown } from "./MenuDropdown";

export interface Empleado {
  id: number | string; // Asegúrate de que acepte string por tu formato DOC-1, ADM-2
  nombre: string;
  rol: string;
  estado: string;
  tipo: string;
  avatar: string;
}

interface Props {
  empleado: Empleado;
  onClick?: () => void;
  opciones?: OpcionDropdown[];
}

// Nota: Eliminé colorEstado de las props porque tú ya manejas los colores adentro
export function TarjetaEmpleado({ empleado, onClick, opciones }: Props) {  
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] hover:shadow-md transition-all cursor-pointer group bg-white hover:scale-[1.01] overflow-visible relative"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#EBF4F6] flex items-center justify-center text-[#088395] font-semibold text-lg">
          {empleado.avatar}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#071952] group-hover:text-[#37B7C3] transition-colors">{empleado.nombre}</h3>
          <p className="text-sm text-[#86868b]">{empleado.rol}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 relative z-20">
        {opciones && <MenuDropdown opciones={opciones} />}
        
        {empleado.tipo !== 'administrativo' && (
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
            empleado.estado === 'Activo' || empleado.estado === 'Disponible' ? 'bg-green-100 text-green-700' :
            empleado.estado === 'Inactivo' || empleado.estado === 'Eliminado' ? 'bg-gray-200 text-gray-600' :
            empleado.estado === 'Descanso' ? 'bg-[#EBF4F6] text-[#088395]' :
            empleado.estado === 'En Consulta' ? 'bg-red-200 text-red-700' :
            empleado.estado === 'Ausente' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {empleado.estado}
          </span>
        )}
      </div>
    </div>
  );
}