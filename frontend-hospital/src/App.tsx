import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { BarraLateral } from "./components/BarraLateral";
import { DirectorioPersonal } from "./components/DirectorioPersonal";
import { Infraestructura } from "./components/Infraestructura";
import { ModuloAgenda } from "./components/ModuloAgenda";
import { ModuloPacientes } from "./components/ModuloPacientes";
import { PanelAuxiliares } from "./components/PanelAuxiliares";
import { AppProvider } from "./context/AppContext";
import { Login } from "./components/Login"; // 🚨 Asegúrate de que esta ruta sea la correcta
import { Activity } from "lucide-react";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState("pacientes"); 
  const [cargando, setCargando] = useState(true);

  // 1. Verificar si hay un gafete (Token) guardado al cargar
  useEffect(() => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      setAutenticado(true);
      setCargando(true); // Iniciamos pantalla de carga
    } else {
      setCargando(false); // No hay sesión, mostramos Login directo
    }
  }, []);

  // 2. Control del Spinner de carga
  useEffect(() => {
    if (autenticado) {
      const timer = setTimeout(() => {
        setCargando(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autenticado]);

  // 3. Si NO está autenticado, mostramos la pantalla de Login
  if (!autenticado) {
    return <Login onLoginExitoso={() => setAutenticado(true)} />;
  }

  // 4. Si ESTÁ autenticado, mostramos la App
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-[3px] border-black/[0.05] border-t-blue-600 rounded-full mb-6"
            />
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
          <motion.div 
            key="app-principal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen bg-[#f5f5f7] flex"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </AppProvider>
  );
}