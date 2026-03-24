import { motion } from "framer-motion";
import { Users, Bed, Activity, Clock } from "lucide-react";
import { TarjetaMetrica } from "./comunes/TarjetaMetrica";
import { GraficoFlujo, DatosFlujo } from "./comunes/GraficoFlujo";
import { ListaActividad, Actividad } from "./comunes/ListaActividad";

const datosFlujo: DatosFlujo[] = [
  { nombre: "Lun", ingresos: 45, altas: 30 },
  { nombre: "Mar", ingresos: 52, altas: 38 },
  { nombre: "Mié", ingresos: 48, altas: 45 },
  { nombre: "Jue", ingresos: 61, altas: 40 },
  { nombre: "Vie", ingresos: 55, altas: 50 },
  { nombre: "Sáb", ingresos: 38, altas: 60 },
  { nombre: "Dom", ingresos: 40, altas: 45 },
];

const actividadesRecientes: Actividad[] = [
  { tiempo: "Hace 5 min", texto: "Dr. Mendoza asignado a Urgencias (Fast-Track)", tipo: "staff" },
  { tiempo: "Hace 12 min", texto: "Alta médica procesada: Habitación 302", tipo: "bed" },
  { tiempo: "Hace 28 min", texto: "Alerta de inventario: Paracetamol bajo", tipo: "inventory" },
  { tiempo: "Hace 1 hora", texto: "Cambio de turno completado (Enfermería)", tipo: "staff" },
];

export function PanelResumen() {
  const metricas = [
    { etiqueta: "Ocupación Hospitalaria", valor: "82%", Icono: Bed, colorTexto: "text-blue-600", colorFondo: "bg-blue-100/50" },
    { etiqueta: "Personal Activo", valor: "145", Icono: Users, colorTexto: "text-purple-600", colorFondo: "bg-purple-100/50" },
    { etiqueta: "Urgencias en Espera", valor: "12", Icono: Activity, colorTexto: "text-red-600", colorFondo: "bg-red-100/50" },
    { etiqueta: "Tiempo Promedio (Triage)", valor: "14m", Icono: Clock, colorTexto: "text-orange-600", colorFondo: "bg-orange-100/50" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Resumen Operativo</h1>
        <p className="text-[#86868b] mt-1">Vista general del estado del hospital hoy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica, i) => (
          <TarjetaMetrica key={i} {...metrica} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoFlujo datos={datosFlujo} />
        <ListaActividad actividades={actividadesRecientes} />
      </div>
    </motion.div>
  );
}
