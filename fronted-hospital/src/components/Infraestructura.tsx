import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TarjetaHabitacion } from "./comunes/TarjetaHabitacion";

export function Infraestructura() {
  const [consultorios, setConsultorios] = useState<any[]>([]);

  useEffect(() => {
    const fetchConsultorios = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/consultorios");
        setConsultorios(await res.json());
      } catch (error) {
        console.error("Error al cargar consultorios:", error);
      }
    };
    fetchConsultorios();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Estado de Consultorios</h1>
        <p className="text-[#86868b] mt-1">Visualización en tiempo real de la disponibilidad de consultorios.</p>
      </header>

      <div className="flex gap-4 text-sm font-medium mb-4">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[#86868b]">Ocupado</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-[#86868b]">Disponible</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {consultorios.map((consul) => (
          <TarjetaHabitacion 
            key={consul.id_ui} 
            habitacion={{ id: `C-${consul.id_ui}`, tipo: consul.nombre, estado: consul.estado, paciente: consul.estado === 'ocupada' ? 'En Uso' : null }} 
          />
        ))}
      </div>
    </motion.div>
  );
}