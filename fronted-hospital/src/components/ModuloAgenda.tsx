import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Modal } from "./comunes/Modal";
import { Select } from "./comunes/Select";
import { Input } from "./comunes/Input";

export function ModuloAgenda() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citas, setCitas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);

  const [nuevaCita, setNuevaCita] = useState({
    id_paciente: "", id_doctor: "", id_consultorio: "", fecha: "", hora: "", tipo_cita: "Consulta"
  });

  const cargarDatos = async () => {
    try {
      const [resCitas, resPacientes, resDoctores, resConsultorios] = await Promise.all([
        fetch("http://localhost:3000/api/citas"),
        fetch("http://localhost:3000/api/pacientes/completo"),
        fetch("http://localhost:3000/api/doctores/estado"),
        fetch("http://localhost:3000/api/consultorios")
      ]);
      setCitas(await resCitas.json());
      setPacientes(await resPacientes.json());
      setDoctores(await resDoctores.json());
      setConsultorios(await resConsultorios.json());
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgendarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const respuesta = await fetch("http://localhost:3000/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaCita)
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        alert("❌ Error: " + data.error);
        return;
      }
      alert("✅ ¡Cita agendada con éxito!");
      setModalAbierto(false);
      setNuevaCita({ id_paciente: "", id_doctor: "", id_consultorio: "", fecha: "", hora: "", tipo_cita: "Consulta" });
      cargarDatos();
    } catch (error) {
      console.error("Error al agendar:", error);
    }
  };

  // --- NUEVA FUNCIÓN: Cambiar el estado de la cita ---
  const cambiarEstadoCita = async (id_cita: string, nuevoEstado: string) => {
    // Confirmación para evitar clics por accidente
    if (!window.confirm(`¿Estás seguro de marcar esta cita como ${nuevoEstado}?`)) return;

    try {
      const respuesta = await fetch(`http://localhost:3000/api/citas/${id_cita}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (respuesta.ok) {
        cargarDatos(); // Recargar la tabla para ver el cambio
      } else {
        alert("Hubo un error al actualizar la cita.");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // Filtramos las citas para no saturar la pantalla (Ej. Ocultar las ya finalizadas/canceladas)
  // Si quieres ver todas, solo usa `citas` en lugar de `citasActivas` en el .map de abajo.
  const citasActivas = citas.filter(cita => cita.estado === 'Pendiente' || cita.estado === 'Confirmada');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-[#1d1d1f]">Agenda Médica</h1>
          <p className="text-[#86868b] mt-1">Gestión de citas programadas y activas.</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Agendar Cita
        </Boton>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-black/[0.02] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-black/[0.05]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase">Fecha y Hora</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase">Paciente</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase">Doctor</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase">Consultorio</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {citasActivas.map((cita) => (
              <tr key={cita.id_cita} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{cita.fecha} <br/><span className="text-sm text-gray-500">{cita.hora}</span></td>
                <td className="px-6 py-4">{cita.nombre_paciente}</td>
                <td className="px-6 py-4">{cita.nombre_doctor}</td>
                <td className="px-6 py-4">{cita.nombre_consultorio || "N/A"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${cita.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {cita.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => cambiarEstadoCita(cita.id_cita, 'Finalizada')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Finalizar
                  </button>
                  <button 
                    onClick={() => cambiarEstadoCita(cita.id_cita, 'Cancelada')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Mensaje si la lista está vacía tras el filtro */}
            {citasActivas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#86868b]">
                  No hay citas pendientes ni activas en este momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} titulo="Agendar Nueva Cita">
        {/* El formulario se mantiene exactamente igual */}
        <form onSubmit={handleAgendarCita} className="space-y-4">
          <Select label="Paciente" required value={nuevaCita.id_paciente} onChange={(e) => setNuevaCita({...nuevaCita, id_paciente: e.target.value})}>
            <option value="">-- Selecciona --</option>
            {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nombre_paciente}</option>)}
          </Select>
          <Select label="Doctor" required value={nuevaCita.id_doctor} onChange={(e) => setNuevaCita({...nuevaCita, id_doctor: e.target.value})}>
            <option value="">-- Selecciona --</option>
            {doctores.map(d => <option key={d.id_doctor} value={d.id_doctor}>{d.nombre_doctor}</option>)}
          </Select>
          <Select label="Consultorio" required value={nuevaCita.id_consultorio} onChange={(e) => setNuevaCita({...nuevaCita, id_consultorio: e.target.value})}>
            <option value="">-- Selecciona --</option>
            {consultorios.map(c => <option key={c.id_ui} value={c.id_ui}>{c.nombre}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Fecha" required value={nuevaCita.fecha} onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})} />
            <Input type="time" label="Hora" required value={nuevaCita.hora} onChange={(e) => setNuevaCita({...nuevaCita, hora: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit">Guardar Cita</Boton>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}