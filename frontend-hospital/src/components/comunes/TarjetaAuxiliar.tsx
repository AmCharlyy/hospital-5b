import { MenuDropdown, OpcionDropdown } from "./MenuDropdown";
import { Auxiliar } from "../../context/AppContext";

interface Props {
  auxiliar: Auxiliar;
  onClick?: () => void;
  opciones?: OpcionDropdown[];
}

export function TarjetaAuxiliar({ auxiliar, onClick, opciones }: Props) {
  const getAvatar = () => {
    return `${auxiliar.nombre.charAt(0)}${auxiliar.apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] hover:shadow-md transition-all cursor-pointer group bg-white hover:scale-[1.01] overflow-visible"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#EBF4F6] flex items-center justify-center text-[#088395] font-semibold text-lg">
          {getAvatar()}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#071952] group-hover:text-[#37B7C3] transition-colors">
            {auxiliar.nombre} {auxiliar.apellido}
          </h3>
          <p className="text-sm text-[#86868b] capitalize">{auxiliar.tipo_auxiliar}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 relative z-20 overflow-visible">
        {opciones && <MenuDropdown opciones={opciones} />}
        
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
          auxiliar.turno === 'Día' ? 'bg-[#EBF4F6] text-[#088395]' :
          auxiliar.turno === 'Tarde' ? 'bg-orange-100 text-orange-700' :
          auxiliar.turno === 'Noche' ? 'bg-[#071952] text-white' :
          'bg-gray-100 text-gray-600'
        }`}>
          Turno {auxiliar.turno}
        </span>
      </div>
    </div>
  );
}