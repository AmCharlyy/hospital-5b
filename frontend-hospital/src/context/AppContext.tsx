import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from "../api";

export interface Paciente { id: string; nombre: string; curp: string; telefono: string; estado: "Activo" | "Inactivo"; fechaRegistro: string; }
export interface Empleado { id: string; nombre: string; rol: string; estado: string; tipo: string; avatar: string; }
export interface Habitacion { id: string; tipo: string; estado: "ocupada" | "disponible" | "mantenimiento" | "limpieza"; pacienteId: string | null; tiempo: string | null; }
export interface Cita { id: string; pacienteId: string; doctorId: string; habitacionId?: string | null; fecha: string; hora: string; tipo: string; estado: "Programada" | "En Curso" | "Completada"; }
export interface Auxiliar { id_auxiliar: number; nombre: string; apellido: string; tipo_auxiliar: string; turno: string; }

interface AppContextType {
  pacientes: Paciente[];
  empleados: Empleado[];
  habitaciones: Habitacion[];
  citas: Cita[];
  auxiliares: Auxiliar[];
  addPaciente: (p: Paciente) => void;
  updatePaciente: (id: string, p: Partial<Paciente>) => void;
  addEmpleado: (e: Empleado) => void;
  deleteEmpleado: (id: string) => void;
  addHabitacion: (h: Habitacion) => void;
  updateHabitacion: (id: string, h: Partial<Habitacion>) => void;
  deleteHabitacion: (id: string) => void;
  addCita: (c: Cita) => void;
  updateCita: (id: string, c: Partial<Cita>) => void;
  fetchAuxiliares: () => Promise<void>;
  addAuxiliar: (auxiliar: Omit<Auxiliar, 'id_auxiliar'>) => Promise<void>;
  updateAuxiliar: (id: number, auxiliar: Partial<Auxiliar>) => Promise<void>;
  deleteAuxiliar: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hoy = new Date().toISOString().split('T')[0];

export function AppProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([]);

  const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('hospital_token') || ''}`
});

  const fetchAuxiliares = async () => {
    try {
      const res = await apiFetch('http://localhost:3333/api/auxiliares');
      if (!res.ok) throw new Error('Error al obtener auxiliares');
      const data: Auxiliar[] = await res.json();
      setAuxiliares(data);
    } catch (error) {
      console.error('Error en fetchAuxiliares:', error);
    }
  };

  const addAuxiliar = async (auxiliar: Omit<Auxiliar, 'id_auxiliar'>) => {
    try {
      const res = await apiFetch('http://localhost:3333/api/auxiliares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auxiliar),
      });
      if (!res.ok) throw await res.json();
      const data: Auxiliar = await res.json();
      setAuxiliares(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error en addAuxiliar:', error);
      throw error;
    }
  };

  const updateAuxiliar = async (id: number, auxiliar: Partial<Auxiliar>) => {
    try {
      const res = await apiFetch(`http://localhost:3333/api/auxiliares/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auxiliar),
      });
      if (!res.ok) throw await res.json();
      const data: Auxiliar = await res.json();
      setAuxiliares(prev => prev.map(a => (a.id_auxiliar === id ? data : a)));
    } catch (error) {
      console.error('Error en updateAuxiliar:', error);
      throw error;
    }
  };

  const deleteAuxiliar = async (id: number) => {
    try {
      const res = await apiFetch(`http://localhost:3333/api/auxiliares/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw await res.json();
      setAuxiliares(prev => prev.filter(a => a.id_auxiliar !== id));
    } catch (error) {
      console.error('Error en deleteAuxiliar:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAuxiliares();
  }, []);

  return (
    <AppContext.Provider value={{
      pacientes, empleados, habitaciones, citas, auxiliares,
      addPaciente: (p) => setPacientes([p, ...pacientes]),
      updatePaciente: (id, p) => setPacientes(pacientes.map(x => x.id === id ? { ...x, ...p } : x)),
      addEmpleado: (e) => setEmpleados([e, ...empleados]),
      deleteEmpleado: (id) => setEmpleados(empleados.filter(x => x.id !== id)),
      addHabitacion: (h) => setHabitaciones([...habitaciones, h]),
      updateHabitacion: (id, h) => setHabitaciones(habitaciones.map(x => x.id === id ? { ...x, ...h } : x)),
      deleteHabitacion: (id) => setHabitaciones(habitaciones.filter(x => x.id !== id)),
      addCita: (c) => setCitas([...citas, c]),
      updateCita: (id, c) => setCitas(citas.map(x => x.id === id ? { ...x, ...c } : x)),
      fetchAuxiliares, addAuxiliar, updateAuxiliar, deleteAuxiliar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
