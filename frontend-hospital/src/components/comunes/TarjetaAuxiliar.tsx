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
      className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] hover:shadow-md transition-all cursor-pointer group bg-white hover:scale-[1.01]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-semibold text-lg">
          {getAvatar()}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] group-hover:text-purple-600 transition-colors">
            {auxiliar.nombre} {auxiliar.apellido}
          </h3>
          <p className="text-sm text-[#86868b] capitalize">{auxiliar.tipo_auxiliar}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {opciones && <MenuDropdown opciones={opciones} />}
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
          auxiliar.turno === 'Día' ? 'bg-amber-100 text-amber-700' :
          auxiliar.turno === 'Tarde' ? 'bg-orange-100 text-orange-700' :
          auxiliar.turno === 'Noche' ? 'bg-indigo-100 text-indigo-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          Turno {auxiliar.turno}
        </span>
      </div>
    </div>
  );
}
