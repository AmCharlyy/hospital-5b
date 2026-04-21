import { LayoutDashboard, Users, Building2, Calendar, Settings, Activity, UserPlus, Shield } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  pestanaActiva: string;
  setPestanaActiva: (pestana: string) => void;
}

export function BarraLateral({ pestanaActiva, setPestanaActiva }: Props) {
  const elementosNavegacion = [
    
    { id: "pacientes", etiqueta: "Pacientes", Icono: UserPlus },
    { id: "personal", etiqueta: "Personal Médico", Icono: Users },
    { id: "auxiliares", etiqueta: "Auxiliares", Icono: Shield },
    { id: "infraestructura", etiqueta: "Infraestructura", Icono: Building2 },
    { id: "agenda", etiqueta: "Agenda", Icono: Calendar },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 p-6 flex flex-col bg-[#f5f5f7]">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden">
          <img 
            src="https://i.postimg.cc/13NcVHWy/LOGO.png" 
            alt="CHEPA'S Hospital Logo" 
            className="w-full h-full object-contain p-1"
          />
        </div>
        <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">CHEPA'S Hospital</span>
      </div>
      <nav className="flex-1 space-y-1">
        {elementosNavegacion.map((item) => {
          const Icono = item.Icono;
          const estaActivo = pestanaActiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPestanaActiva(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                estaActivo
                  ? "bg-white text-blue-600 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                  : "text-[#86868b] hover:bg-black/5 hover:text-[#1d1d1f]"
              )}
            >
              <Icono className={cn("w-5 h-5", estaActivo ? "text-blue-600" : "text-[#86868b]")} />
              {item.etiqueta}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-black/5">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#86868b] hover:bg-black/5 hover:text-[#1d1d1f] transition-all duration-200">
          <Settings className="w-5 h-5" />
          Configuración
        </button>
      </div>
    </aside>
  );
}
