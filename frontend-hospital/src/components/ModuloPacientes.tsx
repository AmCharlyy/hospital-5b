import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Key, Fingerprint, ShieldCheck, MessageCircle, Smartphone } from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Modal } from "./comunes/Modal";
import { Input } from "./comunes/Input";
import { MenuDropdown } from "./comunes/MenuDropdown";

export function ModuloPacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTab, setFiltroTab] = useState<"todos" | "activos" | "bajas">("todos");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCredenciales, setModalCredenciales] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [pacienteAEditar, setPacienteAEditar] = useState<any | null>(null);
  const [confirmandoBaja, setConfirmandoBaja] = useState<any | null>(null);

  const [credencialesGeneradas, setCredencialesGeneradas] = useState({
    curp: "", contrasena: "", telefono: "", nombre: ""
  });

  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre_paciente: "", curp: "", codigo_pais: "+52", numero_telefono: "", sexo: "", correo: "", edad: 0
  });

  const generarContrasena = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const fetchPacientes = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pacientes/completo");
      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    }
  };

  useEffect(() => { fetchPacientes(); }, []);

  // Filtrado por tab + búsqueda
  const pacientesFiltrados = pacientes
    .filter(p => {
      const estado = (p.estado || "").toUpperCase();
      if (filtroTab === "activos") return estado !== "BAJA";
      if (filtroTab === "bajas") return estado === "BAJA";
      return true;
    })
    .filter(p =>
      p.nombre_paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.curp.toLowerCase().includes(busqueda.toLowerCase())
    );

  // --- 1. POST: Registrar Paciente ---
  const handleRegistrarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaContrasena = generarContrasena();

    try {
      const respuesta = await fetch("http://localhost:3000/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_paciente: nuevoPaciente.nombre_paciente,
          curp: nuevoPaciente.curp,
          numero_telefono: nuevoPaciente.numero_telefono,
          edad: nuevoPaciente.edad,
          sexo: nuevoPaciente.sexo,
          correo: nuevoPaciente.correo,
          contrasena_plana: nuevaContrasena
        })
      });

      if (!respuesta.ok) {
        const data = await respuesta.json();
        alert("❌ Error: " + data.error);
        return;
      }

      setModalAbierto(false);
      fetchPacientes();
      setCredencialesGeneradas({
        curp: nuevoPaciente.curp,
        contrasena: nuevaContrasena,
        telefono: `${nuevoPaciente.codigo_pais}${nuevoPaciente.numero_telefono}`,
        nombre: nuevoPaciente.nombre_paciente
      });
      setModalCredenciales(true);
      setNuevoPaciente({ nombre_paciente: "", curp: "", codigo_pais: "+52", numero_telefono: "", sexo: "Masculino", correo: "", edad: 0 });
    } catch (error) {
      console.error("Error al guardar en BD:", error);
    }
  };

  // --- 2. PUT: Editar Datos del Paciente ---
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteAEditar) return;

    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteAEditar.id_paciente}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_paciente: pacienteAEditar.nombre_paciente,
          curp: pacienteAEditar.curp,
          numero_telefono: pacienteAEditar.numero_telefono,
          correo: pacienteAEditar.correo,
          edad: pacienteAEditar.edad || 0,
          sexo: pacienteAEditar.sexo || "Masculino"
        })
      });

      if (res.ok) {
        setPacienteAEditar(null);
        fetchPacientes();
        alert("✅ Datos actualizados");
      } else {
        const errorData = await res.json();
        alert("❌ Error: " + errorData.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- 3. PUT: Cambiar Estado Lógico ---
  const cambiarEstadoPaciente = async (pacienteId: string, nuevoIdStatus: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_status: nuevoIdStatus })
      });
      if (res.ok) fetchPacientes();
    } catch (error) {
      console.error(error);
    }
  };

  // --- 4. PUT: Dar de Baja (endpoint dedicado) ---
  const handleDarDeBaja = async (paciente: any) => {
    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${paciente.id_paciente}/baja`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setConfirmandoBaja(null);
        fetchPacientes();
      } else {
        const err = await res.json();
        alert("❌ Error al dar de baja: " + err.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- 5. PUT: Generar Nueva Contraseña ---
  const handleNuevaContrasena = async (paciente: any) => {
    const nuevaContrasena = generarContrasena();
    try {
      const res = await fetch(`http://localhost:3000/api/pacientes/${paciente.id_paciente}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrasena_plana: nuevaContrasena })
      });

      if (res.ok) {
        setCredencialesGeneradas({
          curp: paciente.curp,
          contrasena: nuevaContrasena,
          telefono: `${paciente.codigo_pais || "+52"}${paciente.numero_telefono}`,
          nombre: paciente.nombre_paciente
        });
        setModalCredenciales(true);
      } else {
        alert("❌ Error al generar la contraseña");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Colores de estado — BAJA siempre rojo pastel
  const colorEstado = (estado: string) => {
    switch (estado) {
      case "EN ESPERA": return "bg-yellow-100 text-yellow-700";
      //case "":                 return "bg-blue-100 text-blue-700";
      case "DEFUCION": return "bg-purple-100 text-purple-700";
      case "ALTA": return "bg-blue-100 text-blue-700";
      case "BAJA": return "bg-indigo-100 text-indigo-700";
      case "EN TRATAMIENTO": return "bg-green-100 text-green-700";
      //case "BAJA":             return "bg-red-100 text-red-600";
      //case "":
      case "HOSPITALIZADO": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const tabs: { key: "todos" | "activos" | "bajas"; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "activos", label: "Activos" },
    { key: "bajas", label: "Bajas" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Pacientes</h1>
          <p className="text-[#86868b] mt-1">Gestión de flujo, expedientes y accesos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="Buscar por CURP o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-64"
            />
          </div>
          <Boton onClick={() => setModalAbierto(true)}>
            <Plus className="w-5 h-5" /> Registrar Paciente
          </Boton>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-1 border-b border-black/[0.06]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltroTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${filtroTab === tab.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-[#86868b] hover:text-[#1d1d1f]"
              }`}
          >
            {tab.label}
            {tab.key === "bajas" && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                {pacientes.filter(p => (p.estado || "").toUpperCase() === "BAJA").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.05] bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">Folio / Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">CURP (Usuario)</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">Estado Flujo</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {pacientesFiltrados.map((paciente) => {
                const estadoVisual = (paciente.estado || "EN ESPERA").toUpperCase();
                const esBaja = estadoVisual === "BAJA";

                return (
                  <tr
                    key={paciente.id_paciente}
                    className={`transition-colors group ${esBaja ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-gray-50/50"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${esBaja ? "text-red-800/80" : "text-[#1d1d1f]"}`}>
                          {paciente.nombre_paciente}
                        </span>
                        <span className="text-xs text-[#86868b]">Folio: P-{paciente.id_paciente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`w-4 h-4 ${esBaja ? "text-red-300" : "text-[#86868b]"}`} />
                        <span className="text-sm font-mono text-[#1d1d1f]">{paciente.curp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1d1d1f]">
                      {paciente.codigo_pais || "+52"} {paciente.numero_telefono}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${colorEstado(estadoVisual)}`}>
                        {estadoVisual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MenuDropdown
                        opciones={[
                          { etiqueta: "Ver Expediente", accion: () => setPacienteSeleccionado(paciente) },
                          !esBaja && { etiqueta: "Editar Datos", accion: () => setPacienteAEditar(paciente) },
                          !esBaja && { etiqueta: "Generar Nueva Contraseña", accion: () => handleNuevaContrasena(paciente) },
                          !esBaja && estadoVisual === "ATENCIÓN MÉDICA" && {
                            etiqueta: "Dar de Alta",
                            accion: () => cambiarEstadoPaciente(paciente.id_paciente, 4)
                          },
                          esBaja
                            ? { etiqueta: "Reingresar (En Espera)", accion: () => cambiarEstadoPaciente(paciente.id_paciente, 1) }
                            : { etiqueta: "Dar de Baja", accion: () => setConfirmandoBaja(paciente), peligro: true },
                        ].filter(Boolean) as any}
                      />
                    </td>
                  </tr>
                );
              })}
              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#86868b]">
                    No se encontraron pacientes con esa búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Confirmar Baja ── */}
      <Modal isOpen={!!confirmandoBaja} onClose={() => setConfirmandoBaja(null)} titulo="Confirmar baja del paciente">
        {confirmandoBaja && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-red-500 text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-800">¿Dar de baja a este paciente?</p>
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-semibold">{confirmandoBaja.nombre_paciente}</span> dejará de aparecer en las listas activas.
                  Su expediente se conserva y puede ser reingresado en cualquier momento.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Boton type="button" variante="secundario" onClick={() => setConfirmandoBaja(null)}>
                Cancelar
              </Boton>
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

      {/* ── MODAL: Registro ── */}
      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} titulo="Registrar Nuevo Paciente">
        <form onSubmit={handleRegistrarPaciente} className="space-y-4">
          <Input label="Nombre Completo" placeholder="Ej. Ana Martínez" required value={nuevoPaciente.nombre_paciente}
            onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, nombre_paciente: e.target.value })} />
          <Input label="CURP (Servirá como Usuario)" placeholder="18 caracteres" required maxLength={18}
            className="uppercase font-mono" value={nuevoPaciente.curp}
            onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, curp: e.target.value.toUpperCase() })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1d1d1f]">Teléfono de Contacto</label>
            <div className="flex gap-2">
              <select className="px-3 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-28"
                value={nuevoPaciente.codigo_pais}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, codigo_pais: e.target.value })}>
                <option value="+52">🇲🇽 +52</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+56">🇨🇱 +56</option>
                <option value="+51">🇵🇪 +51</option>
              </select>
              <input type="tel" placeholder="Ej. 555-0123" required
                className="flex-1 px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm"
                value={nuevoPaciente.numero_telefono}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, numero_telefono: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Edad" type="number" placeholder="Ej. 30" required value={nuevoPaciente.edad || ""}
              onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, edad: parseInt(e.target.value) || 0 })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1d1d1f]">Sexo</label>
              <select required className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
                value={nuevoPaciente.sexo || ""}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, sexo: e.target.value })}>
                <option value="" disabled>Elegir una opción</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <Input label="Correo Electrónico" type="email" placeholder="Ej. ana@example.com" value={nuevoPaciente.correo}
            onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, correo: e.target.value })} />
          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start mt-2 border border-blue-100">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Al registrar al paciente, el sistema generará automáticamente una contraseña segura.
              El paciente usará su CURP y esta contraseña para acceder al portal.
            </p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit">Registrar y Generar Acceso</Boton>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Credenciales ── */}
      <Modal isOpen={modalCredenciales} onClose={() => setModalCredenciales(false)} titulo="Acceso Generado Exitosamente">
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="text-sm text-[#86868b]">
            Entregue estas credenciales al paciente. Por seguridad, la contraseña no se volverá a mostrar.
          </p>
          <div className="bg-gray-50 p-6 rounded-2xl border border-black/[0.05] space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Usuario (CURP)</label>
              <div className="flex items-center gap-2 mt-1">
                <Fingerprint className="w-5 h-5 text-[#1d1d1f]" />
                <span className="text-lg font-mono font-semibold text-[#1d1d1f]">{credencialesGeneradas.curp}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-black/[0.05]">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Contraseña Temporal</label>
              <div className="flex items-center gap-2 mt-1">
                <Key className="w-5 h-5 text-[#1d1d1f]" />
                <span className="text-lg font-mono font-semibold text-[#1d1d1f] tracking-widest">{credencialesGeneradas.contrasena}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Boton type="button" className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none flex items-center justify-center"
              onClick={() => window.open(`https://wa.me/${credencialesGeneradas.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${credencialesGeneradas.nombre}, tus credenciales de acceso al portal médico son:\nUsuario: ${credencialesGeneradas.curp}\nContraseña: ${credencialesGeneradas.contrasena}`)}`, "_blank")}>
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Boton>
            <Boton type="button" variante="secundario" className="flex items-center justify-center"
              onClick={() => window.open(`sms:${credencialesGeneradas.telefono.replace(/\D/g, "")}?body=${encodeURIComponent(`Hola ${credencialesGeneradas.nombre}, tus credenciales de acceso al portal médico son:\nUsuario: ${credencialesGeneradas.curp}\nContraseña: ${credencialesGeneradas.contrasena}`)}`, "_self")}>
              <Smartphone className="w-4 h-4 mr-2" /> SMS
            </Boton>
          </div>
          <div className="pt-2">
            <Boton className="w-full" variante="secundario" onClick={() => setModalCredenciales(false)}>Cerrar</Boton>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Expediente ── */}
      <Modal isOpen={!!pacienteSeleccionado} onClose={() => setPacienteSeleccionado(null)} titulo="Expediente del Paciente">
        {pacienteSeleccionado && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-[#1d1d1f]">{pacienteSeleccionado.nombre_paciente}</h3>
              <p className="text-[#86868b] font-mono mt-1">{pacienteSeleccionado.curp}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] space-y-3">
              {[
                ["Estado", <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${colorEstado((pacienteSeleccionado.estado || "").toUpperCase())}`}>{pacienteSeleccionado.estado || "N/A"}</span>],
                ["Folio", `P-${pacienteSeleccionado.id_paciente}`],
                ["Teléfono", `${pacienteSeleccionado.codigo_pais || "+52"} ${pacienteSeleccionado.numero_telefono}`],
                ["Correo", pacienteSeleccionado.correo || "N/A"],
                ["Edad / Sexo", `${pacienteSeleccionado.edad || "N/A"} años / ${pacienteSeleccionado.sexo || "N/A"}`],
                ["Fecha de Registro", pacienteSeleccionado.fecha_registro || "N/A"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center">
                  <span className="text-sm text-[#86868b]">{label}</span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
              <Boton onClick={() => setPacienteSeleccionado(null)}>Ver Historial Médico</Boton>
              <Boton variante="secundario" onClick={() => setPacienteSeleccionado(null)}>Cerrar</Boton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: Edición ── */}
      <Modal isOpen={!!pacienteAEditar} onClose={() => setPacienteAEditar(null)} titulo="Editar Datos del Paciente">
        {pacienteAEditar && (
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <Input label="Nombre Completo" required value={pacienteAEditar.nombre_paciente}
              onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, nombre_paciente: e.target.value })} />
            <Input label="CURP" required maxLength={18} className="uppercase font-mono" value={pacienteAEditar.curp}
              onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, curp: e.target.value.toUpperCase() })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1d1d1f]">Teléfono de Contacto</label>
              <div className="flex gap-2">
                <select className="px-3 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-28"
                  value={pacienteAEditar.codigo_pais || "+52"}
                  onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, codigo_pais: e.target.value })}>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+51">🇵🇪 +51</option>
                </select>
                <input type="tel" required
                  className="flex-1 px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm"
                  value={pacienteAEditar.numero_telefono}
                  onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, numero_telefono: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Edad" type="number" required value={pacienteAEditar.edad || ""}
                onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, edad: parseInt(e.target.value) || 0 })} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1d1d1f]">Sexo</label>
                <select className="px-4 py-2.5 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-full"
                  value={pacienteAEditar.sexo || "Masculino"}
                  onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, sexo: e.target.value })}>
                  <option value="" disabled>Elegir una opción</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <Input label="Correo Electrónico" type="email" value={pacienteAEditar.correo || ""}
              onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, correo: e.target.value })} />
            <div className="pt-4 flex justify-end gap-3">
              <Boton type="button" variante="secundario" onClick={() => setPacienteAEditar(null)}>Cancelar</Boton>
              <Boton type="submit">Guardar Cambios</Boton>
            </div>
          </form>
        )}
      </Modal>

    </motion.div>
  );
}