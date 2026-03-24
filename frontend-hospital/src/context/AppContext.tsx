import { createContext, useContext, useState, ReactNode } from 'react';

export interface Paciente { id: string; nombre: string; curp: string; telefono: string; estado: "Activo" | "Inactivo"; fechaRegistro: string; }
export interface Empleado { id: string; nombre: string; rol: string; estado: string; tipo: string; avatar: string; }
export interface Habitacion { id: string; tipo: string; estado: "ocupada" | "disponible" | "mantenimiento" | "limpieza"; pacienteId: string | null; tiempo: string | null; }
export interface Cita { id: string; pacienteId: string; doctorId: string; habitacionId?: string | null; fecha: string; hora: string; tipo: string; estado: "Programada" | "En Curso" | "Completada"; }

interface AppContextType {
  pacientes: Paciente[];
  empleados: Empleado[];
  habitaciones: Habitacion[];
  citas: Cita[];
  addPaciente: (p: Paciente) => void;
  updatePaciente: (id: string, p: Partial<Paciente>) => void;
  addEmpleado: (e: Empleado) => void;
  deleteEmpleado: (id: string) => void;
  addHabitacion: (h: Habitacion) => void;
  updateHabitacion: (id: string, h: Partial<Habitacion>) => void;
  deleteHabitacion: (id: string) => void;
  addCita: (c: Cita) => void;
  updateCita: (id: string, c: Partial<Cita>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const hoy = new Date().toISOString().split('T')[0];

export function AppProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([
    { id: "P-1001", nombre: "María García López", curp: "GALM850412MDFRRN01", telefono: "555-0123", estado: "Activo", fechaRegistro: "2026-03-20" },
    { id: "P-1002", nombre: "Juan Pérez Sánchez", curp: "PESJ901123HDFRRS05", telefono: "555-0198", estado: "Activo", fechaRegistro: "2026-03-21" },
    { id: "P-1003", nombre: "Roberto Gómez Bolaños", curp: "GOBR750221HDFRRM09", telefono: "555-0145", estado: "Inactivo", fechaRegistro: "2026-03-15" },
  ]);

  const [empleados, setEmpleados] = useState<Empleado[]>([
    { id: "E-001", nombre: "Dra. Elena Ramírez", rol: "Cardiología", estado: "En Turno", tipo: "doctor", avatar: "ER" },
    { id: "E-002", nombre: "Dr. Carlos Mendoza", rol: "Urgencias", estado: "En Turno", tipo: "doctor", avatar: "CM" },
    { id: "E-003", nombre: "Lic. Ana Torres", rol: "Enfermería Jefe", estado: "Descanso", tipo: "enfermero", avatar: "AT" },
    { id: "E-004", nombre: "Dr. Luis Villalobos", rol: "Pediatría", estado: "En Consulta", tipo: "doctor", avatar: "LV" },
  ]);

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([
    { id: "101", tipo: "Urgencias", estado: "ocupada", pacienteId: "P-1002", tiempo: "2h 15m" },
    { id: "102", tipo: "Urgencias", estado: "disponible", pacienteId: null, tiempo: null },
    { id: "103", tipo: "Urgencias", estado: "mantenimiento", pacienteId: null, tiempo: null },
    { id: "201", tipo: "Habitación", estado: "ocupada", pacienteId: "P-1001", tiempo: "1d 4h" },
    { id: "202", tipo: "Habitación", estado: "disponible", pacienteId: null, tiempo: null },
    { id: "C-01", tipo: "Consultorio", estado: "disponible", pacienteId: null, tiempo: null },
    { id: "C-02", tipo: "Consultorio", estado: "ocupada", pacienteId: "P-1002", tiempo: "0h 45m" },
  ]);

  const [citas, setCitas] = useState<Cita[]>([
    { id: "C-001", pacienteId: "P-1001", doctorId: "E-001", habitacionId: "C-01", fecha: hoy, hora: "09:00", tipo: "Consulta General", estado: "Completada" },
    { id: "C-002", pacienteId: "P-1002", doctorId: "E-004", habitacionId: "C-02", fecha: hoy, hora: "10:30", tipo: "Revisión", estado: "En Curso" },
  ]);

  return (
    <AppContext.Provider value={{
      pacientes, empleados, habitaciones, citas,
      addPaciente: (p) => setPacientes([p, ...pacientes]),
      updatePaciente: (id, p) => setPacientes(pacientes.map(x => x.id === id ? { ...x, ...p } : x)),
      addEmpleado: (e) => setEmpleados([e, ...empleados]),
      deleteEmpleado: (id) => setEmpleados(empleados.filter(x => x.id !== id)),
      addHabitacion: (h) => setHabitaciones([...habitaciones, h]),
      updateHabitacion: (id, h) => setHabitaciones(habitaciones.map(x => x.id === id ? { ...x, ...h } : x)),
      deleteHabitacion: (id) => setHabitaciones(habitaciones.filter(x => x.id !== id)),
      addCita: (c) => setCitas([...citas, c]),
      updateCita: (id, c) => setCitas(citas.map(x => x.id === id ? { ...x, ...c } : x)),
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
