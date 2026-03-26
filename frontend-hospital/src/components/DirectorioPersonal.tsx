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
      const res = await fetch("http://localhost:3000/api/doctores/estado");
      const data = await res.json();

      const doctoresFormateados = data.map((doc: any) => {
        const partes = doc.nombre_doctor.split(' ');
        const iniciales = partes.length > 1 ? partes[0][0] + partes[1][0] : doc.nombre_doctor.substring(0, 2);

        return {
          id: `DOC-${doc.id_doctor}`,
          id_real: doc.id_doctor, // Necesario para el PUT
          nombre: doc.nombre_doctor,
          rol: doc.especialidad || 'General',
          tipo: 'doctor',
          estado: doc.estado_actual || 'Disponible',
          avatar: iniciales.toUpperCase(),
          cedula_profesional: doc.cedula_profesional || "",
          telefono: doc.telefono || "",
          correo: doc.correo || "",
          usuario: doc.usuario || "",
          consultorio: doc.consultorio || ""
        };
      });
      setEmpleados(doctoresFormateados);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  // NUEVO: Conexión al Backend (GET) - Consultorios Disponibles
  const fetchConsultorios = async () => {
    try {
      // Asegúrate de que esta URL coincida con la ruta que crearemos en tu backend
      const res = await fetch("http://localhost:3000/api/consultorios-disponibles");
      const data = await res.json();

      if (Array.isArray(data)) {
        setConsultorios(data);
      } else {
        console.warn("El servidor no devolvió un array de consultorios.");
        setConsultorios([]);
      }

    } catch (error) {
      console.error("Error al cargar consultorios:", error);
    }
  };

  //Conexion Especialidades
  const fetchEspecialidades = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/especialidades");
      const data = await res.json();
      if (Array.isArray(data)) setEspecialidades(data);
    } catch (error) {
      console.error("Error al cargar especialidades");
    }
  };

  useEffect(() => {
    fetchEmpleados();
    fetchConsultorios();
    fetchEspecialidades(); // Llamamos a la nueva función al cargar el componente
  }, []);

  //Lógica de Filtrado (Pestañas + Buscador)
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

  //3. --- Crear Nuevo Doctor de verdad
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();

    // De momento, tu backend solo tiene ruta para crear doctores
    if (nuevoEmpleado.tipo !== 'doctor') {
      alert("Por ahora el backend solo soporta registrar Doctores.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/doctores", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoEmpleado.nombre,
          cedula_profesional: nuevoEmpleado.cedula_profesional,
          telefono: nuevoEmpleado.telefono,
          correo: nuevoEmpleado.correo,
          usuario: nuevoEmpleado.usuario,
          contrasena: nuevoEmpleado.contrasena,
          consultorio: nuevoEmpleado.consultorio,
          id_especialidad: nuevoEmpleado.rol
        })
      });

      if (res.ok) {
        // Si se guardó bien en la BD y se mandó el WhatsApp:
        alert("¡Personal registrado con éxito!");
        setModalNuevo(false);

        // Limpiamos el formulario
        setNuevoEmpleado({
          nombre: "", rol: "", tipo: "doctor", cedula_profesional: "",
          telefono: "", correo: "", usuario: "", contrasena: "", consultorio: ""
        });

        // Recargamos la lista desde la base de datos
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

  // 4. PUT: Editar Datos del Doctor
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoAEditar) return;

    try {
      const res = await fetch(`http://localhost:3000/api/doctores/${empleadoAEditar.id_real}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_doctor: empleadoAEditar.nombre,
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
        fetchEmpleados(); // Recargar la lista
        fetchConsultorios(); // Opcional: recargar consultorios por si alguno se ocupó
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
                    { etiqueta: "Eliminar", accion: () => alert('Ruta de eliminación no configurada en API'), peligro: true }
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
            label="Especialidad/ rol" 
            placeholder="Ej. Medico General"
            required 
            value={nuevoEmpleado.rol}
            onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, rol: e.target.value})}
          >
            <option value="">Seleccione una especialidad...</option>
            {especialidades.map((esp) => (
              <option key={esp.id_especialidad} value={esp.id_especialidad}>
                {esp.nombre}
              </option>
            ))}
          </Select>  

          <Select
            label="Tipo de Personal"
            value={nuevoEmpleado.tipo}
            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, tipo: e.target.value })}
          >
            <option value="doctor">Doctor(a)</option>
            <option value="enfermero">Enfermero(a)</option>
            <option value="administrativo">Administrativo</option>
            <option value="paramedico">Paramédico</option>
          </Select>

          {nuevoEmpleado.tipo === 'doctor' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cédula Profesional"
                placeholder="Ej. 1234567"
                value={nuevoEmpleado.cedula_profesional}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, cedula_profesional: e.target.value })}
              />
              <Input
                label="Teléfono"
                placeholder="Ej. 555 123 4567"
                value={nuevoEmpleado.telefono}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })}
              />
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="Ej. doctor@hospital.com"
                value={nuevoEmpleado.correo}
                onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, correo: e.target.value })}
              />

      {/* Select de Consultorios para Añadir */}
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
            <Input
              label="Especialidad / Rol"
              required
              value={empleadoAEditar.rol || ""}
              onChange={(e) => setEmpleadoAEditar({ ...empleadoAEditar, rol: e.target.value })}
            />

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

    {/*Select de Consultorios para Editar */}
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

            <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
              <Boton onClick={() => setEmpleadoSeleccionado(null)}>Enviar Mensaje</Boton>
              <Boton variante="secundario" onClick={() => setEmpleadoSeleccionado(null)}>Cerrar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}