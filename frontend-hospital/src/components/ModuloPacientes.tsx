import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Key, Fingerprint, ShieldCheck, MessageCircle, Smartphone } from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Modal } from "./comunes/Modal";
import { Input } from "./comunes/Input";
import { MenuDropdown } from "./comunes/MenuDropdown";
import { apiFetch } from "../api";

export function ModuloPacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTab, setFiltroTab] = useState<
    "todos" | "activos" | "bajas" | "en_espera" | "en_tratamiento" | "hospitalizado" | "alta" | "defuncion"
  >("todos");

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

  // 🛡️ FUNCIÓN DE SEGURIDAD (JWT)
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem('hospital_token') || ''}`
  });

  const generarContrasena = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const fetchPacientes = async () => {
    try {
      const res = await apiFetch("http://localhost:3333/api/pacientes/completo", {
        headers: getHeaders()
      });

      if (res.status === 401 || res.status === 403) {
        window.location.reload(); // Si no hay token, lo manda al login
        return;
      }

      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
      setPacientes([]);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const pacientesFiltrados = pacientes
    .filter(p => {
      const estado = (p.estado || "").toUpperCase();
      switch (filtroTab) {
        case "activos": return estado !== "BAJA";
        case "bajas": return estado === "BAJA";
        case "en_espera": return estado === "EN ESPERA";
        case "hospitalizado": return estado === "HOSPITALIZADO";
        case "alta": return estado === "ALTA";
        case "defuncion": return estado === "DEFUNCION";
        default: return true;
      }
    })
    .filter(p => {
      const term = busqueda.toLowerCase();
      return (p.nombre_paciente || "").toLowerCase().includes(term) ||
        (p.curp || "").toLowerCase().includes(term);
    });

  // --- 1. POST: Registrar Paciente ---
  const handleRegistrarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaContrasena = generarContrasena();

    try {
      const respuesta = await apiFetch("http://localhost:3333/api/pacientes", {
        method: "POST",
        headers: getHeaders(),
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
      setNuevoPaciente({ nombre_paciente: "", curp: "", codigo_pais: "+52", numero_telefono: "", sexo: "", correo: "", edad: 0 });
    } catch (error) {
      console.error("Error al guardar en BD:", error);
    }
  };

  // --- 2. PUT: Editar Datos del Paciente ---
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteAEditar) return;

    try {
      const res = await apiFetch(`http://localhost:3333/api/pacientes/${pacienteAEditar.id_paciente}`, {
        method: "PUT",
        headers: getHeaders(),
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
      const res = await apiFetch(`http://localhost:3333/api/pacientes/${pacienteId}/estado`, {
        method: "PUT",
        headers: getHeaders(),
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
      const res = await apiFetch(`http://localhost:3333/api/pacientes/${paciente.id_paciente}/baja`, {
        method: "PUT",
        headers: getHeaders()
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
      const res = await apiFetch(`http://localhost:3333/api/pacientes/${paciente.id_paciente}/password`, {
        method: "PUT",
        headers: getHeaders(),
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

  const colorEstado = (estado: string): string => {
    switch (estado) {
      case "EN ESPERA": return "bg-yellow-100 text-yellow-700";
      case "ALTA": return "bg-blue-100 text-blue-700";
      case "DEFUNCION": return "bg-gray-200 text-gray-600";
      case "HOSPITALIZADO": return "bg-red-hospital/20 text-dark-red-hospital";
      case "BAJA": return "bg-brand-green/20 text-brand-green-dark";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  const contarEstado = (estado: string) =>
    pacientes.filter(p => (p.estado || "").toUpperCase() === estado).length;

  const tabs: {
    key: "todos" | "activos" | "bajas" | "en_espera" | "en_tratamiento" | "hospitalizado" | "alta" | "defuncion";
    label: string;
    badge?: number;
    badgeColor?: string;
  }[] = [
      { key: "todos", label: "Todos", badge: pacientes.length, badgeColor: "bg-gray-100 text-gray-600" },
      { key: "activos", label: "Activos", badge: pacientes.filter(p => (p.estado || "").toUpperCase() !== "BAJA").length, badgeColor: "bg-green-100 text-green-700" },
      { key: "en_espera", label: "En espera", badge: contarEstado("EN ESPERA"), badgeColor: "bg-yellow-100 text-yellow-700" },
      { key: "hospitalizado", label: "Hospitalizado", badge: contarEstado("HOSPITALIZADO"), badgeColor: "bg-red-hospital/20 text-dark-red-hospital" },
      { key: "alta", label: "Alta", badge: contarEstado("ALTA"), badgeColor: "bg-blue-100 text-blue-700" },
      { key: "defuncion", label: "Defunción", badge: contarEstado("DEFUNCION"), badgeColor: "bg-gray-200 text-gray-700" },
      { key: "bajas", label: "Bajas", badge: contarEstado("BAJA"), badgeColor: "bg-brand-green/20 text-brand-green-dark" },
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
      <div className="flex gap-0.5 border-b border-black/[0.06] overflow-visible">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltroTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${filtroTab === tab.key
              ? "border-aqua-hospital text-indigo-hospital"
              : "border-transparent text-[#86868b] hover:text-[#1d1d1f]"
              }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-visible">
        <div className="overflow-x-auto overflow-visible">
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

                return (
                  <tr
                    key={paciente.id_paciente}
                    // 🚨 1. HACEMOS LA FILA CLICKABLE 🚨
                    onClick={() => setPacienteSeleccionado(paciente)}
                    className="transition-colors group hover:bg-gray-50/50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1d1d1f] group-hover:text-light_aqua transition-colors">
                          {paciente.nombre_paciente}
                        </span>
                        <span className="text-xs text-[#86868b]">Folio: P-{paciente.id_paciente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-[#86868b]" />
                        <span className="text-sm font-mono text-[#1d1d1f]">{paciente.curp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1d1d1f]">
                      {paciente.codigo_pais || "+52"} {paciente.numero_telefono}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${colorEstado(estadoVisual)}`}>
                        {estadoVisual}
                      </span>
                    </td>
                    {/* 🚨 2. BORRAMOS LA CELDA DEL MENUDROPDOWN 🚨 */}
                  </tr>
                );
              })}
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
              {/* 👇 AQUI ESTA REPARADO EL BUG DEL CÓDIGO DE PAÍS 👇 */}
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

      {/* ── MODAL: Expediente y Panel de Control ── */}
      <Modal isOpen={!!pacienteSeleccionado} onClose={() => setPacienteSeleccionado(null)} titulo="Expediente del Paciente">
        {pacienteSeleccionado && (
          <div className="space-y-6">

            {/* Cabecera del Expediente */}
            <div>
              <h3 className="text-2xl font-semibold text-[#1d1d1f]">{pacienteSeleccionado.nombre_paciente}</h3>
              <p className="text-[#86868b] font-mono mt-1">{pacienteSeleccionado.curp}</p>
            </div>

            {/* Tarjeta de Información */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-black/[0.05] space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-black/[0.05]">
                <span className="text-sm font-medium text-[#86868b]">Estado Actual</span>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${colorEstado((pacienteSeleccionado.estado || "").toUpperCase())}`}>
                  {pacienteSeleccionado.estado || "N/A"}
                </span>
              </div>

              {([
                ["Folio del Sistema", `P-${pacienteSeleccionado.id_paciente}`],
                ["Contacto Principal", `${pacienteSeleccionado.codigo_pais || "+52"} ${pacienteSeleccionado.numero_telefono}`],
                ["Correo Electrónico", pacienteSeleccionado.correo || "No registrado"],
                ["Perfil Médico", `${pacienteSeleccionado.edad || "N/A"} años / ${pacienteSeleccionado.sexo || "N/A"}`],
                ["Fecha de Ingreso", pacienteSeleccionado.fecha_registro || "N/A"],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-[#86868b]">{label}</span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{value}</span>
                </div>
              ))}
            </div>

            {/* 🚨 PANEL DE ACCIONES INTELIGENTE 🚨 */}
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">Acciones Administrativas</h4>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Botón Editar (Solo si no es BAJA) */}
                {(pacienteSeleccionado.estado || "").toUpperCase() !== "BAJA" && (
                  <Boton
                    onClick={() => {
                      setPacienteSeleccionado(null); // Cerramos este modal
                      setPacienteAEditar(pacienteSeleccionado); // Abrimos el modal de edición
                    }}
                    className="w-full bg-indigo-hospital text-white hover:bg-aqua-hospital border-none shadow-none"
                  >
                    Editar Datos
                  </Boton>
                )}

                {/* 2. Botón Nueva Contraseña (Solo si no es BAJA) */}
                {(pacienteSeleccionado.estado || "").toUpperCase() !== "BAJA" && (
                  <Boton
                    onClick={() => {
                      setPacienteSeleccionado(null);
                      handleNuevaContrasena(pacienteSeleccionado);
                    }}
                    className="w-full bg-gray-200 text-gray-700 hover:bg-yellow-200 border-none shadow-none"
                  >
                    Reset Password
                  </Boton>
                )}
              </div>

              {/* 3. Acciones de Flujo (Dar de Alta / Baja / Reingreso) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.05]">

                {(pacienteSeleccionado.estado || "").toUpperCase() === "ATENCIÓN MÉDICA" && (
                  <Boton onClick={() => { cambiarEstadoPaciente(pacienteSeleccionado.id_paciente, 4); setPacienteSeleccionado(null); }} className="w-full bg-green-50 text-green-700 hover:bg-green-100 border-none shadow-none">
                    Marcar como Alta Médica
                  </Boton>
                )}

                {(pacienteSeleccionado.estado || "").toUpperCase() === "BAJA" ? (
                  <Boton onClick={() => { cambiarEstadoPaciente(pacienteSeleccionado.id_paciente, 1); setPacienteSeleccionado(null); }} className="w-full">
                    Reingresar Paciente
                  </Boton>
                ) : (
                  <Boton
                    onClick={() => {
                      setConfirmandoBaja(pacienteSeleccionado);
                      setPacienteSeleccionado(null);
                    }}
                    className="w-full bg-red-500 hover:bg-red-400 border-none shadow-none"
                  >
                    Dar de Baja (Retirar del Sistema)
                  </Boton>
                )}
              </div>

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
                  value={pacienteAEditar?.sexo || ""}
                  onChange={(e) => setPacienteAEditar({ ...pacienteAEditar, sexo: e.target.value })}>
                  <option value="" disabled>Elegir una opcion</option>
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