import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { TarjetaEmpleado } from "./comunes/TarjetaEmpleado";
import { Modal } from "./comunes/Modal";
import { Boton } from "./comunes/Boton";
import { Input } from "./comunes/Input";
import { Select } from "./comunes/Select";
import { apiFetch } from "../api";

export function DirectorioPersonal() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any | null>(null);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<any | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTab, setFiltroTab] = useState("Todos");
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [confirmandoBaja, setConfirmandoBaja] = useState<any | null>(null);

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "", rol: "", id_especialidad: "",
    tipo: "doctor", cedula_profesional: "",
    telefono: "", correo: "", usuario: "",
    contrasena: "", consultorio: ""
  });

  // 🛡️ Gafete para JWT
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('hospital_token') || ''}`
  });

  // --- GET: Personal ---
  const fetchEmpleados = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/personal/completo");
      if (res.status === 401 || res.status === 403) { window.location.reload(); return; }
      
      const data = await res.json();
      if (!Array.isArray(data)) { setEmpleados([]); return; }

      const personalFormateado = data.map((emp: any) => {
        const partes = (emp.nombre || "").trim().split(" ");
        const iniciales = partes.length > 1
          ? (partes[0][0] + partes[1][0]).toUpperCase()
          : (emp.nombre || "??").substring(0, 2).toUpperCase();

        return {
          id: `${emp.tipo.substring(0, 3).toUpperCase()}-${emp.id_real}`,
          id_real: emp.id_real,
          nombre: emp.nombre || "Sin nombre",
          rol: emp.especialidad || "General",
          id_especialidad: emp.id_especialidad ?? null,
          tipo: emp.tipo,
          estado: emp.estado_actual || "Disponible",
          avatar: iniciales,
          cedula_profesional: emp.cedula_profesional || "",
          telefono: emp.telefono || "",
          correo: emp.correo || "",
          usuario: emp.usuario || "",
          consultorio: emp.consultorio || ""
        };
      });
      setEmpleados(personalFormateado);
    } catch (error) {
      console.error("Error al cargar personal:", error);
      setEmpleados([]);
    }
  };

  // --- GET: Consultorios disponibles ---
  const fetchConsultorios = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/consultorios-disponibles", { headers: getHeaders() });
      const data = await res.json();
      setConsultorios(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Error al cargar consultorios:", error); }
  };

  // --- GET: Especialidades ---
  const fetchEspecialidades = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/especialidades", { headers: getHeaders() });
      const data = await res.json();
      setEspecialidades(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Error al cargar especialidades:", error); }
  };

  useEffect(() => {
    fetchEmpleados();
    fetchConsultorios();
    fetchEspecialidades();
  }, []);

  // Filtrado
  const empleadosFiltrados = empleados.filter((emp) => {
    const coincideTab =
      filtroTab === "Todos" ||
      (filtroTab === "Doctores" && emp.tipo === "doctor") ||
      (filtroTab === "Enfermería" && emp.tipo === "enfermero") ||
      (filtroTab === "Administrativos" && emp.tipo === "administrativo");

    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      (emp.nombre || "").toLowerCase().includes(term) ||
      (emp.rol || "").toLowerCase().includes(term);

    return coincideTab && coincideBusqueda;
  });

  // --- POST: Crear nuevo personal ---
 const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = "";
    if (nuevoEmpleado.tipo === 'doctor') endpoint = "http://localhost:3333/api/doctores";
    else if (nuevoEmpleado.tipo === 'administrativo') endpoint = "http://localhost:3333/api/administrativos";
    else if (nuevoEmpleado.tipo === 'enfermero') endpoint = "http://localhost:3333/api/enfermeros";

    if (!endpoint) return alert("Ruta no configurada para este rol.");

    // 1. Iniciamos el body con lo básico
    const body: Record<string, any> = { 
      nombre: nuevoEmpleado.nombre 
    };

    // 2. Empacamos según la profesión
    if (nuevoEmpleado.tipo === "doctor") {
      body.cedula_profesional = nuevoEmpleado.cedula_profesional;
      body.telefono = nuevoEmpleado.telefono;
      body.correo = nuevoEmpleado.correo;
      body.usuario = nuevoEmpleado.usuario;
      body.contrasena = nuevoEmpleado.contrasena;
      body.consultorio = nuevoEmpleado.consultorio || null;
      body.id_especialidad = nuevoEmpleado.id_especialidad ? Number(nuevoEmpleado.id_especialidad) : null;
    } 
    else if (nuevoEmpleado.tipo === "enfermero") {
      // 🚨 AQUÍ ESTÁ LA CURA PARA LOS ENFERMEROS (AUXILIARES EN BD) 🚨
      
      // Separamos nombre y apellido por si el usuario lo escribió todo junto
      const partes = nuevoEmpleado.nombre.trim().split(" ");
      body.nombre = partes[0]; 
      body.apellido = partes.slice(1).join(" ") || "Sin apellido"; 
      
      body.tipo_auxiliar = "Enfermería"; // El backend requiere 'tipo_auxiliar'
      body.area = nuevoEmpleado.rol;     // El área seleccionada (UCI, Urgencias...)
      body.turno = "Matutino";           // Turno por defecto
      
      // Datos de contacto (aunque la tabla de auxiliares actual no tiene login, sí tiene tlf y correo)
      body.telefono = nuevoEmpleado.telefono;
      body.correo = nuevoEmpleado.correo;
      body.usuario = nuevoEmpleado.usuario;
      body.contrasena = nuevoEmpleado.contrasena;
    } 
    else {
      // Administrativo
      body.puesto = nuevoEmpleado.rol || "Administrativo General";
      body.usuario = nuevoEmpleado.usuario;
      body.contrasena = nuevoEmpleado.contrasena;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setModalNuevo(false);
        setNuevoEmpleado({
          nombre: "", rol: "", id_especialidad: "", tipo: "doctor",
          cedula_profesional: "", telefono: "", correo: "",
          usuario: "", contrasena: "", consultorio: ""
        });
        fetchEmpleados();
        alert("¡Personal registrado con éxito!");
      } else {
        const errorData = await res.json();
        alert("Error al registrar: " + errorData.error);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  // --- PUT: Editar personal ---
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoAEditar) return;
    
    const endpoints: Record<string, string> = {
      doctor: `http://localhost:3333/api/doctores/${empleadoAEditar.id_real}`,
      administrativo: `http://localhost:3333/api/administrativos/${empleadoAEditar.id_real}`,
      enfermero: `http://localhost:3333/api/enfermeros/${empleadoAEditar.id_real}`,
    };
    const endpoint = endpoints[empleadoAEditar.tipo];
    if (!endpoint) return alert("Tipo de personal no soportado para edición.");

    const body: Record<string, any> = { nombre: empleadoAEditar.nombre };
    
    if (empleadoAEditar.tipo === "doctor") {
      body.nombre_doctor = empleadoAEditar.nombre;
      body.id_especialidad = empleadoAEditar.id_especialidad ? Number(empleadoAEditar.id_especialidad) : null;
      body.cedula_profesional = empleadoAEditar.cedula_profesional;
      body.telefono = empleadoAEditar.telefono;
      body.correo = empleadoAEditar.correo;
      body.consultorio = empleadoAEditar.consultorio || null;
      body.estado = empleadoAEditar.estado || "Disponible";
    } else if (empleadoAEditar.tipo === "enfermero") {
      body.telefono = empleadoAEditar.telefono;
      body.correo = empleadoAEditar.correo;
      body.estado = empleadoAEditar.estado || "Activo";
      body.area = empleadoAEditar.rol;
    } else {
      body.puesto = empleadoAEditar.rol || "Administrativo General";
      body.usuario = empleadoAEditar.usuario;
    }

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEmpleadoAEditar(null);
        fetchEmpleados();
        fetchConsultorios();
        alert("Datos actualizados correctamente");
      } else {
        const errorData = await res.json();
        alert("Error: " + errorData.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error al actualizar.");
    }
  };

  // --- DELETE: Dar de baja ---
  const handleDarDeBaja = async (empleado: any) => {
    const endpoints: Record<string, string> = {
      doctor: `http://localhost:3333/api/doctores/${empleado.id_real}`,
      administrativo: `http://localhost:3333/api/administrativos/${empleado.id_real}`,
      enfermero: `http://localhost:3333/api/enfermeros/${empleado.id_real}`,
    };
    const endpoint = endpoints[empleado.tipo];
    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, { method: "DELETE", headers: getHeaders() });
      if (res.ok) {
        setConfirmandoBaja(null);
        fetchEmpleados();
      } else {
        alert("Error al dar de baja.");
      }
    } catch (error) { console.error("Error al eliminar:", error); }
  };

  // --- PUT: Reingresar ---
  const handleReingresarPersonal = async (empleado: any) => {
    const endpoints: Record<string, string> = {
      doctor: `http://localhost:3333/api/doctores/${empleado.id_real}/reingresar`,
      // Asegúrate de tener estas rutas en tu backend si quieres reingresar enfermeros/admin
      administrativo: `http://localhost:3333/api/administrativos/${empleado.id_real}/reingresar`,
      enfermero: `http://localhost:3333/api/enfermeros/${empleado.id_real}/reingresar`,
    };
    const endpoint = endpoints[empleado.tipo];
    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, { method: 'PUT', headers: getHeaders() });
      if (res.ok) {
        alert("Personal reingresado con éxito.");
        fetchEmpleados();
      }
    } catch (error) { console.error("Error al reingresar:", error); }
  };

  const getTabClass = (tabName: string) =>
    filtroTab === tabName
      ? "text-sm font-semibold text-[#1d1d1f] border-b-2 border-[#1d1d1f] pb-4 -mb-4 transition-colors"
      : "text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] pb-4 -mb-4 transition-colors";

    const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case "ACTIVO": return "bg-green-500";
      case "BAJA": return "bg-red-500"; // O "Eliminado" si así lo manejas
      default: return "bg-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Directorio Médico</h1>
          <p className="text-[#86868b] mt-1">Gestión de personal, roles y disponibilidad.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="Buscar personal..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-64"
            />
          </div>
          <Boton onClick={() => setModalNuevo(true)}>
            <Plus className="w-5 h-5" /> Añadir Personal
          </Boton>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-visible">
        <div className="flex items-center gap-6 px-6 py-4 border-b border-black/[0.05]">
          {["Todos", "Doctores", "Enfermería", "Administrativos"].map(tab => (
            <button key={tab} onClick={() => setFiltroTab(tab)} className={getTabClass(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible">
            {empleadosFiltrados.length > 0 ? (
              empleadosFiltrados.map((empleado) => (
                <TarjetaEmpleado
                  key={empleado.id}
                  empleado={empleado}
                  colorEstado={getEstadoColor(empleado.estado)}
                  onClick={() => setEmpleadoSeleccionado(empleado)}
                  opciones={[
                    { etiqueta: "Ver Perfil", accion: () => setEmpleadoSeleccionado(empleado) },
                    { etiqueta: "Editar Datos", accion: () => setEmpleadoAEditar(empleado) },
                    
                    // Botón Inteligente: Reingresar si está dado de baja, Eliminar si está activo
                    empleado.estado === 'Inactivo' || empleado.estado === 'Eliminado'
                      ? { etiqueta: "Reingresar al Sistema", accion: () => handleReingresarPersonal(empleado), peligro: false }
                      : { etiqueta: "Dar de Baja", accion: () => setConfirmandoBaja(empleado), peligro: true },
                  ]}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-[#86868b]">
                No se encontró personal con los filtros actuales.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Confirmar Baja ── */}
      <Modal isOpen={!!confirmandoBaja} onClose={() => setConfirmandoBaja(null)} titulo="Confirmar baja">
        {confirmandoBaja && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-red-500 text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-800">¿Dar de baja a este empleado?</p>
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-semibold">{confirmandoBaja.nombre}</span> quedará como inactivo en el sistema.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Boton type="button" variante="secundario" onClick={() => setConfirmandoBaja(null)}>Cancelar</Boton>
              <Boton
                type="button"
                className="bg-red-500 hover:bg-red-600 text-white border-none"
                onClick={() => handleDarDeBaja(confirmandoBaja)}
              >
                Sí, dar de baja
              </Boton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: Añadir nuevo personal ── */}
      <Modal isOpen={modalNuevo} onClose={() => setModalNuevo(false)} titulo="Añadir Nuevo Personal">
        <form onSubmit={handleCrear} className="space-y-4">
          <Input
            label="Nombre Completo" placeholder="Ej. Dr. Juan Pérez" required
            value={nuevoEmpleado.nombre}
            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
          />

          <Select
            label="Tipo de Personal"
            value={nuevoEmpleado.tipo}
            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, tipo: e.target.value, rol: "", id_especialidad: "" })}
          >
            <option value="doctor">Doctor(a)</option>
            <option value="enfermero">Enfermero(a)</option>
            <option value="administrativo">Administrativo</option>
          </Select>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1d1d1f]">
              {nuevoEmpleado.tipo === "doctor" ? "Especialidad Médica" :
               nuevoEmpleado.tipo === "enfermero" ? "Área de Enfermería" : "Puesto Administrativo"}
            </label>
            <select
              required
              className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
              value={nuevoEmpleado.tipo === "doctor" ? nuevoEmpleado.id_especialidad : nuevoEmpleado.rol}
              onChange={(e) => {
                if (nuevoEmpleado.tipo === "doctor") {
                  setNuevoEmpleado({ ...nuevoEmpleado, id_especialidad: e.target.value });
                } else {
                  setNuevoEmpleado({ ...nuevoEmpleado, rol: e.target.value });
                }
              }}
            >
              <option value="">Seleccionar opción...</option>
              {nuevoEmpleado.tipo === "doctor" && (
                <>
                  {especialidades.map((esp) => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>{esp.nombre}</option>
                  ))}
                  <option value="General">Médico General</option>
                </>
              )}
              {nuevoEmpleado.tipo === "enfermero" && (
                <>
                  <option value="Enfermería General">Enfermería General</option>
                  <option value="UCI">UCI (Cuidados Intensivos)</option>
                  <option value="Urgencias">Urgencias</option>
                  <option value="Pediatría">Enfermería Pediátrica</option>
                </>
              )}
              {nuevoEmpleado.tipo === "administrativo" && (
                <>
                  <option value="Recepción">Recepción</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Sistemas">Sistemas / TI</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nuevoEmpleado.tipo !== "administrativo" && (
              <>
                <Input label="Teléfono" placeholder="Ej. 555 123 4567" value={nuevoEmpleado.telefono} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })} />
                <Input label="Correo Electrónico" type="email" placeholder="usuario@hospital.com" value={nuevoEmpleado.correo} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, correo: e.target.value })} />
              </>
            )}

            {nuevoEmpleado.tipo === "doctor" && (
              <>
                <Input label="Cédula Profesional" placeholder="Ej. 1234567" value={nuevoEmpleado.cedula_profesional} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cedula_profesional: e.target.value })} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1d1d1f]">Consultorio</label>
                  <select
                    className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium border border-black/[0.05] shadow-sm w-full"
                    value={nuevoEmpleado.consultorio}
                    onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, consultorio: e.target.value })}
                  >
                    <option value="">Ninguno...</option>
                    {consultorios.map((cons) => <option key={cons.id_consultorio} value={cons.id_consultorio}>{cons.nombre_consultorio}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 pt-2 border-t border-black/[0.05] mt-2">
              <h4 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-3">Datos de Acceso al Sistema</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Usuario" required placeholder="Ej. jperez" value={nuevoEmpleado.usuario} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, usuario: e.target.value })} />
                <Input label="Contraseña" type="password" required placeholder="••••••••" value={nuevoEmpleado.contrasena} onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, contrasena: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevo(false)}>Cancelar</Boton>
            <Boton type="submit">Añadir Personal</Boton>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Editar personal ── */}
      <Modal isOpen={!!empleadoAEditar} onClose={() => setEmpleadoAEditar(null)} titulo="Editar Datos del Personal">
        {empleadoAEditar && (
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <Input
              label="Nombre Completo" required
              value={empleadoAEditar.nombre || ""}
              onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, nombre: e.target.value })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1d1d1f]">
                {empleadoAEditar.tipo === "doctor" ? "Especialidad Médica" :
                 empleadoAEditar.tipo === "enfermero" ? "Área de Enfermería" : "Puesto Administrativo"}
              </label>
              <select
                className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
                value={empleadoAEditar.tipo === "doctor" ? (empleadoAEditar.id_especialidad ?? "") : (empleadoAEditar.rol || "")}
                onChange={(e) => {
                  if (empleadoAEditar.tipo === "doctor") {
                    setEmpleadoAEditar({ ...empleadoAEditar, id_especialidad: e.target.value });
                  } else {
                    setEmpleadoAEditar({ ...empleadoAEditar, rol: e.target.value });
                  }
                }}
              >
                <option value="">Seleccionar opción...</option>
                {empleadoAEditar.tipo === "doctor" && (
                  especialidades.map((esp) => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>{esp.nombre}</option>
                  ))
                )}
                {empleadoAEditar.tipo === "enfermero" && (
                  <>
                    <option value="Enfermería General">Enfermería General</option>
                    <option value="UCI">UCI (Cuidados Intensivos)</option>
                    <option value="Urgencias">Urgencias</option>
                    <option value="Pediatría">Enfermería Pediátrica</option>
                  </>
                )}
                {empleadoAEditar.tipo === "administrativo" && (
                  <>
                    <option value="Recepción">Recepción</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Sistemas">Sistemas / TI</option>
                  </>
                )}
              </select>
            </div>

            {empleadoAEditar.tipo === "doctor" && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula Profesional"
                  value={empleadoAEditar.cedula_profesional || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, cedula_profesional: e.target.value })}
                />
                <Input
                  label="Teléfono"
                  value={empleadoAEditar.telefono || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, telefono: e.target.value })}
                />
                <Input
                  label="Correo Electrónico" type="email"
                  value={empleadoAEditar.correo || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, correo: e.target.value })}
                />
                <Select
                  label="Consultorio"
                  value={empleadoAEditar.consultorio || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, consultorio: e.target.value })}
                >
                  <option value="">Seleccione un consultorio...</option>
                  {consultorios.map((cons) => (
                    <option key={cons.id_consultorio} value={cons.id_consultorio}>{cons.nombre_consultorio}</option>
                  ))}
                </Select>
              </div>
            )}

            {empleadoAEditar.tipo === "administrativo" && (
              <Input
                label="Usuario (Sistema)"
                value={empleadoAEditar.usuario || ""}
                onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, usuario: e.target.value })}
              />
            )}

            <Select
              label="Estado Operativo"
              value={empleadoAEditar.estado || "Disponible"}
              onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, estado: e.target.value })}
            >
              <option value="Disponible">Disponible</option>
              <option value="En Consulta">En Consulta</option>
              <option value="En Turno">En Turno</option>
              <option value="Descanso">Descanso</option>
              <option value="Ausente">Ausente</option>
            </Select>

            <div className="pt-4 flex justify-end gap-3">
              <Boton type="button" variante="secundario" onClick={() => setEmpleadoAEditar(null)}>Cancelar</Boton>
              <Boton type="submit">Guardar Cambios</Boton>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL: Perfil ── */}
      <Modal isOpen={!!empleadoSeleccionado} onClose={() => setEmpleadoSeleccionado(null)} titulo="Perfil del Personal">
        {empleadoSeleccionado && (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-semibold text-3xl shadow-sm">
              {empleadoSeleccionado.avatar}
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-[#1d1d1f]">{empleadoSeleccionado.nombre}</h3>
              <p className="text-[#86868b] font-medium mt-1">{empleadoSeleccionado.rol}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] text-left space-y-3">
              {([
                ["Estado", <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100`}>{empleadoSeleccionado.estado}</span>],
                ["Tipo", <span className="capitalize">{empleadoSeleccionado.tipo}</span>],
                ["ID Empleado", empleadoSeleccionado.id],
                ...(empleadoSeleccionado.cedula_profesional ? [["Cédula", empleadoSeleccionado.cedula_profesional]] : []),
                ...(empleadoSeleccionado.telefono ? [["Teléfono", empleadoSeleccionado.telefono]] : []),
                ...(empleadoSeleccionado.correo ? [["Correo", empleadoSeleccionado.correo]] : []),
                ...(empleadoSeleccionado.consultorio ? [["Consultorio", empleadoSeleccionado.consultorio]] : []),
                ...(empleadoSeleccionado.usuario ? [["Usuario", empleadoSeleccionado.usuario]] : []),
              ] as [string, React.ReactNode][]).map(([label, value], i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-[#86868b]">{label}</span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
              <Boton variante="secundario" onClick={() => setEmpleadoSeleccionado(null)}>Cerrar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}