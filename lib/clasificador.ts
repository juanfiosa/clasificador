// ─── Tipos ───────────────────────────────────────────────────────────────────

export type RespuestaClasificacion = "SI" | "NO" | "NO_APLICA" | null;

export interface RespuestasClasificador {
  [preguntaId: string]: RespuestaClasificacion;
}

export interface PreguntaClasificador {
  id: string;
  texto: string;
  ayuda?: string;
}

// ─── PRECLASIFICACIÓN — MOMENTO 1 ────────────────────────────────────────────
// Verificación de exclusiones para sobreseimiento/archivo.
// Si alguna es SI → Grupo 0 (posible sobreseimiento/archivo).

export const MOMENTO1: PreguntaClasificador[] = [
  {
    id: "M1_1",
    texto: "¿Es evidente que el hecho no encuadra en una figura penal?",
    ayuda: "Casos sin imputación. Por ejemplo: portación de rifle de aire comprimido.",
  },
  {
    id: "M1_2",
    texto: "¿Resulta posible la aplicación de una causa de justificación?",
    ayuda: "Ejemplo: legítima defensa propia o de un tercero (art. 34 inc. 6 y 7 del CP).",
  },
  {
    id: "M1_3",
    texto: "¿Resulta probable que la persona sea inimputable?",
  },
  {
    id: "M1_4",
    texto: "¿Resulta probable la aplicación de una excusa absolutoria?",
    ayuda:
      "Ejemplo: hurtos entre hermanos convivientes (art. 185 inc. 3 CP) o desistimiento voluntario (art. 43 CP).",
  },
];

// ─── PRECLASIFICACIÓN — MOMENTO 2 ────────────────────────────────────────────
// Verificación de exclusiones legales para aplicación de RDAP.
// Si alguna es SI → Grupo 3 (posible JAI).

export const MOMENTO2: PreguntaClasificador[] = [
  {
    id: "M2_1",
    texto: "¿La persona imputada es funcionaria pública y cometió el hecho en ejercicio o con abuso de su cargo?",
  },
  {
    id: "M2_2",
    texto: "¿El mínimo de la pena en abstracto es superior a los 3 años de prisión?",
  },
  {
    id: "M2_3",
    texto: "¿El delito atribuido aparece como una expresión de criminalidad organizada?",
  },
  {
    id: "M2_4",
    texto: "¿El hecho resulta incompatible con las previsiones de los tratados internacionales de derechos humanos?",
  },
  {
    id: "M2_5",
    texto: "¿El delito atribuido se encuentra reprimido con pena de inhabilitación?",
    ayuda: "Con excepción de lesiones leves o graves.",
  },
  {
    id: "M2_6",
    texto: "¿La víctima es menor de edad?",
  },
  {
    id: "M2_7",
    texto: "¿La persona imputada se sirvió de una persona menor de edad para cometer el hecho?",
  },
  {
    id: "M2_8",
    texto: "¿Es un hecho cometido dentro de un contexto de violencia doméstica, de género o motivado en razones discriminatorias?",
  },
  {
    id: "M2_9",
    texto: "¿Es un hecho de grave violencia física en las personas?",
  },
];

// ─── CLASIFICACIÓN ────────────────────────────────────────────────────────────

// Grupo 1: verificación de antecedentes (pueden bloquear ciertos RDAP)
export const ANTECEDENTES: PreguntaClasificador[] = [
  { id: "A_1", texto: "¿La persona imputada tiene antecedentes penales computables?" },
  {
    id: "A_2",
    texto: "¿La persona imputada ha sido beneficiada anteriormente con la aplicación de un criterio de oportunidad?",
  },
  {
    id: "A_3",
    texto: "¿La persona imputada ha sido beneficiada anteriormente con la suspensión de juicio a prueba?",
  },
];

// RDAP — Salida composicional
export const COMPOSICIONAL: PreguntaClasificador[] = [
  { id: "C_1", texto: "¿Existe un/a particular ofendido/a?" },
  {
    id: "C_2",
    texto: "¿La persona ofendida tiene una voluntad o interés distinto a la pena?",
  },
  {
    id: "C_3",
    texto: "¿Hay igualdad entre la persona imputada y la ofendida que permita descartar un aprovechamiento de la vulnerabilidad de esta?",
    ayuda: "Art. 13 ter inc. c.",
  },
];

// RDAP — Pena natural
export const PENA_NATURAL: PreguntaClasificador[] = [
  {
    id: "PN_1",
    texto: "¿La persona imputada sufrió como consecuencia del hecho un daño físico o moral que torne innecesaria y/o desproporcionada la aplicación de una pena?",
  },
];

// RDAP — Enfermedad terminal
export const ENFERMEDAD_TERMINAL: PreguntaClasificador[] = [
  { id: "ET_1", texto: "¿La persona imputada sufre de una enfermedad terminal?" },
];

// RDAP — Insignificancia
export const INSIGNIFICANCIA: PreguntaClasificador[] = [
  { id: "INS_1", texto: "¿El hecho cometido es insignificante?" },
];

// RDAP — Participación de menor relevancia
export const PARTICIPACION_MENOR: PreguntaClasificador[] = [
  { id: "PM_1", texto: "¿Existen múltiples partícipes en el hecho?" },
  { id: "PM_2", texto: "¿Se puede determinar qué acción u omisión realizó cada uno?" },
  {
    id: "PM_3",
    texto: "¿La acción u omisión de la persona imputada puede considerarse de menor relevancia en relación a la acción de otras personas o al resultado producido?",
  },
];

// RDAP — Pena menor
export const PENA_MENOR: PreguntaClasificador[] = [
  {
    id: "PE_1",
    texto: "¿El imputado tiene más de una imputación en el mismo proceso, está imputado en otro proceso en curso, o se encuentra penado sin condena firme?",
  },
  {
    id: "PE_2",
    texto: "¿La pena que le puede corresponder por este hecho carece de importancia en relación a la pena ya impuesta o a la que puede esperarse por los restantes hechos?",
  },
];

// SPAP — Suspensión del proceso a prueba (Grupo 2)
export const SPAP: PreguntaClasificador[] = [
  { id: "SP_1", texto: "La pena a aplicar es no privativa de la libertad." },
  {
    id: "SP_2",
    texto: "La persona tiene una condena anterior, pero han transcurrido 5 años desde el vencimiento de la pena, y la pena máxima en abstracto no excede los 3 años de prisión.",
  },
  {
    id: "SP_3",
    texto: "En el caso concreto, según las circunstancias, le correspondería una condena de ejecución condicional.",
    ayuda: "El máximo de la pena en abstracto puede o no superar los 3 años de prisión.",
  },
];

// ─── Resultado ───────────────────────────────────────────────────────────────

export const RESULTADOS_CLASIFICACION = [
  { value: "RESULTADO_1", label: "Resultado 1 — Archivo / Sobreseimiento (Grupo 0)" },
  { value: "RESULTADO_2", label: "Resultado 2 — Salida composicional" },
  { value: "RESULTADO_3", label: "Resultado 3 — Sobreseimiento" },
  { value: "RESULTADO_4", label: "Resultado 4 — Suspensión del proceso a prueba (SPAP)" },
  { value: "RESULTADO_5", label: "Resultado 5 — Juicio abreviado inicial (JAI)" },
  { value: "RESULTADO_6", label: "Resultado 6 — Continúa el caso para elevación a juicio" },
] as const;

export type ResultadoKey = typeof RESULTADOS_CLASIFICACION[number]["value"];

export const COLORES_RESULTADO: Record<ResultadoKey, string> = {
  RESULTADO_1: "bg-gray-100 text-gray-700 border-gray-300",
  RESULTADO_2: "bg-green-50 text-green-800 border-green-300",
  RESULTADO_3: "bg-teal-50 text-teal-800 border-teal-300",
  RESULTADO_4: "bg-blue-50 text-blue-800 border-blue-300",
  RESULTADO_5: "bg-orange-50 text-orange-800 border-orange-300",
  RESULTADO_6: "bg-red-50 text-red-800 border-red-300",
};

// ─── Lógica ───────────────────────────────────────────────────────────────────

export type GrupoPreclas = "0" | "1" | "3" | null;

export function calcularGrupo(r: RespuestasClasificador): GrupoPreclas {
  if (MOMENTO1.some((p) => r[p.id] === "SI")) return "0";
  if (!MOMENTO1.every((p) => r[p.id] === "SI" || r[p.id] === "NO")) return null;
  if (MOMENTO2.some((p) => r[p.id] === "SI")) return "3";
  if (!MOMENTO2.every((p) => r[p.id] === "SI" || r[p.id] === "NO")) return null;
  return "1";
}

export function calcularResultadoSugerido(r: RespuestasClasificador): ResultadoKey | null {
  const grupo = calcularGrupo(r);
  if (grupo === "0") return "RESULTADO_1";
  if (grupo === "3") return "RESULTADO_5";
  if (grupo !== "1") return null;

  // Composicional: C_1, C_2, C_3 todos SI
  if (r["C_1"] === "SI" && r["C_2"] === "SI" && r["C_3"] === "SI") return "RESULTADO_2";

  // Pena natural
  if (r["PN_1"] === "SI") return "RESULTADO_3";

  // Enfermedad terminal
  if (r["ET_1"] === "SI") return "RESULTADO_3";

  // Insignificancia
  if (r["INS_1"] === "SI") return "RESULTADO_3";

  // Participación menor relevancia: PM_1, PM_2, PM_3 todos SI
  if (r["PM_1"] === "SI" && r["PM_2"] === "SI" && r["PM_3"] === "SI") return "RESULTADO_3";

  // Pena menor: PE_1 y PE_2 ambos SI
  if (r["PE_1"] === "SI" && r["PE_2"] === "SI") return "RESULTADO_3";

  // SPAP: cualquiera SI
  if (r["SP_1"] === "SI" || r["SP_2"] === "SI" || r["SP_3"] === "SI") return "RESULTADO_4";

  // Sin criterio aplicable → JAI
  return "RESULTADO_5";
}

export const ETIQUETA_GRUPO: Record<string, string> = {
  "0": "Grupo 0 — Posible Sobreseimiento / Archivo",
  "1": "Grupo 1 — Posible RDAP",
  "2": "Grupo 2 — Posible SPAP",
  "3": "Grupo 3 — Posible JAI",
};
