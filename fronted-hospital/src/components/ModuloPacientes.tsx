import React, { useState, useEffect } from "react";
import { motion } from "motion/react"; 
import { Plus, Search, Key, Fingerprint, ShieldCheck, MessageCircle, Smartphone } from "lucide-react";
import { Boton } from "./comunes/Boton";
import { Modal } from "./comunes/Modal";
import { Input } from "./comunes/Input";
import { MenuDropdown } from "./comunes/MenuDropdown";



export function ModuloPacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCredenciales, setModalCredenciales] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  const [pacienteAEditar, setPacienteAEditar] = useState<any | null>(null);
  const [nuevoPaciente, setNuevoPaciente] = useState({ nombre: "", curp: "", telefono: "" });
  const [credencialesGeneradas, setCredencialesGeneradas] = useState({ curp: "", contrasena: "", telefono: "", nombre: "" });

  const generarContrasena = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleRegistrarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevaContrasena = generarContrasena();
    
    setModalAbierto(false);

    setCredencialesGeneradas({
      curp: nuevoPaciente.curp,
      contrasena: nuevaContrasena,
      telefono: nuevoPaciente.telefono,
      nombre: nuevoPaciente.nombre
    });
    setModalCredenciales(true);
    setNuevoPaciente({ nombre: "", curp: "", telefono: "" });
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Guardando edición de:", pacienteAEditar);
    setPacienteAEditar(null);
  };

  const toggleEstadoPaciente = (pacienteId: string, estadoActual: string) => {
    console.log(`Cambiando estado del paciente ${pacienteId} a ${estadoActual === 'Activo' ? 'Inactivo' : 'Activo'}`);
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/pacientes/completo");
        const data = await res.json();
        setPacientes(data);
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
      }
    };
    fetchPacientes();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Pacientes</h1>
          <p className="text-[#86868b] mt-1">Registro de usuarios, expedientes y accesos al sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input 
              type="text" 
              placeholder="Buscar por CURP o nombre..." 
              className="pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-black/[0.05] shadow-sm w-64"
            />
          </div>
          <Boton onClick={() => setModalAbierto(true)}>
            <Plus className="w-5 h-5" />
            Registrar Paciente
          </Boton>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.05] bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">ID / Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">CURP (Usuario)</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#86868b] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {pacientes.map((paciente) => {
                const estadoVisual = paciente.estado ? paciente.estado.toUpperCase() : 'ACTIVO';
                const esActivo = estadoVisual === 'ACTIVO' || estadoVisual === 'ALTA'; 
                
                return (
                  <tr key={paciente.id_paciente} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1d1d1f]">{paciente.nombre_paciente}</span>
                        <span className="text-xs text-[#86868b]">P-{paciente.id_paciente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-[#86868b]" />
                        <span className="text-sm font-mono text-[#1d1d1f]">{paciente.curp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1d1d1f]">{paciente.numero_telefono}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        esActivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {estadoVisual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MenuDropdown 
                        opciones={[
                          { etiqueta: "Ver Expediente", accion: () => setPacienteSeleccionado(paciente) },
                          { etiqueta: "Editar Datos", accion: () => setPacienteAEditar(paciente) },
                          { etiqueta: "Generar Nueva Contraseña", accion: () => {
                              setCredencialesGeneradas({ 
                                curp: paciente.curp, 
                                contrasena: generarContrasena(),
                                telefono: paciente.numero_telefono,
                                nombre: paciente.nombre_paciente
                              });
                              setModalCredenciales(true);
                          }},
                          { 
                            etiqueta: esActivo ? "Desactivar" : "Activar", 
                            accion: () => toggleEstadoPaciente(paciente.id_paciente, estadoVisual), 
                            peligro: esActivo 
                          }
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} titulo="Registrar Nuevo Paciente">
        <form onSubmit={handleRegistrarPaciente} className="space-y-4">
          <Input 
            label="Nombre Completo" 
            placeholder="Ej. Ana Martínez" 
            required 
            value={nuevoPaciente.nombre}
            onChange={(e) => setNuevoPaciente({...nuevoPaciente, nombre: e.target.value})}
          />
          <Input 
            label="CURP (Servirá como Usuario)" 
            placeholder="18 caracteres" 
            required 
            maxLength={18}
            className="uppercase font-mono"
            value={nuevoPaciente.curp}
            onChange={(e) => setNuevoPaciente({...nuevoPaciente, curp: e.target.value.toUpperCase()})}
          />
          <Input 
            label="Teléfono de Contacto" 
            placeholder="Ej. 555-0123" 
            required 
            value={nuevoPaciente.telefono}
            onChange={(e) => setNuevoPaciente({...nuevoPaciente, telefono: e.target.value})}
          />
          
          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start mt-2 border border-blue-100">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Al registrar al paciente, el sistema generará automáticamente una contraseña segura. El paciente usará su CURP y esta contraseña para acceder al portal.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit">Registrar y Generar Acceso</Boton>
          </div>
        </form>
      </Modal>
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
            <Boton 
              type="button" 
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none flex items-center justify-center"
              onClick={() => window.open(`https://wa.me/${credencialesGeneradas.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${credencialesGeneradas.nombre}, tus credenciales de acceso al portal médico son:\nUsuario: ${credencialesGeneradas.curp}\nContraseña: ${credencialesGeneradas.contrasena}`)}`, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Boton>
            <Boton 
              type="button"
              variante="secundario"
              className="flex items-center justify-center"
              onClick={() => window.open(`sms:${credencialesGeneradas.telefono.replace(/\D/g, '')}?body=${encodeURIComponent(`Hola ${credencialesGeneradas.nombre}, tus credenciales de acceso al portal médico son:\nUsuario: ${credencialesGeneradas.curp}\nContraseña: ${credencialesGeneradas.contrasena}`)}`, '_self')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              SMS
            </Boton>
          </div>

          <div className="pt-2">
            <Boton className="w-full" variante="secundario" onClick={() => setModalCredenciales(false)}>Cerrar</Boton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!pacienteSeleccionado} onClose={() => setPacienteSeleccionado(null)} titulo="Expediente del Paciente">
        {pacienteSeleccionado && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-[#1d1d1f]">{pacienteSeleccionado.nombre_paciente}</h3>
              <p className="text-[#86868b] font-mono mt-1">{pacienteSeleccionado.curp}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-black/[0.05] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">Estado</span>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
                  (pacienteSeleccionado.estado ? pacienteSeleccionado.estado.toUpperCase() : 'ACTIVO') === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {pacienteSeleccionado.estado || 'ACTIVO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">Teléfono</span>
                <span className="text-sm font-medium text-[#1d1d1f]">{pacienteSeleccionado.numero_telefono}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#86868b]">ID Sistema</span>
                <span className="text-sm font-mono text-[#1d1d1f]">P-{pacienteSeleccionado.id_paciente}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-black/[0.05]">
              <Boton onClick={() => setPacienteSeleccionado(null)}>Ver Historial Médico</Boton>
              <Boton variante="secundario" onClick={() => setPacienteSeleccionado(null)}>Cerrar</Boton>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!pacienteAEditar} onClose={() => setPacienteAEditar(null)} titulo="Editar Datos del Paciente">
        {pacienteAEditar && (
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <Input 
              label="Nombre Completo" 
              required 
              value={pacienteAEditar.nombre_paciente}
              onChange={(e) => setPacienteAEditar({...pacienteAEditar, nombre_paciente: e.target.value})}
            />
            <Input 
              label="CURP" 
              required 
              maxLength={18}
              className="uppercase font-mono"
              value={pacienteAEditar.curp}
              onChange={(e) => setPacienteAEditar({...pacienteAEditar, curp: e.target.value.toUpperCase()})}
            />
            <Input 
              label="Teléfono de Contacto" 
              required 
              value={pacienteAEditar.numero_telefono}
              onChange={(e) => setPacienteAEditar({...pacienteAEditar, numero_telefono: e.target.value})}
            />
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