import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { TarjetaEmpleado } from "./comunes/TarjetaEmpleado";
import { Modal } from "./comunes/Modal";
import { Boton } from "./comunes/Boton";
import { Input } from "./comunes/Input";
import { Select } from "./comunes/Select";

export function DirectorioPersonal() {
  // Estado para los empleados que vienen de la base de datos
  const [empleados, setEmpleados] = useState<any[]>([]);

  // Estados de Interfaz
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any | null>(null);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<any | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTab, setFiltroTab] = useState("Todos");
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);

  // Estado para el formulario de nuevo empleado
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    rol: "",
    tipo: "doctor",
    cedula_profesional: "",
    telefono: "",
    correo: "",
    usuario: "",
    contrasena: "",
    consultorio: ""
  });

  // 1. Conexión al Backend (GET) - Empleados
  const fetchEmpleados = async () => {
    try {
      const res = await fetch("http://localhost:3333/api/personal/completo");
      const data = await res.json();
      
      const personalFormateado = data.map((emp: any) => {
        const partes = emp.nombre.split(' ');
        const iniciales = partes.length > 1 ? partes[0][0] + partes[1][0] : emp.nombre.substring(0, 2);

        return {
          id: `${emp.tipo.substring(0,3).toUpperCase()}-${emp.id_real}`,
          id_real: emp.id_real,
          nombre: emp.nombre,
          rol: emp.especialidad || 'General',
          tipo: emp.tipo,
          estado: emp.estado_actual || 'Disponible',
          avatar: iniciales.toUpperCase(),
          cedula_profesional: emp.cedula_profesional || "",
          telefono: emp.telefono || "Sin teléfono",
          correo: emp.correo || "Sin correo",
          usuario: emp.usuario || "",
          consultorio: emp.consultorio || ""
        };
      });
      setEmpleados(personalFormateado);
    } catch (error) {
      console.error("Error al cargar personal:", error);
    }
  };

  // 2. Conexión al Backend (GET) - Consultorios Disponibles
  const fetchConsultorios = async () => {
    try {
      const res = await fetch("http://localhost:3333/api/consultorios-disponibles");
      const data = await res.json();
      if (Array.isArray(data)) {
        setConsultorios(data);
      } else {
        setConsultorios([]);
      }
    } catch (error) {
      console.error("Error al cargar consultorios:", error);
    }
  };

  // 3. Conexion Especialidades
  const fetchEspecialidades = async () => {
    try {
      const res = await fetch("http://localhost:3333/api/especialidades");
      const data = await res.json();
      setEspecialidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar especialidades");
    }
  };

  useEffect(() => {
    fetchEmpleados();
    fetchConsultorios();
    fetchEspecialidades();
  }, []);

  // Lógica de Filtrado (Pestañas + Buscador)
  const empleadosFiltrados = empleados.filter((emp) => {
    const coincideTab =
      filtroTab === "Todos" ||
      (filtroTab === "Doctores" && emp.tipo === "doctor") ||
      (filtroTab === "Enfermería" && emp.tipo === "enfermero") ||
      (filtroTab === "Administrativos" && emp.tipo === "administrativo");

    const coincideBusqueda =
      emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.rol.toLowerCase().includes(busqueda.toLowerCase());

    return coincideTab && coincideBusqueda;
  });

  // POST: Crear Nuevo Personal Dinámico 
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = "";
    if (nuevoEmpleado.tipo === 'doctor') endpoint = "http://localhost:3333/api/doctores";
    else if (nuevoEmpleado.tipo === 'administrativo') endpoint = "http://localhost:3333/api/administrativos";
    else if (nuevoEmpleado.tipo === 'enfermero') endpoint = "http://localhost:3333/api/enfermeros";

    if (!endpoint) return alert("Ruta no configurada para este rol.");
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoEmpleado.nombre,
          cedula_profesional: nuevoEmpleado.cedula_profesional,
          telefono: nuevoEmpleado.telefono, 
          correo: nuevoEmpleado.correo,
          usuario: nuevoEmpleado.usuario,
          contrasena: nuevoEmpleado.contrasena,
          rol: nuevoEmpleado.rol // Lo enviamos para los administrativos y doctores
        })
      });

      if (res.ok) {
        alert("¡Personal registrado con éxito!");
        setModalNuevo(false);
        setNuevoEmpleado({ 
          nombre: "", rol: "", tipo: "doctor", cedula_profesional: "",
          telefono: "", correo: "", usuario: "", contrasena: "", consultorio: ""
        });
        fetchEmpleados(); 
      } else {
        const errorData = await res.json();
        alert("Error al registrar: " + errorData.error);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Hubo un error al conectar con el servidor.");
    }
  };

  // PUT: Editar Datos del Personal
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoAEditar) return;

    try {
      const res = await fetch(`http://localhost:3333/api/doctores/${empleadoAEditar.id_real}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_doctor: empleadoAEditar.nombre,
          id_especialidad: empleadoAEditar.rol,
          especialidad: empleadoAEditar.rol,
          cedula_profesional: empleadoAEditar.cedula_profesional,
          telefono: empleadoAEditar.telefono,
          correo: empleadoAEditar.correo,
          consultorio: empleadoAEditar.consultorio,
          estado_actual: empleadoAEditar.estado
        })
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
      alert("Ocurrió un error al actualizar");
    }
  };

  const getTabClass = (tabName: string) => {
    return filtroTab === tabName
      ? "text-sm font-semibold text-[#1d1d1f] border-b-2 border-[#1d1d1f] pb-4 -mb-4 transition-colors"
      : "text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] pb-4 -mb-4 transition-colors";
  };

  // DELETE: Dar de baja al personal
  const handleEliminarPersonal = async (empleado: any) => {
    const confirmar = window.confirm(`¿Estás seguro de dar de baja a ${empleado.nombre}? Ya no aparecerá en el sistema activo.`);
    if (!confirmar) return;

    let endpoint = "";
    if (empleado.tipo === 'doctor') endpoint = `http://localhost:3333/api/doctores/${empleado.id_real}`;
    else if (empleado.tipo === 'administrativo') endpoint = `http://localhost:3333/api/administrativos/${empleado.id_real}`;
    else if (empleado.tipo === 'enfermero') endpoint = `http://localhost:3333/api/enfermeros/${empleado.id_real}`;
    
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        alert("Personal dado de baja correctamente");
        fetchEmpleados();
      } else {
        alert("Error al dar de baja");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
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
            <Plus className="w-5 h-5" />
            Añadir Personal
          </Boton>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-visible">

        {/* Pestañas (Tabs) */}
        <div className="flex items-center gap-6 px-6 py-4 border-b border-black/[0.05]">
          <button onClick={() => setFiltroTab("Todos")} className={getTabClass("Todos")}>Todos</button>
          <button onClick={() => setFiltroTab("Doctores")} className={getTabClass("Doctores")}>Doctores</button>
          <button onClick={() => setFiltroTab("Enfermería")} className={getTabClass("Enfermería")}>Enfermería</button>
          <button onClick={() => setFiltroTab("Administrativos")} className={getTabClass("Administrativos")}>Administrativos</button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleadosFiltrados.length > 0 ? (
              empleadosFiltrados.map((empleado) => (
                <TarjetaEmpleado
                  key={empleado.id}
                  empleado={empleado}
                  onClick={() => setEmpleadoSeleccionado(empleado)}
                  opciones={[
                    { etiqueta: "Ver Perfil", accion: () => setEmpleadoSeleccionado(empleado) },
                    { etiqueta: "Editar Datos", accion: () => setEmpleadoAEditar(empleado) },
                    { etiqueta: "Asignar Turno", accion: () => alert(`Asignando turno a ${empleado.nombre}`) },
                    { etiqueta: "Dar de Baja", accion: () => handleEliminarPersonal(empleado), peligro: true }
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

      {/* Modal Añadir Nuevo Personal */}
      <Modal isOpen={modalNuevo} onClose={() => setModalNuevo(false)} titulo="Añadir Nuevo Personal">
        <form onSubmit={handleCrear} className="space-y-4">
          <Input
            label="Nombre Completo"
            placeholder="Ej. Dr. Juan Pérez"
            required
            value={nuevoEmpleado.nombre}
            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
          />

          <Select
            label="Tipo de Personal"
            value={nuevoEmpleado.tipo}
            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, tipo: e.target.value, rol: "" })}
          >
            <option value="doctor">Doctor(a)</option>
            <option value="enfermero">Enfermero(a)</option>
            <option value="administrativo">Administrativo</option>
          </Select>

          {/* Selector Dinámico de Especialidad / Rol */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1d1d1f]">
              {nuevoEmpleado.tipo === 'doctor' ? 'Especialidad Médica' : 
               nuevoEmpleado.tipo === 'enfermero' ? 'Área de Enfermería' : 'Puesto Administrativo'}
            </label>
            <select
              required
              className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
              value={nuevoEmpleado.rol}
              onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, rol: e.target.value})}
            >
              <option value="">Seleccionar opción...</option>
              {nuevoEmpleado.tipo === 'doctor' && (
                <>
                  {especialidades.map((esp) => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>
                      {esp.nombre}
                    </option>
                  ))}
                  <option value="General">Médico General</option>
                </>
              )}
              {nuevoEmpleado.tipo === 'enfermero' && (
                <>
                  <option value="Enfermería General">Enfermería General</option>
                  <option value="UCI">UCI (Cuidados Intensivos)</option>
                  <option value="Urgencias">Urgencias</option>
                  <option value="Pediatría">Enfermería Pediátrica</option>
                </>
              )}
              {nuevoEmpleado.tipo === 'administrativo' && (
                <>
                  <option value="Recepción">Recepción</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Sistemas">Sistemas / TI</option>
                </>
              )}
            </select>
          </div>

          {/* Mostrar campos extra SOLO para Doctores y Enfermeros */}
          {nuevoEmpleado.tipo !== 'administrativo' && (
            <div className="grid grid-cols-2 gap-4">
              {nuevoEmpleado.tipo === 'doctor' && (
                <Input
                  label="Cédula Profesional"
                  placeholder="Ej. 1234567"
                  value={nuevoEmpleado.cedula_profesional}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cedula_profesional: e.target.value })}
                />
              )}
              <Input
                label="Teléfono"
                placeholder="Ej. 555 123 4567"
                value={nuevoEmpleado.telefono}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })}
              />
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="Ej. usuario@hospital.com"
                value={nuevoEmpleado.correo}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, correo: e.target.value })}
              />

              {nuevoEmpleado.tipo === 'doctor' && (
                <Select
                  label="Consultorio"
                  value={nuevoEmpleado.consultorio}
                  onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, consultorio: e.target.value })}
                >
                  <option value="">Seleccione un consultorio...</option>
                  {Array.isArray(consultorios) && consultorios.map((cons) => (
                    <option key={cons.id_consultorio} value={cons.id_consultorio}>
                      {cons.nombre_consultorio}
                    </option>
                  ))}
                </Select>
              )}

              <Input
                label="Usuario (Sistema)"
                placeholder="Ej. dr.perez"
                value={nuevoEmpleado.usuario}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, usuario: e.target.value })}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={nuevoEmpleado.contrasena}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, contrasena: e.target.value })}
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevo(false)}>Cancelar</Boton>
            <Boton type="submit">Añadir Personal</Boton>
          </div>
        </form>
      </Modal>

      {/* Modal Edición de Personal */}
      <Modal isOpen={!!empleadoAEditar} onClose={() => setEmpleadoAEditar(null)} titulo="Editar Datos del Personal">
        {empleadoAEditar && (
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <Input
              label="Nombre Completo"
              required
              value={empleadoAEditar.nombre || ""}
              onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, nombre: e.target.value })}
            />
            
            {/* Selector Dinámico de Especialidad / Rol para Edición */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1d1d1f]">
                {empleadoAEditar.tipo === 'doctor' ? 'Especialidad Médica' : 
                 empleadoAEditar.tipo === 'enfermero' ? 'Área de Enfermería' : 'Puesto Administrativo'}
              </label>
              <select
                required
                className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
                value={empleadoAEditar.rol || ''}
                onChange={(e) => setEmpleadoAEditar({...empleadoAEditar, rol: e.target.value})}
              >
                <option value="">Seleccionar opción...</option>
                {empleadoAEditar.tipo === 'doctor' && (
                  <>
                    {especialidades.map((esp) => (
                      <option key={esp.id_especialidad} value={esp.id_especialidad}>
                        {esp.nombre}
                      </option>
                    ))}
                    <option value="General">Médico General</option>
                  </>
                )}
                {empleadoAEditar.tipo === 'enfermero' && (
                  <>
                    <option value="Enfermería General">Enfermería General</option>
                    <option value="UCI">UCI (Cuidados Intensivos)</option>
                    <option value="Urgencias">Urgencias</option>
                    <option value="Pediatría">Enfermería Pediátrica</option>
                  </>
                )}
                {empleadoAEditar.tipo === 'administrativo' && (
                  <>
                    <option value="Recepción">Recepción</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Sistemas">Sistemas / TI</option>
                  </>
                )}
              </select>
            </div>

            {empleadoAEditar.tipo === 'doctor' && (
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
                  label="Correo Electrónico"
                  type="email"
                  value={empleadoAEditar.correo || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, correo: e.target.value })}
                />
                <Select
                  label="Consultorio"
                  value={empleadoAEditar.consultorio || ""}
                  onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, consultorio: e.target.value })}
                >
                  <option value="">Seleccione un consultorio...</option>
                  {Array.isArray(consultorios) && consultorios.map((cons) => (
                    <option key={cons.id_consultorio} value={cons.id_consultorio}>
                      {cons.nombre_consultorio}
                    </option>
                  ))}
                </Select>
              </div>
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

      {/* Modal Detalles del Perfil */}
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
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">Estado Actual</span>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${empleadoSeleccionado.estado === 'En Turno' ? 'bg-green-100 text-green-700' :
                  empleadoSeleccionado.estado === 'En Consulta' ? 'bg-blue-100 text-blue-700' :
                    empleadoSeleccionado.estado === 'Disponible' ? 'bg-green-100 text-green-700' :
                      empleadoSeleccionado.estado === 'En Ruta' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                  }`}>
                  {empleadoSeleccionado.estado}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">Tipo de Personal</span>
                <span className="text-sm font-medium text-[#1d1d1f] capitalize">{empleadoSeleccionado.tipo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">ID Empleado</span>
                <span className="text-sm font-mono text-[#1d1d1f]">{empleadoSeleccionado.id}</span>
              </div>

              {empleadoSeleccionado.tipo === 'doctor' && (
                <>
                  {empleadoSeleccionado.cedula_profesional && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868b]">Cédula Profesional</span>
                      <span className="text-sm font-medium text-[#1d1d1f]">{empleadoSeleccionado.cedula_profesional}</span>
                    </div>
                  )}
                  {empleadoSeleccionado.telefono && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868b]">Teléfono</span>
                      <span className="text-sm font-medium text-[#1d1d1f]">{empleadoSeleccionado.telefono}</span>
                    </div>
                  )}
                  {empleadoSeleccionado.correo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868b]">Correo</span>
                      <span className="text-sm font-medium text-[#1d1d1f]">{empleadoSeleccionado.correo}</span>
                    </div>
                  )}
                  {empleadoSeleccionado.consultorio && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868b]">Consultorio</span>
                      <span className="text-sm font-medium text-[#1d1d1f]">{empleadoSeleccionado.consultorio}</span>
                    </div>
                  )}
                  {empleadoSeleccionado.usuario && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#86868b]">Usuario</span>
                      <span className="text-sm font-medium text-[#1d1d1f]">{empleadoSeleccionado.usuario}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}