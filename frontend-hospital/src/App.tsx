/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { BarraLateral } from "./components/BarraLateral";
import { DirectorioPersonal } from "./components/DirectorioPersonal";
import { Infraestructura } from "./components/Infraestructura";
import { ModuloAgenda } from "./components/ModuloAgenda";
import { ModuloPacientes } from "./components/ModuloPacientes";
import { PanelAuxiliares } from "./components/PanelAuxiliares";
import { AppProvider } from "./context/AppContext";

export default function App() {
  // 1. Inicia directamente en "pacientes"
  const [pestanaActiva, setPestanaActiva] = useState("pacientes"); 
  
  // 2. Estado para controlar la pantalla de carga
  const [cargando, setCargando] = useState(true);

  // 3. Simulamos el tiempo de carga inicial (1.5 segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCargando(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        {cargando ? (
          <motion.div
            key="pantalla-carga"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f5f5f7]"
          >
            {/* Spinner giratorio */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-[3px] border-black/[0.05] border-t-blue-600 rounded-full mb-6"
            />
            {/* Texto elegante */}
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-semibold text-[#86868b] tracking-[0.2em] uppercase"
            >
              Iniciando Sistema
            </motion.p>
          </motion.div>
        ) : (
          // --- SISTEMA PRINCIPAL ---
          <motion.div 
            key="app-principal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen bg-[#f5f5f7] flex"
          >
            <BarraLateral pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva} />
            
            <main className="flex-1 ml-64 p-8 lg:p-12 overflow-visible">
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
          </motion.div>
        )}
      </AnimatePresence>
    </AppProvider>
  );
}