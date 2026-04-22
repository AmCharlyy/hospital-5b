import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface DatosFlujo {
  nombre: string;
  ingresos: number;
  altas: number;
}

interface Props {
  datos: DatosFlujo[];
}

export function GraficoFlujo({ datos }: Props) {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-[#071952]">Flujo de Pacientes (Semana)</h2>
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#071952]"></div>
            <span className="text-[#86868b]">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#37B7C3]"></div>
            <span className="text-[#86868b]">Altas</span>
          </div>
        </div>
      </div>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#071952" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#071952" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              itemStyle={{ color: '#071952', fontWeight: 500 }}
            />
            <Area type="monotone" dataKey="ingresos" stroke="#071952" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
            <Area type="monotone" dataKey="altas" stroke="#37B7C3" strokeWidth={3} fillOpacity={0.1} fill="#37B7C3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}