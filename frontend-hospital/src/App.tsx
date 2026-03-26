/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { BarraLateral } from "./components/BarraLateral";
import { PanelResumen } from "./components/PanelResumen";
import { DirectorioPersonal } from "./components/DirectorioPersonal";
import { Infraestructura } from "./components/Infraestructura";
import { ModuloAgenda } from "./components/ModuloAgenda";
import { ModuloPacientes } from "./components/ModuloPacientes";
import { PanelAuxiliares } from "./components/PanelAuxiliares";
import { AppProvider } from "./context/AppContext";

export default function App() {
  const [pestanaActiva, setPestanaActiva] = useState("resumen");

  return (
    <AppProvider>
      <div className="min-h-screen bg-[#f5f5f7] flex">
        <BarraLateral pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva} />
        
        <main className="flex-1 ml-64 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              
              {pestanaActiva === "pacientes" && <ModuloPacientes key="pacientes" />}
              {pestanaActiva === "personal" && <DirectorioPersonal key="personal" />}
              {pestanaActiva === "auxiliares" && <PanelAuxiliares key="auxiliares" />}
              {pestanaActiva === "infraestructura" && <Infraestructura key="infraestructura" />}
              {pestanaActiva === "agenda" && <ModuloAgenda key="agenda" />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
