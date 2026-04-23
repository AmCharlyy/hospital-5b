import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Bed, Search, Edit2, Save, X } from "lucide-react";
import { Modal } from "./comunes/Modal";
import { Boton } from "./comunes/Boton";
import { Select } from "./comunes/Select";
import { Input } from "./comunes/Input";
import { TarjetaConsultorio } from "./comunes/TarjetaConsultorio";
import { TarjetaHabitacion } from "./comunes/TarjetaHabitacion";
import { useAppStore, Habitacion } from "../context/AppContext";
import { apiFetch } from "../api";

const AREAS_MAP: Record<number, string> = {
  1: "Medicina General",
  2: "Pediatría",
  3: "Cardiología",
  4: "Ginecología",
  5: "Traumatología",
  6: "Neurología",
  7: "Oftalmología",
  8: "Odontología"
};

export function Infraestructura() {
  // Las habitaciones y pacientes los seguimos sacando del store global por ahora
  const { habitaciones, addHabitacion, updateHabitacion, deleteHabitacion, pacientes } = useAppStore();
  const [pacientesBD, setPacientesBD] = useState<any[]>([]);
  const [habitacionesBD, setHabitacionesBD] = useState<any[]>([]);
  // Estado para los Consultorios (Conectado a la API)
  const [consultorios, setConsultorios] = useState<any[]>([]);

  const [vistaActiva, setVistaActiva] = useState<"habitaciones" | "consultorios">("habitaciones");
  const [busqueda, setBusqueda] = useState("");

  // Estados para Habitaciones
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<Habitacion | null>(null);
  const [pacienteAAsignar, setPacienteAAsignar] = useState<number | "">("");
  const [modalNuevaHabitacion, setModalNuevaHabitacion] = useState(false);
  const [nuevaHabitacion, setNuevaHabitacion] = useState({ id: "", tipo: "Habitación", piso: "" });
  const [modoEdicionHabitacion, setModoEdicionHabitacion] = useState(false);
  const [habitacionEditada, setHabitacionEditada] = useState<Partial<Habitacion>>({});

  // Estados para Consultorios
  const [consultorioSeleccionado, setConsultorioSeleccionado] = useState<any | null>(null);
  const [modalNuevoConsultorio, setModalNuevoConsultorio] = useState(false);
  const [nuevoConsultorio, setNuevoConsultorio] = useState({ id_consultorio: "", nombre_consultorio: "", piso: "", edificio: "", id_area: "" });
  const [modoEdicionConsultorio, setModoEdicionConsultorio] = useState(false);
  const [consultorioEditado, setConsultorioEditado] = useState<any>({});

  // --- FETCH A LA BASE DE DATOS ---
  const fetchConsultorios = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/consultorios");
      const data = await res.json();
      const consultoriosFormateados = data.map((c: any) => ({
        id_consultorio: c.id_consultorio, // Corregido: tu BD devuelve id_consultorio, no id_ui
        nombre_consultorio: c.nombre_consultorio || c.nombre,
        estado: c.disponible ? "disponible" : "ocupado",
        piso: c.piso || 1,
        edificio: c.edificio || "Principal",
        id_area: c.id_area || 1
      }));
      setConsultorios(consultoriosFormateados);
    } catch (error) { console.error("Error al cargar consultorios:", error); }
  };

  const fetchPacientes = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/pacientes/completo");
      const data = await res.json();
      setPacientesBD(data);
    } catch (error) { console.error("Error al cargar pacientes:", error); }
  };

  const fetchHabitaciones = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/habitaciones");
      const data = await res.json();

      // Adaptamos los datos de la Base de Datos para que tu TarjetaHabitacion los entienda sin dar errores
      const habitacionesFormateadas = data.map((h: any) => ({
        id: String(h.numero_habitacion), // Usamos el número de habitación como ID visual
        id_bd: h.id_habitacion, // Guardamos el ID real de la base de datos por si lo ocupamos para editar/borrar
        tipo: h.tipo_habitacion || "Habitación",
        estado: (h.estado || "disponible").toLowerCase(), // 'Disponible' pasa a 'disponible'
        pacienteId: h.id_paciente || null,
        tiempo: null // Esto se puede calcular después si la BD te da la fecha de ingreso
      }));

      setHabitacionesBD(habitacionesFormateadas);
    } catch (error) {
      console.error("Error al cargar habitaciones:", error);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      await Promise.all([fetchConsultorios(), fetchPacientes(), fetchHabitaciones()]);
    };
    cargar();
  }, []);

  // --- LÓGICA DE CONSULTORIOS (Simulada localmente hasta tener POST/PUT en Backend) ---
  const handleCrearConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("http://localhost:3333/api/consultorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_consultorio: nuevoConsultorio.nombre_consultorio,
          piso: Number(nuevoConsultorio.piso),
          edificio: nuevoConsultorio.edificio || "Principal",
          id_area: Number(nuevoConsultorio.id_area) || 1
        })
      });
      if (res.ok) {
        setModalNuevoConsultorio(false);
        setNuevoConsultorio({ id_consultorio: "", nombre_consultorio: "", piso: "", edificio: "", id_area: "" });
        fetchConsultorios(); // Recargar la lista desde la BD
      }
    } catch (error) { console.error("Error al crear consultorio:", error); }
  };

  const handleEliminarConsultorio = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este consultorio?")) return;
    try {
      const res = await apiFetch(`http://localhost:3333/api/consultorios/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConsultorioSeleccionado(null);
        fetchConsultorios(); // Recargar
      } else {
        alert("No se puede eliminar porque tiene citas enlazadas.");
      }
    } catch (error) { console.error("Error:", error); }
  };

  const actualizarEstadoConsultorio = async (id: number, nuevoEstado: string) => {
    try {
      const isDisponible = nuevoEstado === "disponible";

      await apiFetch(`http://localhost:3333/api/consultorios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponible: isDisponible })
      });
      setConsultorioSeleccionado(null);
      fetchConsultorios();
    } catch (error) { console.error("Error:", error); }
  };

  const iniciarEdicionConsultorio = () => {
    if (consultorioSeleccionado) {
      setConsultorioEditado(consultorioSeleccionado);
      setModoEdicionConsultorio(true);
    }
  };

  const guardarEdicionConsultorio = async () => {
    if (!consultorioSeleccionado || !consultorioEditado) return;
    try {
      await apiFetch(`http://localhost:3333/api/consultorios/${consultorioSeleccionado.id_consultorio}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_consultorio: consultorioEditado.nombre_consultorio,
          piso: Number(consultorioEditado.piso),
          edificio: consultorioEditado.edificio,
          id_area: Number(consultorioEditado.id_area)
        })
      });
      setModoEdicionConsultorio(false);
      setConsultorioSeleccionado(null);
      fetchConsultorios();
    } catch (error) { console.error("Error:", error); }
  };


  /*==============
      HABITACIONES
    ==============*/

  // --- LÓGICA DE HABITACIONES ---
  /*{crear habitacion}*/
  const handleCrearHabitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("http://localhost:3333/api/habitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_habitacion: nuevaHabitacion.id,
          piso: Number(nuevaHabitacion.piso) || 1, // Asegúrate de tener 'piso' en tu estado 'nuevaHabitacion'
          tipo_habitacion: nuevaHabitacion.tipo,
          costo_dia: 0
        })
      });
      if (res.ok) {
        setModalNuevaHabitacion(false);
        setNuevaHabitacion({ id: "", tipo: "Habitación", piso: "" });
        fetchHabitaciones(); // Recargar desde BD
      }
    } catch (error) { console.error("Error:", error); }
  };
  /*{Actualizar estado Habitaciones}*/
  const actualizarEstado = async (idVisual: string, nuevoEstado: string, pacienteId: number | null = null) => {
    const habitacionReal = habitacionesBD.find(h => h.id === idVisual);
    if (!habitacionReal) return;

    try {
      await apiFetch(`http://localhost:3333/api/habitaciones/${habitacionReal.id_bd}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1) }) // Ej: "Disponible"
      });

      setHabitacionSeleccionada(null);
      setPacienteAAsignar("");
      fetchHabitaciones();
    } catch (error) { console.error("Error:", error); }
  };

  /*Menu modal para edicion*/
  const iniciarEdicionHabitacion = () => {
    if (habitacionSeleccionada) {
      setHabitacionEditada(habitacionSeleccionada);
      setModoEdicionHabitacion(true);
    }
  };
  /*{Guardar edicion de las habitaciones}*/
  const guardarEdicionHabitacion = async () => {
    if (!habitacionSeleccionada || !habitacionEditada) return;
    try {
      await apiFetch(`http://localhost:3333/api/habitaciones/${habitacionSeleccionada.id_bd}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_habitacion: habitacionEditada.id,
          piso: Number(habitacionEditada.piso) || 1,
          tipo_habitacion: habitacionEditada.tipo,
          costo_dia: habitacionEditada.costo_dia || 0
        })
      });
      setModoEdicionHabitacion(false);
      setHabitacionSeleccionada(null);
      fetchHabitaciones();
    } catch (error) { console.error("Error:", error); }
  };

  //Eliminar habitaciones
  const handleEliminarHabitacion = async (idVisual: string) => {
    if(!confirm("¿Seguro que deseas eliminar esta habitación?")) return;
    const habitacionReal = habitacionesBD.find(h => h.id === idVisual);
    if (!habitacionReal) return;

    try {
      const res = await apiFetch(`http://localhost:3333/api/habitaciones/${habitacionReal.id_bd}`, { method: "DELETE" });
      if(res.ok){
        setHabitacionSeleccionada(null);
        fetchHabitaciones();
      } else {
        alert("No se puede eliminar. Puede que tenga pacientes asignados.");
      }
    } catch (error) { console.error("Error:", error); }
  };

  // --- FILTROS Y ESTADÍSTICAS ---
  const habitacionesFiltradas = useMemo(() => {
    return habitacionesBD.filter(h =>
      h.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.tipo.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [habitacionesBD, busqueda]);

  const consultoriosFiltrados = useMemo(() => {
    return consultorios.filter(c =>
      c.nombre_consultorio.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.edificio.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.id_consultorio.toString().includes(busqueda)
    );
  }, [consultorios, busqueda]);

  const statsHabitaciones = useMemo(() => {
    return consultorios.filter(c =>
      c.nombre_consultorio.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.edificio.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.id_consultorio.toString().includes(busqueda)
    );
  }, [consultorios, busqueda]);

  const statsConsultorios = {
    total: consultorios.length,
    disponibles: consultorios.filter(c => c.estado === 'disponible').length,
    ocupados: consultorios.filter(c => c.estado === 'ocupada' || c.estado === 'ocupado').length,
    mantenimiento: consultorios.filter(c => c.estado === 'mantenimiento' || c.estado === 'limpieza').length
  };

  const pacientesActivos = pacientesBD.filter(p =>
    (p.estado || p.status || "").toUpperCase() === "EN ESPERA" || // Ajustado a los status de tu BD
    (p.estado || p.status || "").toUpperCase() === "HOSPITALIZADO" ||
    p.id_paciente
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Infraestructura y Espacios</h1>
          <p className="text-[#86868b] mt-1">Control de habitaciones, consultorios y ocupación general.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder={`Buscar ${vistaActiva}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full sm:w-64"
            />
          </div>
          <Boton onClick={() => vistaActiva === "habitaciones" ? setModalNuevaHabitacion(true) : setModalNuevoConsultorio(true)}>
            <Plus className="w-5 h-5" />
            Añadir {vistaActiva === "habitaciones" ? "Habitación" : "Consultorio"}
          </Boton>
        </div>
      </header>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {vistaActiva === "habitaciones" ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-sm">
              <p className="text-sm text-[#86868b] font-medium">Total Habitaciones</p>
              <p className="text-2xl font-bold text-[#1d1d1f] mt-1">{statsHabitaciones.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
              <p className="text-sm text-green-700 font-medium">Disponibles</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{statsHabitaciones.disponibles}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
              <p className="text-sm text-red-700 font-medium">Ocupadas</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{statsHabitaciones.ocupadas}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm">
              <p className="text-sm text-orange-700 font-medium">Limpieza / Mant.</p>
              <p className="text-2xl font-bold text-orange-800 mt-1">{statsHabitaciones.mantenimiento}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-2xl border border-black/[0.05] shadow-sm">
              <p className="text-sm text-[#86868b] font-medium">Total Consultorios</p>
              <p className="text-2xl font-bold text-[#1d1d1f] mt-1">{statsConsultorios.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
              <p className="text-sm text-green-700 font-medium">Disponibles</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{statsConsultorios.disponibles}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
              <p className="text-sm text-red-700 font-medium">Ocupados</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{statsConsultorios.ocupados}</p>
            </div>
          </>
        )}
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-6 border-b border-black/[0.05]">
        <button
          onClick={() => setVistaActiva("habitaciones")}
          className={`flex items-center gap-2 text-sm font-semibold pb-4 -mb-[1px] transition-colors ${vistaActiva === "habitaciones" ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"}`}
        >
          <Bed className="w-4 h-4" />
          Habitaciones
        </button>
        <button
          onClick={() => setVistaActiva("consultorios")}
          className={`flex items-center gap-2 text-sm font-semibold pb-4 -mb-[1px] transition-colors ${vistaActiva === "consultorios" ? "text-[#1d1d1f] border-b-2 border-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"}`}
        >
          <Building2 className="w-4 h-4" />
          Consultorios
        </button>
      </div>

      {/* Leyenda de Colores */}
      <div className="flex gap-4 text-sm font-medium">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[#86868b]">Ocupado / En Uso</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-[#86868b]">Disponible</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400"></div><span className="text-[#86868b]">Mantenimiento</span></div>
      </div>

      {/* Cuadrícula Principal */}
      {vistaActiva === "habitaciones" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {habitacionesFiltradas.length > 0 ? habitacionesFiltradas.map((habitacion) => {
            const paciente = pacientes.find(p => p.id_paciente === habitacion.pacienteId);
            return (
              <TarjetaHabitacion
                key={habitacion.id}
                habitacion={{ ...habitacion, paciente: paciente ? paciente.nombre_paciente : null }}
                onClick={() => setHabitacionSeleccionada(habitacion)}
              />
            );
          }) : (
            <div className="col-span-full py-12 text-center text-[#86868b]">
              No se encontraron habitaciones que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {vistaActiva === "consultorios" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {consultoriosFiltrados.length > 0 ? consultoriosFiltrados.map((consultorio) => (
            <TarjetaConsultorio
              key={consultorio.id_consultorio}
              consultorio={consultorio}
              onClick={() => setConsultorioSeleccionado(consultorio)}
            />
          )) : (
            <div className="col-span-full py-12 text-center text-[#86868b]">
              No se encontraron consultorios que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* MODALES PARA HABITACIONES */}
      <Modal isOpen={modalNuevaHabitacion} onClose={() => setModalNuevaHabitacion(false)} titulo="Añadir Nueva Habitación">
        <form onSubmit={handleCrearHabitacion} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Identificador (Ej. 104, C-05)"
              placeholder="ID del espacio"
              required
              value={nuevaHabitacion.id}
              onChange={(e) => setNuevaHabitacion({ ...nuevaHabitacion, id: e.target.value })}
            />
            <Input
              label="Piso"
              type="number"
              placeholder="Ej. 1, 2, 3..."
              required
              value={nuevaHabitacion.piso}
              onChange={(e) => setNuevaHabitacion({ ...nuevaHabitacion, piso: e.target.value })}
            />
          </div>
          <Select
            label="Tipo de Espacio"
            value={nuevaHabitacion.tipo}
            onChange={(e) => setNuevaHabitacion({ ...nuevaHabitacion, tipo: e.target.value })}
          >
            <option value="Habitación">Habitación Regular</option>
            <option value="Urgencias">Cama de Urgencias</option>
            <option value="UCI">Unidad de Cuidados Intensivos (UCI)</option>
            <option value="Consultorio">Consultorio Médico</option>
            <option value="Quirófano">Quirófano</option>
          </Select>
          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevaHabitacion(false)}>Cancelar</Boton>
            <Boton type="submit">Crear Habitación</Boton>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!habitacionSeleccionada} onClose={() => {
        setHabitacionSeleccionada(null);
        setPacienteAAsignar("");
        setModoEdicionHabitacion(false);
      }} titulo={modoEdicionHabitacion ? "Editar Habitación" : "Detalles de Habitación"}>
        {habitacionSeleccionada && (
          <div className="space-y-6">
            {!modoEdicionHabitacion ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1d1d1f]">{habitacionSeleccionada.id}</h3>
                    <p className="text-[#86868b] uppercase tracking-wider text-xs font-semibold mt-1">{habitacionSeleccionada.tipo}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${habitacionSeleccionada.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
                    habitacionSeleccionada.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                    {habitacionSeleccionada.estado.charAt(0).toUpperCase() + habitacionSeleccionada.estado.slice(1)}
                  </span>
                </div>

                {habitacionSeleccionada.estado === 'ocupada' && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05]">
                    <p className="text-sm text-[#86868b] mb-1">Paciente Actual</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-medium text-[#1d1d1f]">
                        {pacientes.find(p => p.id_paciente === habitacionSeleccionada.pacienteId)?.nombre_paciente || "Desconocido"}
                      </p>
                      <span className="text-xs font-normal text-[#86868b] bg-gray-200 px-2 py-0.5 rounded-md">
                        {pacientes.find(p => p.id_paciente === habitacionSeleccionada.pacienteId)?.folio || ""}
                      </span>
                    </div>
                    <p className="text-sm text-[#86868b] mt-2">Tiempo de ocupación: {habitacionSeleccionada.tiempo}</p>
                  </div>
                )}

                {habitacionSeleccionada.estado === 'disponible' && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] space-y-3">
                    <label className="text-sm font-medium text-[#1d1d1f]">Seleccionar Paciente para Ingreso</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-black/[0.05] shadow-sm"
                      value={pacienteAAsignar}
                      onChange={(e) => setPacienteAAsignar(e.target.value)} // Ya no requiere Number() si el ID es string en el paciente
                    >
                      <option value="">-- Seleccione un paciente --</option>
                      {pacientesActivos.map((p) => (
                        <option key={p.id_paciente} value={p.id_paciente}>
                          {p.nombre_paciente} (Folio: P-{p.id_paciente})
                        </option>
                      ))}
                    </select>
                    <Boton
                      className="w-full"
                      onClick={() => actualizarEstado(habitacionSeleccionada.id, "ocupada", pacienteAAsignar === "" ? null : Number(pacienteAAsignar))}
                      disabled={pacienteAAsignar === ""}
                    >
                      Ingresar Paciente
                    </Boton>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
                  <div className="grid grid-cols-2 gap-3">
                    {habitacionSeleccionada.estado !== 'disponible' && habitacionSeleccionada.estado !== 'ocupada' && (
                      <Boton className="w-full" onClick={() => actualizarEstado(habitacionSeleccionada.id, "disponible")}>
                        Marcar Disponible
                      </Boton>
                    )}
                    {habitacionSeleccionada.estado === 'ocupada' && (
                      <Boton className="w-full" onClick={() => actualizarEstado(habitacionSeleccionada.id, "limpieza")}>
                        Dar de Alta
                      </Boton>
                    )}
                    {habitacionSeleccionada.estado !== 'mantenimiento' && habitacionSeleccionada.estado !== 'ocupada' && (
                      <Boton className="w-full" variante="secundario" onClick={() => actualizarEstado(habitacionSeleccionada.id, "mantenimiento")}>
                        Mantenimiento
                      </Boton>
                    )}
                    {habitacionSeleccionada.estado !== 'limpieza' && habitacionSeleccionada.estado !== 'ocupada' && (
                      <Boton className="w-full" variante="secundario" onClick={() => actualizarEstado(habitacionSeleccionada.id, "limpieza")}>
                        Limpieza
                      </Boton>
                    )}
                  </div>

                  <Boton className="w-full" variante="secundario" onClick={iniciarEdicionHabitacion}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Detalles
                  </Boton>
                  <Boton variante="secundario" onClick={() => { setHabitacionSeleccionada(null); setPacienteAAsignar(""); }}>Cerrar</Boton>

                  {habitacionSeleccionada.estado !== 'ocupada' && (
                    <Boton variante="peligro" onClick={() => handleEliminarHabitacion(habitacionSeleccionada.id)}>Eliminar Habitación</Boton>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Identificador (Ej. 104, C-05)"
                  value={habitacionEditada.id || ""}
                  onChange={(e) => setHabitacionEditada({ ...habitacionEditada, id: e.target.value })}
                />
                <Select
                  label="Tipo de Espacio"
                  value={habitacionEditada.tipo || ""}
                  onChange={(e) => setHabitacionEditada({ ...habitacionEditada, tipo: e.target.value })}
                >
                  <option value="Habitación">Habitación Regular</option>
                  <option value="Urgencias">Cama de Urgencias</option>
                  <option value="UCI">Unidad de Cuidados Intensivos (UCI)</option>
                  <option value="Consultorio">Consultorio Médico</option>
                  <option value="Quirófano">Quirófano</option>
                </Select>

                <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
                  <Boton onClick={guardarEdicionHabitacion}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Boton>
                  <Boton variante="secundario" onClick={() => setModoEdicionHabitacion(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Boton>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODALES PARA CONSULTORIOS */}
      <Modal isOpen={modalNuevoConsultorio} onClose={() => setModalNuevoConsultorio(false)} titulo="Añadir Nuevo Consultorio">
        <form onSubmit={handleCrearConsultorio} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ID Consultorio"
              type="number"
              placeholder="Ej. 101"
              required
              value={nuevoConsultorio.id_consultorio}
              onChange={(e) => setNuevoConsultorio({ ...nuevoConsultorio, id_consultorio: e.target.value })}
            />
            <Input
              label="Nombre Consultorio"
              placeholder="Ej. Pediatría 1"
              required
              value={nuevoConsultorio.nombre_consultorio}
              onChange={(e) => setNuevoConsultorio({ ...nuevoConsultorio, nombre_consultorio: e.target.value })}
            />
            <Input
              label="Piso"
              type="number"
              placeholder="Ej. 1"
              required
              value={nuevoConsultorio.piso}
              onChange={(e) => setNuevoConsultorio({ ...nuevoConsultorio, piso: e.target.value })}
            />
            <Input
              label="Edificio"
              placeholder="Ej. Principal"
              required
              value={nuevoConsultorio.edificio}
              onChange={(e) => setNuevoConsultorio({ ...nuevoConsultorio, edificio: e.target.value })}
            />
            <Input
              label="ID Área"
              type="number"
              placeholder="Ej. 1"
              required
              value={nuevoConsultorio.id_area}
              onChange={(e) => setNuevoConsultorio({ ...nuevoConsultorio, id_area: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevoConsultorio(false)}>Cancelar</Boton>
            <Boton type="submit">Crear Consultorio</Boton>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!consultorioSeleccionado} onClose={() => {
        setConsultorioSeleccionado(null);
        setModoEdicionConsultorio(false);
      }} titulo={modoEdicionConsultorio ? "Editar Consultorio" : "Detalles de Consultorio"}>
        {consultorioSeleccionado && (
          <div className="space-y-6">
            {!modoEdicionConsultorio ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1d1d1f]">{consultorioSeleccionado.nombre_consultorio}</h3>
                    <p className="text-[#86868b] uppercase tracking-wider text-xs font-semibold mt-1">ID: {consultorioSeleccionado.id_consultorio}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${consultorioSeleccionado.estado === 'ocupado' || consultorioSeleccionado.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
                    consultorioSeleccionado.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                    {consultorioSeleccionado.estado.charAt(0).toUpperCase() + consultorioSeleccionado.estado.slice(1)}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#86868b]">Edificio</span>
                    <span className="text-sm font-medium text-[#1d1d1f]">{consultorioSeleccionado.edificio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#86868b]">Piso</span>
                    <span className="text-sm font-medium text-[#1d1d1f]">{consultorioSeleccionado.piso}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#86868b]">Área Asignada</span>
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {AREAS_MAP[consultorioSeleccionado.id_area] || `Área ${consultorioSeleccionado.id_area}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
                  <div className="grid grid-cols-2 gap-3">
                    {consultorioSeleccionado.estado !== 'disponible' && (
                      <Boton className="w-full" onClick={() => actualizarEstadoConsultorio(consultorioSeleccionado.id_consultorio, 'disponible')}>
                        Marcar Disponible
                      </Boton>
                    )}
                    {consultorioSeleccionado.estado !== 'ocupado' && consultorioSeleccionado.estado !== 'ocupada' && (
                      <Boton className="w-full" onClick={() => actualizarEstadoConsultorio(consultorioSeleccionado.id_consultorio, 'ocupado')}>
                        Marcar Ocupado
                      </Boton>
                    )}
                    {consultorioSeleccionado.estado !== 'mantenimiento' && (
                      <Boton className="w-full" variante="secundario" onClick={() => actualizarEstadoConsultorio(consultorioSeleccionado.id_consultorio, 'mantenimiento')}>
                        Mantenimiento
                      </Boton>
                    )}
                    {consultorioSeleccionado.estado !== 'limpieza' && (
                      <Boton className="w-full" variante="secundario" onClick={() => actualizarEstadoConsultorio(consultorioSeleccionado.id_consultorio, 'limpieza')}>
                        Limpieza
                      </Boton>
                    )}
                  </div>
                  <Boton className="w-full" variante="secundario" onClick={iniciarEdicionConsultorio}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Detalles
                  </Boton>
                  <Boton variante="secundario" onClick={() => setConsultorioSeleccionado(null)}>Cerrar</Boton>
                  <Boton variante="peligro" onClick={() => handleEliminarConsultorio(consultorioSeleccionado.id_consultorio)}>Eliminar Consultorio</Boton>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Nombre Consultorio"
                  value={consultorioEditado.nombre_consultorio || ""}
                  onChange={(e) => setConsultorioEditado({ ...consultorioEditado, nombre_consultorio: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Piso"
                    type="number"
                    value={consultorioEditado.piso?.toString() || ""}
                    onChange={(e) => setConsultorioEditado({ ...consultorioEditado, piso: Number(e.target.value) })}
                  />
                  <Input
                    label="Edificio"
                    value={consultorioEditado.edificio || ""}
                    onChange={(e) => setConsultorioEditado({ ...consultorioEditado, edificio: e.target.value })}
                  />
                </div>
                <Select
                  label="Área Asignada"
                  value={consultorioEditado.id_area?.toString() || ""}
                  onChange={(e) => setConsultorioEditado({ ...consultorioEditado, id_area: Number(e.target.value) })}
                >
                  {Object.entries(AREAS_MAP).map(([id, nombre]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
                </Select>

                <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
                  <Boton onClick={guardarEdicionConsultorio}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Boton>
                  <Boton variante="secundario" onClick={() => setModoEdicionConsultorio(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Boton>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}