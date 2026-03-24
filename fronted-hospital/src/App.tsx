import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { BarraLateral } from "./components/BarraLateral";
// ELIMINADO: import { PanelResumen } from "./components/PanelResumen";
import { DirectorioPersonal } from "./components/DirectorioPersonal";
import { Infraestructura } from "./components/Infraestructura";
import { ModuloAgenda } from "./components/ModuloAgenda";
import { ModuloPacientes } from "./components/ModuloPacientes";
import { AppProvider } from "./context/AppContext";

export default function App() {
  // CAMBIO: Ahora la pestaña inicial será "pacientes" en lugar de "resumen"
  const [pestanaActiva, setPestanaActiva] = useState("pacientes");

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#f5f5f7] flex">
        <BarraLateral pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva} />
        
        <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {/* ELIMINADO: Renderizado de PanelResumen */}
              {pestanaActiva === "pacientes" && <ModuloPacientes key="pacientes" />}
              {pestanaActiva === "personal" && <DirectorioPersonal key="personal" />}
              {pestanaActiva === "infraestructura" && <Infraestructura key="infraestructura" />}
              {pestanaActiva === "agenda" && <ModuloAgenda key="agenda" />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}