import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Calendar as CalendarIcon, Clock, User, Activity, 
  MapPin, CheckCircle2, XCircle, AlertCircle, Phone, MessageSquare, 
  Filter, History 
} from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Modal } from "./comunes/Modal";
import { Input } from "./comunes/Input";
import { Select } from "./comunes/Select";
import { apiFetch } from "../api";

// --- VARIANTS PARA ANIMACIONES ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ModuloAgenda() {
  // Estados para datos de la API
  const [citas, setCitas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);

  // Estados de UI
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState<{ isOpen: boolean; cita: any | null; accion: 'Confirmar' | 'Cancelar' | 'Rechazar' | null }>({ isOpen: false, cita: null, accion: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [vistaActiva, setVistaActiva] = useState<'confirmaciones' | 'calendario'>('confirmaciones');
  
  const [nuevaCita, setNuevaCita] = useState({ 
    id_paciente: "", id_doctor: "", id_consultorio: "", hora: "", tipo_cita: "Consulta", fecha: fechaSeleccionada 
  });

  // Filtros para el calendario
  const [filtroDoctor, setFiltroDoctor] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Cargar datos desde la API
  const cargarDatos = async () => {
    try {
      const [resCitas, resPacientes, resDoctores, resConsultorios] = await Promise.all([
        apiFetch("http://localhost:3333/api/citas"),
        apiFetch("http://localhost:3333/api/pacientes/completo"),
        apiFetch("http://localhost:3333/api/doctores/estado"),
        apiFetch("http://localhost:3333/api/consultorios")
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

  // Funciones Utilitarias para Fechas y Horas (Cortesía de Postgres)
  const normalizarFecha = (fecha: string) => fecha ? fecha.split('T')[0] : "";
  const formatearHora = (hora: string) => hora ? hora.slice(0, 5) : "--:--";

  // Filtrado de citas
  const citasPendientes = citas
    .filter(c => c.estado === 'Pendiente')
    .sort((a, b) => new Date(`${normalizarFecha(a.fecha)}T${a.hora}`).getTime() - new Date(`${normalizarFecha(b.fecha)}T${b.hora}`).getTime());
  
  let citasDelDia = citas
    .filter(c => normalizarFecha(c.fecha) === fechaSeleccionada)
    .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
    
  if (filtroDoctor) citasDelDia = citasDelDia.filter(c => String(c.id_doctor) === filtroDoctor);
  if (filtroEstado) citasDelDia = citasDelDia.filter(c => c.estado === filtroEstado);

  // KPIs
  const hoyISO = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(c => normalizarFecha(c.fecha) === hoyISO);
  const kpis = {
    pendientes: citas.filter(c => c.estado === 'Pendiente').length,
    confirmadasHoy: citasHoy.filter(c => c.estado === 'Confirmada').length,
    canceladasHoy: citasHoy.filter(c => c.estado === 'Cancelada').length,
    totalHoy: citasHoy.length
  };

  // Funciones de la API (Registrar y Actualizar)
  const handleRegistrarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCita.id_paciente || !nuevaCita.id_doctor) return;
    
    try {
      const respuesta = await apiFetch("http://localhost:3333/api/citas", {
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
      setNuevaCita({ id_paciente: "", id_doctor: "", id_consultorio: "", hora: "", tipo_cita: "Consulta", fecha: fechaSeleccionada });
      cargarDatos();
    } catch (error) {
      console.error("Error al agendar:", error);
    }
  };

  const actualizarEstadoEnAPI = async (id_cita: string | number, nuevoEstado: string, motivo?: string) => {
    try {
      const payload: any = { estado: nuevoEstado };
      if (motivo) payload.motivo_cancelacion = motivo;

      const respuesta = await apiFetch(`http://localhost:3333/api/citas/${id_cita}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        cargarDatos();
      } else {
        alert("Hubo un error al actualizar la cita.");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  const handleCambiarEstado = () => {
    if (!modalConfirmacion.cita || !modalConfirmacion.accion) return;
    let nuevoEstado = '';
    if (modalConfirmacion.accion === 'Confirmar') nuevoEstado = 'Confirmada';
    else if (modalConfirmacion.accion === 'Cancelar') nuevoEstado = 'Cancelada';
    else if (modalConfirmacion.accion === 'Rechazar') nuevoEstado = 'Rechazada'; 
    
    actualizarEstadoEnAPI(modalConfirmacion.cita.id_cita, nuevoEstado, motivoCancelacion);
    
    setModalConfirmacion({ isOpen: false, cita: null, accion: null });
    setMotivoCancelacion("");
    setCitaSeleccionada(null);
  };

  const handleIniciarConsulta = () => {
    if (!citaSeleccionada) return;
    actualizarEstadoEnAPI(citaSeleccionada.id_cita, "En Curso");
    setCitaSeleccionada(null);
  };

  const handleFinalizarConsulta = () => {
    if (!citaSeleccionada) return;
    actualizarEstadoEnAPI(citaSeleccionada.id_cita, "Completada");
    setCitaSeleccionada(null);
  };

  // Helpers para mapear IDs a Nombres
  const getPaciente = (id: string | number) => pacientes.find(p => String(p.id_paciente) === String(id));
  const getNombreDoctor = (id: string | number) => doctores.find(d => String(d.id_doctor) === String(id))?.nombre_doctor || "Desconocido";
  const getNombreHabitacion = (id?: string | number | null) => {
    if (!id) return "Sin asignar";
    const hab = consultorios.find(c => String(c.id_ui) === String(id));
    return hab ? `${hab.nombre}` : "Desconocido";
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completada': return 'bg-green-100 text-green-700 border-green-200';
      case 'Confirmada': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En Curso': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Cancelada': return 'bg-red-100 text-red-700 border-red-200';
      case 'Pendiente': default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  // Agrupar citas pendientes por fecha
  const citasPendientesAgrupadas = citasPendientes.reduce((acc, cita) => {
    const fechaLimpiada = normalizarFecha(cita.fecha);
    if (!acc[fechaLimpiada]) acc[fechaLimpiada] = [];
    acc[fechaLimpiada].push(cita);
    return acc;
  }, {} as Record<string, any[]>);

  // Historial del paciente seleccionado
  const historialPaciente = citaSeleccionada 
    ? citas.filter(c => c.id_paciente === citaSeleccionada.id_paciente && c.id_cita !== citaSeleccionada.id_cita)
           .sort((a, b) => new Date(`${normalizarFecha(b.fecha)}T${b.hora}`).getTime() - new Date(`${normalizarFecha(a.fecha)}T${a.hora}`).getTime()) 
    : [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Agenda y Confirmaciones</h1>
          <p className="text-[#86868b] mt-1">Gestión de citas, confirmaciones y trazabilidad médica.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Boton onClick={() => setModalAbierto(true)}>
              <Plus className="w-5 h-5" />
              Nueva Cita
            </Boton>
          </motion.div>
        </div>
      </header>

      {/* KPI Cards ANIMADAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Pendientes", value: kpis.pendientes, icon: AlertCircle, color: "orange" },
          { title: "Confirmadas Hoy", value: kpis.confirmadasHoy, icon: CheckCircle2, color: "blue" },
          { title: "Canceladas Hoy", value: kpis.canceladasHoy, icon: XCircle, color: "red" },
          { title: "Total Citas Hoy", value: kpis.totalHoy, icon: CalendarIcon, color: "gray" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-sm flex items-center gap-4 cursor-default"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${kpi.color}-50 text-${kpi.color}-500`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#86868b]">{kpi.title}</p>
                <motion.p 
                  key={kpi.value} 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="text-2xl font-semibold text-[#1d1d1f]"
                >
                  {kpi.value}
                </motion.p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.05]">
        <button
          onClick={() => setVistaActiva('confirmaciones')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-300 ${vistaActiva === 'confirmaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-50/50'}`}
        >
          Confirmaciones Pendientes
        </button>
        <button
          onClick={() => setVistaActiva('calendario')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-300 ${vistaActiva === 'calendario' ? 'border-blue-600 text-blue-600' : 'border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-50/50'}`}
        >
          Calendario y Trazabilidad
        </button>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'confirmaciones' && (
          <motion.div 
            key="confirmaciones"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-black/[0.05] bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-medium text-[#1d1d1f] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Citas por Confirmar
              </h2>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {Object.keys(citasPendientesAgrupadas).length === 0 ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-12 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500/50 mb-3" />
                  <p className="text-[#86868b] font-medium">¡Excelente! No hay citas pendientes de confirmación.</p>
                </motion.div>
              ) : (
                Object.keys(citasPendientesAgrupadas).sort().map(fecha => (
                  <div key={fecha} className="pb-4">
                    <div className="px-6 py-2 bg-gray-50/80 border-y border-black/[0.05] sticky top-0 z-10">
                      <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                        {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-black/[0.05]">
                      {citasPendientesAgrupadas[fecha].map((cita) => {
                        const paciente = getPaciente(cita.id_paciente);
                        return (
                          <motion.div variants={itemVariants} key={cita.id_cita} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-start gap-4 flex-1">
                              <motion.div whileHover={{ rotate: -5 }} className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 shrink-0 cursor-default">
                                <span className="text-xs font-medium uppercase">Hora</span>
                                <span className="text-lg font-bold leading-none">{formatearHora(cita.hora)}</span>
                              </motion.div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-[#1d1d1f]">{cita.nombre_paciente || paciente?.nombre_paciente || "Desconocido"}</h3>
                                  <span className="text-xs font-normal text-[#86868b] bg-gray-100 px-2 py-0.5 rounded-md">{paciente?.folio || "N/A"}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#86868b]">
                                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {getNombreDoctor(cita.id_doctor)}</span>
                                  <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {cita.tipo_cita}</span>
                                </div>
                                {paciente && (
                                  <div className="flex items-center gap-3 mt-3">
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors">
                                      <Phone className="w-3.5 h-3.5" /> Llamar: {paciente.codigo_pais} {paciente.numero_telefono}
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md hover:bg-green-100 transition-colors">
                                      <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            </div>                       
                            <div className="flex items-center gap-3 shrink-0">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Boton 
                                  variante="secundario" 
                                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                  onClick={() => setModalConfirmacion({ isOpen: true, cita, accion: 'Rechazar' as any })}
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" /> Rechazar
                                </Boton>
                              </motion.div>

                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Boton 
                                  variante="peligro" 
                                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none transition-colors"
                                  onClick={() => setModalConfirmacion({ isOpen: true, cita, accion: 'Cancelar' })}
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" /> Cancelar
                                </Boton>
                              </motion.div>
                              
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Boton 
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white border-none transition-colors shadow-sm shadow-green-200"
                                  onClick={() => setModalConfirmacion({ isOpen: true, cita, accion: 'Confirmar' })}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar Cita
                                </Boton>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {vistaActiva === 'calendario' && (
          <motion.div 
            key="calendario"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-black/[0.05] bg-gray-50/50 gap-4">
              <div className="flex items-center gap-2 text-[#1d1d1f] font-medium">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span>Trazabilidad de Citas</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 border-r border-black/[0.05] pr-3">
                  <Filter className="w-4 h-4 text-[#86868b]" />
                  <select 
                    className="bg-transparent text-sm font-medium text-[#1d1d1f] focus:outline-none cursor-pointer"
                    value={filtroDoctor}
                    onChange={(e) => setFiltroDoctor(e.target.value)}
                  >
                    <option value="">Todos los doctores</option>
                    {doctores.map(d => <option key={d.id_doctor} value={d.id_doctor}>{d.nombre_doctor}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-r border-black/[0.05] pr-3">
                  <select 
                    className="bg-transparent text-sm font-medium text-[#1d1d1f] focus:outline-none cursor-pointer"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmada">Confirmada</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-[#1d1d1f] border border-black/[0.05] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-shadow"
                  />
                </div>
              </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-black/[0.05]">
              {citasDelDia.length === 0 ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-12 text-center flex flex-col items-center justify-center">
                  <CalendarIcon className="w-12 h-12 text-[#86868b]/30 mb-3" />
                  <p className="text-[#86868b] font-medium">No hay citas programadas para este día con los filtros actuales.</p>
                </motion.div>
              ) : (
                citasDelDia.map((cita) => {
                  const paciente = getPaciente(cita.id_paciente);
                  return (
                    <motion.div variants={itemVariants} key={cita.id_cita} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-6">
                        <motion.div whileHover={{ rotate: 5 }} className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 text-gray-600 border border-black/[0.05] cursor-default">
                          <Clock className="w-6 h-6 mb-1" />
                          <span className="text-sm font-bold tracking-tight">{formatearHora(cita.hora)}</span>
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2">
                            {cita.nombre_paciente || paciente?.nombre_paciente || "Desconocido"}
                            <span className="text-xs font-normal text-[#86868b] bg-gray-100 px-2 py-0.5 rounded-md">
                              {paciente?.folio || "N/A"}
                            </span>
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-[#86868b]">
                            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {getNombreDoctor(cita.id_doctor)}</span>
                            <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {cita.tipo_cita}</span>
                            {cita.id_consultorio && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {getNombreHabitacion(cita.id_consultorio)}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <motion.span whileHover={{ scale: 1.05 }} className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${getEstadoColor(cita.estado)} cursor-default`}>
                          {cita.estado}
                        </motion.span>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Boton variante="secundario" className="px-3 py-1.5 text-xs hover:bg-gray-100" onClick={() => setCitaSeleccionada(cita)}>
                            Ver Detalles
                          </Boton>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nueva Cita */}
      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} titulo="Programar Nueva Cita">
        <motion.form 
          variants={containerVariants} initial="hidden" animate="show"
          onSubmit={handleRegistrarCita} className="space-y-4"
        >
          <motion.div variants={itemVariants}>
            <Select label="Paciente" required value={nuevaCita.id_paciente} onChange={(e) => setNuevaCita({...nuevaCita, id_paciente: e.target.value})}>
              <option value="">-- Seleccione un paciente --</option>
              {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nombre_paciente}</option>)}
            </Select>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Select label="Doctor Asignado" required value={nuevaCita.id_doctor} onChange={(e) => setNuevaCita({...nuevaCita, id_doctor: e.target.value})}>
              <option value="">-- Seleccione un doctor --</option>
              {doctores.map(d => <option key={d.id_doctor} value={d.id_doctor}>{d.nombre_doctor}</option>)}
            </Select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Select label="Espacio / Consultorio (Opcional)" value={nuevaCita.id_consultorio} onChange={(e) => setNuevaCita({...nuevaCita, id_consultorio: e.target.value})}>
              <option value="">-- Sin asignar --</option>
              {consultorios.map(c => <option key={c.id_ui} value={c.id_ui}>{c.nombre}</option>)}
            </Select>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" required value={nuevaCita.fecha} onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})} />
            <Input label="Hora" type="time" required value={nuevaCita.hora} onChange={(e) => setNuevaCita({...nuevaCita, hora: e.target.value})} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input label="Motivo / Especialidad" placeholder="Ej. Revisión General" required value={nuevaCita.tipo_cita} onChange={(e) => setNuevaCita({...nuevaCita, tipo_cita: e.target.value})} />
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4 flex justify-end gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Boton type="submit" disabled={!nuevaCita.id_paciente || !nuevaCita.id_doctor}>Guardar Cita</Boton>
            </motion.div>
          </motion.div>
        </motion.form>
      </Modal>

      {/* Modal Detalles de Cita */}
      <Modal isOpen={!!citaSeleccionada} onClose={() => setCitaSeleccionada(null)} titulo="Detalles de la Cita">
        {citaSeleccionada && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-black/[0.05] text-gray-600 flex flex-col items-center justify-center">
                <Clock className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">{formatearHora(citaSeleccionada.hora)}</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#1d1d1f]">{citaSeleccionada.nombre_paciente || getPaciente(citaSeleccionada.id_paciente)?.nombre_paciente}</h3>
                <p className="text-[#86868b]">{citaSeleccionada.tipo_cita} • {getPaciente(citaSeleccionada.id_paciente)?.folio || "N/A"}</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] space-y-3">
              <div>
                <p className="text-xs text-[#86868b] uppercase tracking-wider font-semibold">Doctor Asignado</p>
                <p className="text-[#1d1d1f] font-medium mt-1">{getNombreDoctor(citaSeleccionada.id_doctor)}</p>
              </div>
              <div>
                <p className="text-xs text-[#86868b] uppercase tracking-wider font-semibold">Espacio Asignado</p>
                <p className="text-[#1d1d1f] font-medium mt-1">{getNombreHabitacion(citaSeleccionada.id_consultorio)}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-black/[0.05]">
                <div>
                  <p className="text-xs text-[#86868b] uppercase tracking-wider font-semibold">Fecha</p>
                  <p className="text-[#1d1d1f] font-medium mt-1">{normalizarFecha(citaSeleccionada.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#86868b] uppercase tracking-wider font-semibold">Estado Actual</p>
                  <span className={`inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getEstadoColor(citaSeleccionada.estado)}`}>
                    {citaSeleccionada.estado}
                  </span>
                </div>
              </div>
              {citaSeleccionada.estado === 'Cancelada' && citaSeleccionada.motivo_cancelacion && (
                <div className="pt-2 border-t border-black/[0.05]">
                  <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Motivo de Cancelación</p>
                  <p className="text-[#1d1d1f] font-medium mt-1 text-sm">{citaSeleccionada.motivo_cancelacion}</p>
                </div>
              )}
            </motion.div>

            {/* Historial del Paciente */}
            {historialPaciente.length > 0 && (
              <motion.div variants={itemVariants} className="pt-2">
                <h4 className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-[#86868b]" /> Historial Reciente del Paciente
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {historialPaciente.slice(0, 3).map(h => (
                    <motion.div whileHover={{ scale: 1.02 }} key={h.id_cita} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-black/[0.05] text-sm">
                      <div>
                        <p className="font-medium text-[#1d1d1f]">{normalizarFecha(h.fecha)} <span className="text-[#86868b] font-normal">a las {formatearHora(h.hora)}</span></p>
                        <p className="text-xs text-[#86868b]">{h.tipo_cita}</p>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getEstadoColor(h.estado)}`}>
                        {h.estado}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
              {citaSeleccionada.estado === 'Confirmada' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Boton onClick={handleIniciarConsulta} className="w-full">Iniciar Consulta (Paciente en sala)</Boton>
                </motion.div>
              )}
              {citaSeleccionada.estado === 'En Curso' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Boton onClick={handleFinalizarConsulta} className="w-full">Finalizar Consulta</Boton>
                </motion.div>
              )}
              
              <div className="flex gap-3 w-full">
                <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Boton className="w-full" variante="secundario" onClick={() => setCitaSeleccionada(null)}>Cerrar</Boton>
                </motion.div>
                {(citaSeleccionada.estado === 'Pendiente' || citaSeleccionada.estado === 'Confirmada') && (
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Boton className="w-full" variante="peligro" onClick={() => setModalConfirmacion({ isOpen: true, cita: citaSeleccionada, accion: 'Cancelar' })}>
                      Cancelar Cita
                    </Boton>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </Modal>

      {/* Modal Confirmación / Cancelación */}
      <Modal 
        isOpen={modalConfirmacion.isOpen} 
        onClose={() => {
          setModalConfirmacion({ isOpen: false, cita: null, accion: null });
          setMotivoCancelacion("");
        }} 
        titulo={modalConfirmacion.accion === 'Confirmar' ? 'Confirmar Cita' : 'Cancelar Cita'}
      >
        {modalConfirmacion.cita && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={itemVariants} className={`p-4 rounded-xl border ${modalConfirmacion.accion === 'Confirmar' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-sm font-medium ${modalConfirmacion.accion === 'Confirmar' ? 'text-green-800' : 'text-red-800'}`}>
                ¿Estás seguro que deseas {modalConfirmacion.accion?.toLowerCase()} la cita de <strong>{modalConfirmacion.cita.nombre_paciente || getPaciente(modalConfirmacion.cita.id_paciente)?.nombre_paciente}</strong> programada para el <strong>{normalizarFecha(modalConfirmacion.cita.fecha)}</strong> a las <strong>{formatearHora(modalConfirmacion.cita.hora)}</strong>?
              </p>
            </motion.div>
            
            {modalConfirmacion.accion === 'Cancelar' && (
              <motion.div variants={itemVariants}>
                <Select label="Motivo / Tipo de Cita a Cancelar" required value={nuevaCita.tipo_cita} onChange={(e) => setNuevaCita({...nuevaCita, tipo_cita: e.target.value})}>
                  <option value="Consulta">Consulta</option>
                  <option value="Urgencia">Urgencia</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Estudios">Estudios</option>
                </Select>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-4 border-t border-black/[0.05]">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Boton variante="secundario" onClick={() => {
                  setModalConfirmacion({ isOpen: false, cita: null, accion: null });
                  setMotivoCancelacion("");
                }}>Volver</Boton>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Boton 
                  variante={modalConfirmacion.accion === 'Confirmar' ? 'primario' : 'peligro'}
                  className={modalConfirmacion.accion === 'Confirmar' ? 'bg-green-600 hover:bg-green-700 border-none' : ''}
                  onClick={handleCambiarEstado}
                >
                  Sí, {modalConfirmacion.accion}
                </Boton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </Modal>

    </motion.div>
  );
}