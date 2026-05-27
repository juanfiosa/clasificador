"use client";

import { useState, useRef } from "react";
import {
  MOMENTO1,
  MOMENTO2,
  ANTECEDENTES,
  COMPOSICIONAL,
  PENA_NATURAL,
  ENFERMEDAD_TERMINAL,
  INSIGNIFICANCIA,
  PARTICIPACION_MENOR,
  PENA_MENOR,
  SPAP,
  calcularGrupo,
  calcularResultadoSugerido,
  RESULTADOS_CLASIFICACION,
  type RespuestasClasificador,
  type RespuestaClasificacion,
  type ResultadoKey,
} from "@/lib/clasificador";

// ─── Tipos de delito ──────────────────────────────────────────────────────────

const SIN_FIGURA = "Sin figura típica aparente";

const TIPOS_DELITO = [
  SIN_FIGURA,
  "Robo", "Robo agravado", "Hurto", "Lesiones leves", "Lesiones graves",
  "Lesiones gravísimas", "Amenazas", "Daño", "Resistencia a la autoridad",
  "Encubrimiento", "Tenencia de estupefacientes", "Comercialización de estupefacientes",
  "Violación de domicilio", "Abuso sexual", "Violencia familiar",
  "Homicidio en grado de tentativa", "Homicidio", "Portación ilegal de arma", "Otro",
] as const;

interface DatosCaso {
  numeroActa: string;
  apellidoNombre: string;
  dni: string;
  tipoDelito: string;
  fechaHecho: string;
  descripcion: string;
}

const DATOS_VACIOS: DatosCaso = {
  numeroActa: "", apellidoNombre: "", dni: "",
  tipoDelito: "", fechaHecho: "", descripcion: "",
};

// ─── Pasos del clasificador ───────────────────────────────────────────────────

const PASOS_CLASIFICACION = [
  {
    id: "momento1",
    titulo: "Verificación inicial",
    subtitulo: "Exclusiones para sobreseimiento / archivo (Momento 1)",
    preguntas: MOMENTO1,
    ayuda: "Si cualquiera es SÍ, el caso va directamente a Grupo 0.",
  },
  {
    id: "momento2",
    titulo: "Verificación de exclusiones RDAP",
    subtitulo: "Causales que derivan al JAI (Momento 2)",
    preguntas: MOMENTO2,
    ayuda: "Si cualquiera es SÍ, el caso va directamente a Grupo 3 (JAI).",
  },
  {
    id: "antecedentes",
    titulo: "Antecedentes del imputado",
    subtitulo: "Grupo 1 — verificación de condicionantes",
    preguntas: ANTECEDENTES,
    ayuda: null,
  },
  {
    id: "rdap",
    titulo: "Criterios de oportunidad (RDAP)",
    subtitulo: "Salidas alternativas al juicio",
    preguntas: [...COMPOSICIONAL, ...PENA_NATURAL, ...ENFERMEDAD_TERMINAL,
                ...INSIGNIFICANCIA, ...PARTICIPACION_MENOR, ...PENA_MENOR, ...SPAP],
    ayuda: null,
  },
] as const;

const COLORES_BADGE: Record<ResultadoKey, string> = {
  RESULTADO_1: "bg-gray-100 text-gray-800 border-gray-300",
  RESULTADO_2: "bg-green-50 text-green-900 border-green-400",
  RESULTADO_3: "bg-teal-50 text-teal-900 border-teal-400",
  RESULTADO_4: "bg-blue-50 text-blue-900 border-blue-400",
  RESULTADO_5: "bg-orange-50 text-orange-900 border-orange-400",
  RESULTADO_6: "bg-red-50 text-red-900 border-red-400",
};

const EXPLICACION_RESULTADO: Record<ResultadoKey, string> = {
  RESULTADO_1: "El hecho no configura delito o existe una causal de exclusión. Procede el archivo o sobreseimiento.",
  RESULTADO_2: "Existe víctima con interés distinto a la pena y condiciones de igualdad. Procede una salida composicional (mediación / acuerdo).",
  RESULTADO_3: "Existe un criterio de oportunidad reglado aplicable. Procede el sobreseimiento.",
  RESULTADO_4: "El caso reúne condiciones para una suspensión del proceso a prueba (probation).",
  RESULTADO_5: "No aplican criterios alternativos o existen exclusiones legales. Procede el Juicio Abreviado Inicial (JAI).",
  RESULTADO_6: "El caso no reúne condiciones para ninguna salida alternativa. Continúa hacia elevación a juicio oral.",
};

// ─── Header compartido ────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="bg-blue-900 text-white px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
          Ministerio Público Fiscal · Córdoba
        </p>
        <h1 className="text-xl font-bold">Clasificador de Casos</h1>
      </div>
    </header>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClasificadorPage() {
  const [etapa, setEtapa] = useState<"datos" | "clasificacion" | "resultado">("datos");
  const [datos, setDatos] = useState<DatosCaso>(DATOS_VACIOS);
  const [pasoActual, setPasoActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasClasificador>({});
  const [resultado, setResultado] = useState<ResultadoKey | null>(null);
  const [errorImport, setErrorImport] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function importarJSON(file: File) {
    setErrorImport(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target?.result as string);
        if (!obj.apellidoNombre && !obj.numeroActa) throw new Error("Formato inválido");
        setDatos({
          numeroActa:    obj.numeroActa    ?? "",
          apellidoNombre: obj.apellidoNombre ?? "",
          dni:           obj.dni           ?? "",
          tipoDelito:    obj.tipoDelito    ?? "",
          fechaHecho:    obj.fechaHecho    ?? "",
          descripcion:   obj.descripcion   ?? "",
        });
      } catch {
        setErrorImport("El archivo no tiene el formato esperado.");
      }
    };
    reader.readAsText(file);
  }

  function responder(id: string, valor: RespuestaClasificacion) {
    setRespuestas((prev) => ({ ...prev, [id]: valor }));
  }

  function avanzarClasificacion() {
    if (pasoActual === 0) {
      const grupo = calcularGrupo(respuestas);
      if (grupo === "0") { setResultado(calcularResultadoSugerido(respuestas)); setEtapa("resultado"); return; }
    }
    if (pasoActual === 1) {
      const grupo = calcularGrupo(respuestas);
      if (grupo === "3") { setResultado(calcularResultadoSugerido(respuestas)); setEtapa("resultado"); return; }
    }
    if (pasoActual < PASOS_CLASIFICACION.length - 1) {
      setPasoActual((p) => p + 1);
    } else {
      setResultado(calcularResultadoSugerido(respuestas));
      setEtapa("resultado");
    }
  }

  function reiniciar() {
    setEtapa("datos");
    setDatos(DATOS_VACIOS);
    setPasoActual(0);
    setRespuestas({});
    setResultado(null);
  }

  // ── ETAPA 1: Datos del caso ────────────────────────────────────────────────

  if (etapa === "datos") {
    const camposObligatorios = datos.apellidoNombre.trim() && datos.tipoDelito && datos.numeroActa.trim();
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-blue-800 h-1.5">
          <div className="bg-blue-300 h-full w-0" />
        </div>
        <main className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            {["datos", ...PASOS_CLASIFICACION.map((_, i) => i)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-400"
                }`}>
                  {i + 1}
                </div>
                {i < PASOS_CLASIFICACION.length && (
                  <div className="h-0.5 w-8 bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-blue-900 text-lg">Datos del caso</h2>
                <p className="text-sm text-blue-700 mt-0.5">Identificación del caso a clasificar</p>
              </div>
              <div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importarJSON(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-xs bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  title="Cargar datos desde archivo JSON"
                >
                  ↑ Cargar JSON
                </button>
              </div>
            </div>
            {errorImport && (
              <div className="px-6 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600">
                ✕ {errorImport}
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* Fila: Acta + Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    N° de acta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={datos.numeroActa}
                    onChange={(e) => setDatos((d) => ({ ...d, numeroActa: e.target.value }))}
                    placeholder="Ej: 0142/26"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Fecha del hecho
                  </label>
                  <input
                    type="date"
                    value={datos.fechaHecho}
                    onChange={(e) => setDatos((d) => ({ ...d, fechaHecho: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Apellido y nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Apellido y nombre del imputado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={datos.apellidoNombre}
                  onChange={(e) => setDatos((d) => ({ ...d, apellidoNombre: e.target.value }))}
                  placeholder="Ej: García, Juan Carlos"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DNI */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={datos.dni}
                  onChange={(e) => setDatos((d) => ({ ...d, dni: e.target.value }))}
                  placeholder="Ej: 38.542.190"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de delito */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tipo de delito <span className="text-red-500">*</span>
                </label>
                <select
                  value={datos.tipoDelito}
                  onChange={(e) => setDatos((d) => ({ ...d, tipoDelito: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Seleccionar —</option>
                  {TIPOS_DELITO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descripción del hecho
                </label>
                <textarea
                  value={datos.descripcion}
                  onChange={(e) => setDatos((d) => ({ ...d, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Breve relato del hecho…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  if (datos.tipoDelito === SIN_FIGURA) {
                    // Pre-responder M1_1=SI y mostrar resultado directamente
                    const respuestasPrevias = { M1_1: "SI" as const };
                    setRespuestas(respuestasPrevias);
                    setResultado(calcularResultadoSugerido(respuestasPrevias));
                    setEtapa("resultado");
                  } else {
                    setEtapa("clasificacion");
                  }
                }}
                disabled={!camposObligatorios}
                className="bg-blue-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-colors"
              >
                Iniciar clasificación →
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Los campos con <span className="text-red-500">*</span> son obligatorios
          </p>
        </main>
      </div>
    );
  }

  // ── ETAPA 3: Resultado ────────────────────────────────────────────────────

  if (etapa === "resultado" && resultado) {
    const info = RESULTADOS_CLASIFICACION.find((r) => r.value === resultado);
    const fechaFormateada = datos.fechaHecho
      ? new Date(datos.fechaHecho + "T12:00:00").toLocaleDateString("es-AR")
      : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-10 print:py-4">

          {/* Ficha del caso */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 print:shadow-none print:border">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Caso clasificado</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Imputado</span>
                <p className="font-semibold text-gray-900">{datos.apellidoNombre}</p>
              </div>
              {datos.dni && (
                <div>
                  <span className="text-gray-400 text-xs">DNI</span>
                  <p className="font-semibold text-gray-900">{datos.dni}</p>
                </div>
              )}
              <div>
                <span className="text-gray-400 text-xs">Acta</span>
                <p className="font-semibold text-gray-900">{datos.numeroActa}</p>
              </div>
              {fechaFormateada && (
                <div>
                  <span className="text-gray-400 text-xs">Fecha del hecho</span>
                  <p className="font-semibold text-gray-900">{fechaFormateada}</p>
                </div>
              )}
              <div>
                <span className="text-gray-400 text-xs">Tipo de delito</span>
                <p className="font-semibold text-gray-900">{datos.tipoDelito}</p>
              </div>
            </div>
            {datos.descripcion && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-gray-400 text-xs">Descripción</span>
                <p className="text-sm text-gray-700 mt-0.5">{datos.descripcion}</p>
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className={`rounded-2xl border-2 p-8 ${COLORES_BADGE[resultado]}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">
              Resultado sugerido
            </p>
            <h2 className="text-2xl font-bold mb-4">{info?.label}</h2>
            <p className="text-base leading-relaxed">{EXPLICACION_RESULTADO[resultado]}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
            <button
              onClick={() => setEtapa("clasificacion")}
              className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Corregir respuestas
            </button>
            <button
              onClick={reiniciar}
              className="flex-1 bg-blue-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-800 transition-colors"
            >
              ↺ Clasificar otro caso
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              🖨 Imprimir
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
            Herramienta de apoyo — no reemplaza el criterio del fiscal
          </p>
        </main>
      </div>
    );
  }

  // ── ETAPA 2: Cuestionario ─────────────────────────────────────────────────

  const paso = PASOS_CLASIFICACION[pasoActual];
  const preguntasActuales = paso.preguntas as readonly { id: string; texto: string; ayuda?: string }[];
  const todasRespondidas = preguntasActuales.every(
    (p) => respuestas[p.id] === "SI" || respuestas[p.id] === "NO"
  );
  const progreso = Math.round(((pasoActual + 1) / (PASOS_CLASIFICACION.length + 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-blue-800 h-1.5">
        <div className="bg-blue-300 h-full transition-all duration-500" style={{ width: `${progreso}%` }} />
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Chip del caso */}
        <div className="mb-5 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-gray-400 text-xs">📋</span>
          <span className="text-sm font-semibold text-gray-800 truncate">{datos.apellidoNombre}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-500">{datos.tipoDelito}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">Acta {datos.numeroActa}</span>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-6">
          {[0, ...PASOS_CLASIFICACION.map((_, i) => i + 1)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === 0 ? "bg-blue-600 text-white"
                : i - 1 < pasoActual ? "bg-blue-600 text-white"
                : i - 1 === pasoActual ? "bg-blue-900 text-white"
                : "bg-gray-200 text-gray-400"
              }`}>
                {i === 0 ? "✓" : i - 1 < pasoActual ? "✓" : i}
              </div>
              {i < PASOS_CLASIFICACION.length && (
                <div className={`h-0.5 w-8 ${i < pasoActual + 1 ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tarjeta del paso */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h2 className="font-bold text-blue-900 text-lg">{paso.titulo}</h2>
            <p className="text-sm text-blue-700 mt-0.5">{paso.subtitulo}</p>
            {paso.ayuda && (
              <p className="text-xs text-blue-600 mt-2 bg-blue-100 rounded-lg px-3 py-2">
                ℹ️ {paso.ayuda}
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {preguntasActuales.map((pregunta) => {
              const val = respuestas[pregunta.id];
              return (
                <div key={pregunta.id} className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-800 mb-1">{pregunta.texto}</p>
                  {pregunta.ayuda && (
                    <p className="text-xs text-gray-400 mb-3">{pregunta.ayuda}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {(["SI", "NO"] as const).map((opcion) => (
                      <button
                        key={opcion}
                        onClick={() => responder(pregunta.id, opcion)}
                        className={`px-5 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                          val === opcion
                            ? opcion === "SI"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-gray-700 text-white border-gray-700"
                            : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {opcion === "SI" ? "Sí" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => pasoActual > 0 ? setPasoActual((p) => p - 1) : setEtapa("datos")}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
            >
              ← Anterior
            </button>
            <button
              onClick={avanzarClasificacion}
              disabled={!todasRespondidas}
              className="bg-blue-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-colors"
            >
              {pasoActual === PASOS_CLASIFICACION.length - 1 ? "Ver resultado →" : "Siguiente →"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Paso {pasoActual + 2} de {PASOS_CLASIFICACION.length + 1} · Herramienta de apoyo — no reemplaza el criterio del fiscal
        </p>
      </main>
    </div>
  );
}
