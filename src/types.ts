export interface Question {
  id: number;
  titulo: string;
  desc: string;
  icon: string; // Emoji
}

export interface IncidentReport {
  id?: string;
  id_local?: string; // fallback local id
  nombre_informante: string;
  odpe: string;
  distrito: string; // District/Zona a cargo
  rubro_id: number;
  categoria: string; // Same as titulo
  pregunta_texto: string; // Same as desc
  tiene_problema: boolean;
  
  // The 4 sub-questions:
  ocurrencia: string;       // 1. ¿Qué ocurrió y dónde?
  consecuencia: string;     // 2. ¿Qué actividad electoral podría afectarse y cuál sería la consecuencia?
  acciones_odpe: string;    // 3. Acciones adoptadas por la ODPE
  fuente_evidencia?: string; // 4. Fuente o evidencia

  fecha_creacion: string;
}

export interface DistrictInfo {
  name: string;
  color: string;
  icon: string;
  description: string;
}
