"use client";

import { useState } from "react";
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
  COLORES_RESULTADO,
  type RespuestasClasificador,
  type RespuestaClasificacion,
  type ResultadoKey,
} from "@/lib/clasificador";

// ─── Pasos del wizard ────────────────────────────────────────────────────────

const PASOS = [
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
    preguntas: [
      ...COMPOSICIONAL,
      ...PENA_NATURAL,
      ...ENFERMEDAD_TERMINAL,
      ...INSIGNIFICANCIA,
      ...PARTICIPACION_MENOR,
      ...PENA_MENOR,
      ...SPAP,
    ],
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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClasificadorPage() {
  const [pasoActual, setPasoActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasClasificador>({});
  const [resultado, setResultado] = useState<ResultadoKey | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  function responder(id: string, valor: RespuestaClasificacion) {
    setRespuestas((prev) => ({ ...prev, [id]: valor }));
  }

  function avanzar() {
    // Verificar si hay un corte anticipado después del paso actual
    if (pasoActual === 0) {
      const grupo = calcularGrupo(respuestas);
      if (grupo === "0") {
        const r = calcularResultadoSugerido(respuestas);
        setResultado(r);
        setMostrarResultado(true);
        return;
      }
    }
    if (pasoActual === 1) {
      const grupo = calcularGrupo(respuestas);
      if (grupo === "3") {
        const r = calcularResultadoSugerido(respuestas);
        setResultado(r);
        setMostrarResultado(true);
        return;
      }
    }
    if (pasoActual < PASOS.length - 1) {
      setPasoActual((p) => p + 1);
    } else {
      const r = calcularResultadoSugerido(respuestas);
      setResultado(r);
      setMostrarResultado(true);
    }
  }

  function reiniciar() {
    setPasoActual(0);
    setRespuestas({});
    setResultado(null);
    setMostrarResultado(false);
  }

  const paso = PASOS[pasoActual];
  const preguntasActuales = paso.preguntas as readonly { id: string; texto: string; ayuda?: string }[];
  const todasRespondidas = preguntasActuales.every(
    (p) => respuestas[p.id] === "SI" || respuestas[p.id] === "NO"
  );
  const progreso = Math.round(((pasoActual) / PASOS.length) * 100);

  // ── Vista resultado ──────────────────────────────────────────────────────────
  if (mostrarResultado && resultado) {
    const info = RESULTADOS_CLASIFICACION.find((r) => r.value === resultado);
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
              Ministerio Público Fiscal · Córdoba
            </p>
            <h1 className="text-xl font-bold">Clasificador de Casos</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className={`rounded-2xl border-2 p-8 ${COLORES_BADGE[resultado]}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">
              Resultado sugerido
            </p>
            <h2 className="text-2xl font-bold mb-4">{info?.label}</h2>
            <p className="text-base leading-relaxed">
              {EXPLICACION_RESULTADO[resultado]}
            </p>
          </div>

          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">
              Resumen de respuestas
            </h3>
            <div className="space-y-1">
              {Object.entries(respuestas).map(([id, val]) => (
                <div key={id} className="flex items-center gap-3 text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className={`w-8 text-center font-bold rounded px-1 ${val === "SI" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                    {val}
                  </span>
                  <span className="text-gray-600">{id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMostrarResultado(false)}
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
        </main>
      </div>
    );
  }

  // ── Vista cuestionario ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
            Ministerio Público Fiscal · Córdoba
          </p>
          <h1 className="text-xl font-bold">Clasificador de Casos</h1>
        </div>
      </header>

      {/* Barra de progreso */}
      <div className="bg-blue-800 h-1.5">
        <div
          className="bg-blue-300 h-full transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Indicador de paso */}
        <div className="flex items-center gap-2 mb-6">
          {PASOS.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < pasoActual
                    ? "bg-blue-600 text-white"
                    : i === pasoActual
                    ? "bg-blue-900 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < pasoActual ? "✓" : i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < pasoActual ? "bg-blue-600" : "bg-gray-200"}`} />
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
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {pregunta.texto}
                  </p>
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
              onClick={() => pasoActual > 0 && setPasoActual((p) => p - 1)}
              disabled={pasoActual === 0}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors px-3 py-2"
            >
              ← Anterior
            </button>
            <button
              onClick={avanzar}
              disabled={!todasRespondidas}
              className="bg-blue-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-40 transition-colors"
            >
              {pasoActual === PASOS.length - 1 ? "Ver resultado →" : "Siguiente →"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Paso {pasoActual + 1} de {PASOS.length} · Herramienta de apoyo — no reemplaza el criterio del fiscal
        </p>
      </main>
    </div>
  );
}
