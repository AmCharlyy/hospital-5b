import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { TarjetaEmpleado } from "./comunes/TarjetaEmpleado";

export function DirectorioPersonal() {
  const [doctores, setDoctores] = useState<any[]>([]);

  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/doctores/estado");
        const data = await res.json();
        const doctoresFormateados = data.map((doc: any) => ({
          id: `DOC-${doc.id_doctor}`,
          nombre: doc.nombre_doctor,
          rol: doc.especialidad || 'General',
          tipo: 'doctor',
          estado: doc.estado_actual, // Viene del Backend: 'En Consulta' o 'Disponible'
          avatar: doc.nombre_doctor.substring(0, 2).toUpperCase()
        }));
        setDoctores(doctoresFormateados);
      } catch (error) {
        console.error("Error al cargar doctores:", error);
      }
    };
    fetchDoctores();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Doctores</h1>
          <p className="text-[#86868b] mt-1">Disponibilidad del personal médico.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl p-6 border border-black/[0.02] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctores.map((doc) => (
            <TarjetaEmpleado key={doc.id} empleado={doc} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}