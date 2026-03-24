export interface Actividad {
  tiempo: string;
  texto: string;
  tipo: string;
}

interface Props {
  actividades: Actividad[];
}

export function ListaActividad({ actividades }: Props) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-black/[0.02]">
      <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f] mb-6">Actividad Reciente</h2>
      <div className="space-y-6">
        {actividades.map((actividad, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f] leading-snug">{actividad.texto}</p>
              <p className="text-xs text-[#86868b] mt-1">{actividad.tiempo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
