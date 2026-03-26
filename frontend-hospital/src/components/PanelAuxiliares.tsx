import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; // Cambié motion/react a framer-motion que es el estándar
import { Search, Filter, Plus, Shield, Stethoscope } from "lucide-react";
import { TarjetaAuxiliar } from "./comunes/TarjetaAuxiliar";
import { Modal } from "./comunes/Modal";
import { Boton } from "./comunes/Boton";
import { Input } from "./comunes/Input";
import { Select } from "./comunes/Select";
import { useAppStore, Auxiliar } from "../context/AppContext";

export function PanelAuxiliares() {
  const { auxiliares, addAuxiliar, deleteAuxiliar, updateAuxiliar, fetchAuxiliares } = useAppStore();
  const [auxiliarSeleccionado, setAuxiliarSeleccionado] = useState<Auxiliar | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  
  const [nuevoAuxiliar, setNuevoAuxiliar] = useState({ 
    nombre: "", 
    apellido: "", 
    tipo_auxiliar: "Paramedico", // Coincide con la imagen DB
    turno: "Matutino" // Coincide con la imagen DB
  });

  const [editAuxiliar, setEditAuxiliar] = useState<Partial<Auxiliar>>({});

  // Asegurarnos de que los datos estén frescos al entrar
  useEffect(() => {
    if (fetchAuxiliares) {
      fetchAuxiliares();
    }
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAuxiliar({
        nombre: nuevoAuxiliar.nombre,
        apellido: nuevoAuxiliar.apellido,
        tipo_auxiliar: nuevoAuxiliar.tipo_auxiliar,
        turno: nuevoAuxiliar.turno
      });

      setModalNuevo(false);
      setNuevoAuxiliar({
        nombre: "",
        apellido: "",
        tipo_auxiliar: "Paramedico",
        turno: "Matutino"
      });
    } catch (error) {
      console.error('Error al crear auxiliar:', error);
      alert('No se pudo crear el auxiliar. Revisa la consola.');
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auxiliarSeleccionado) return;

    try {
      await updateAuxiliar(auxiliarSeleccionado.id_auxiliar, editAuxiliar);
      setModalEditar(false);
      setAuxiliarSeleccionado(null);
      setEditAuxiliar({});
    } catch (error) {
      console.error('Error al editar auxiliar:', error);
      alert('No se pudo actualizar el auxiliar. Revisa la consola.');
    }
  };

  const abrirModalEditar = (auxiliar: Auxiliar) => {
    setAuxiliarSeleccionado(auxiliar);
    setEditAuxiliar(auxiliar);
    setModalEditar(true);
  };

  // Lógica del buscador
  const auxiliaresFiltrados = auxiliares.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.tipo_auxiliar?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = [
    { label: "Total Auxiliares", value: auxiliares.length.toString() },
    { label: "Paramédicos", value: auxiliares.filter(a => a.tipo_auxiliar === 'Paramedico').length.toString() },
    { label: "Enfermería", value: auxiliares.filter(a => a.tipo_auxiliar === 'enfermeria').length.toString() },
    { label: "Turno Matutino", value: auxiliares.filter(a => a.turno === 'Matutino').length.toString() },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">Personal Auxiliar</h1>
          <p className="text-[#86868b]">Gestión de enfermería, paramédicos, vigilancia y personal de apoyo</p>
        </div>
        <Boton onClick={() => setModalNuevo(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Auxiliar
        </Boton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-sm">
            <p className="text-sm font-medium text-[#86868b] mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-[#1d1d1f]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border border-black/[0.05] shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input 
            type="text"
            placeholder="Buscar por nombre, apellido o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-[15px] placeholder:text-[#86868b] outline-none"
          />
        </div>
        <div className="w-px h-8 bg-black/[0.05]"></div>
        <button className="flex items-center gap-2 px-4 py-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors font-medium text-sm">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {auxiliaresFiltrados.map((auxiliar) => (
          <TarjetaAuxiliar 
            key={auxiliar.id_auxiliar} 
            auxiliar={auxiliar} 
            onClick={() => abrirModalEditar(auxiliar)}
            opciones={[
              { etiqueta: "Editar información", accion: () => abrirModalEditar(auxiliar) },
              { etiqueta: "Eliminar registro", accion: () => deleteAuxiliar(auxiliar.id_auxiliar), peligro: true }
            ]}
          />
        ))}
        {auxiliaresFiltrados.length === 0 && (
          <div className="col-span-1 lg:col-span-2 p-8 text-center text-[#86868b] bg-white rounded-2xl border border-black/[0.05]">
            No se encontraron auxiliares que coincidan con "{busqueda}".
          </div>
        )}
      </div>

      {/* MODAL NUEVO */}
      <Modal isOpen={modalNuevo} onClose={() => setModalNuevo(false)} titulo="Nuevo Auxiliar">
        <form onSubmit={handleCrear} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nombre(s)" 
              value={nuevoAuxiliar.nombre}
              onChange={e => setNuevoAuxiliar({...nuevoAuxiliar, nombre: e.target.value})}
              required
            />
            <Input 
              label="Apellidos" 
              value={nuevoAuxiliar.apellido}
              onChange={e => setNuevoAuxiliar({...nuevoAuxiliar, apellido: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Auxiliar"
              value={nuevoAuxiliar.tipo_auxiliar}
              onChange={e => setNuevoAuxiliar({...nuevoAuxiliar, tipo_auxiliar: e.target.value})}
              required
            >
              <option value="Paramedico">Paramédico</option>
              <option value="enfermeria">Enfermería</option>
              <option value="vigilancia">Vigilancia</option>
              <option value="limpieza">Limpieza</option>
              <option value="mantenimiento">Mantenimiento</option>
            </Select>
            <Select
              label="Turno Asignado"
              value={nuevoAuxiliar.turno}
              onChange={e => setNuevoAuxiliar({...nuevoAuxiliar, turno: e.target.value})}
              required
            >
              <option value="Matutino">Matutino (06:00 - 14:00)</option>
              <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
              <option value="Nocturno">Nocturno (22:00 - 06:00)</option>
              <option value="Tarde">Tarde</option>
              <option value="Día">Día</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setModalNuevo(false)} type="button">Cancelar</Boton>
            <Boton type="submit">Guardar Auxiliar</Boton>
          </div>
        </form>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} titulo="Editar Auxiliar">
        <form onSubmit={handleEditar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nombre(s)" 
              value={editAuxiliar.nombre || ""}
              onChange={e => setEditAuxiliar({...editAuxiliar, nombre: e.target.value})}
              required
            />
            <Input 
              label="Apellidos" 
              value={editAuxiliar.apellido || ""}
              onChange={e => setEditAuxiliar({...editAuxiliar, apellido: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Auxiliar"
              value={editAuxiliar.tipo_auxiliar || ""}
              onChange={e => setEditAuxiliar({...editAuxiliar, tipo_auxiliar: e.target.value})}
              required
            >
              <option value="Paramedico">Paramédico</option>
              <option value="enfermeria">Enfermería</option>
              <option value="vigilancia">Vigilancia</option>
              <option value="limpieza">Limpieza</option>
              <option value="mantenimiento">Mantenimiento</option>
            </Select>
            <Select
              label="Turno Asignado"
              value={editAuxiliar.turno || ""}
              onChange={e => setEditAuxiliar({...editAuxiliar, turno: e.target.value})}
              required
            >
              <option value="Matutino">Matutino (06:00 - 14:00)</option>
              <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
              <option value="Nocturno">Nocturno (22:00 - 06:00)</option>
              <option value="Tarde">Tarde</option>
              <option value="Día">Día</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setModalEditar(false)} type="button">Cancelar</Boton>
            <Boton type="submit">Guardar Cambios</Boton>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}