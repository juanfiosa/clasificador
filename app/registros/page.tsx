"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clasificacion {
  id: number;
  fechaRegistro: string;
  numeroActa: string | null;
  apellidoNombre: string | null;
  dni: string | null;
  tipoDelito: string | null;
  fechaHecho: string | null;
  operador: string | null;
  grupo: number | null;
  resultado: string | null;
  resultadoTexto: string | null;
}

interface Stats {
  total: number;
  porResultado: {
    resultado: string | null;
    resultadoTexto: string | null;
    cantidad: number;
    porcentaje: number;
  }[];
}

// ─── Colores y etiquetas por resultado ───────────────────────────────────────

const COLORES: Record<string, string> = {
  RESULTADO_1: "bg-gray-100 text-gray-700 border-gray-300",
  RESULTADO_2: "bg-green-50 text-green-800 border-green-300",
  RESULTADO_3: "bg-teal-50 text-teal-800 border-teal-300",
  RESULTADO_4: "bg-blue-50 text-blue-800 border-blue-300",
  RESULTADO_5: "bg-orange-50 text-orange-800 border-orange-300",
  RESULTADO_6: "bg-red-50 text-red-800 border-red-300",
};

const COLOR_BARRA: Record<string, string> = {
  RESULTADO_1: "bg-gray-400",
  RESULTADO_2: "bg-green-500",
  RESULTADO_3: "bg-teal-500",
  RESULTADO_4: "bg-blue-500",
  RESULTADO_5: "bg-orange-500",
  RESULTADO_6: "bg-red-500",
};

const ETIQUETA_CORTA: Record<string, string> = {
  RESULTADO_1: "Archivo / Sobreseimiento",
  RESULTADO_2: "Salida composicional",
  RESULTADO_3: "Sobreseimiento por RDAP",
  RESULTADO_4: "Suspensión del proceso a prueba",
  RESULTADO_5: "Juicio abreviado inicial",
  RESULTADO_6: "Elevación a juicio",
};

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="bg-blue-900 text-white px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">
            Ministerio Público Fiscal · Córdoba
          </p>
          <h1 className="text-xl font-bold">Registro de clasificaciones</h1>
        </div>
        <Link
          href="/"
          className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Clasificar caso
        </Link>
      </div>
    </header>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Clasificacion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroResultado, setFiltroResultado] = useState<string>("todos");

  useEffect(() => {
    async function cargar() {
      try {
        const [resRegistros, resStats] = await Promise.all([
          fetch("/api/registros?limit=200"),
          fetch("/api/registros/stats"),
        ]);
        if (!resRegistros.ok || !resStats.ok) throw new Error("Error al cargar datos");
        const dataRegistros = await resRegistros.json();
        const dataStats = await resStats.json();
        setRegistros(dataRegistros.items ?? []);
        setStats(dataStats);
      } catch (e) {
        setError("No se pudo conectar con la base de datos.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const registrosFiltrados = registros.filter((r) => {
    const matchBusqueda =
      !busqueda ||
      (r.apellidoNombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.numeroActa ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.dni ?? "").includes(busqueda) ||
      (r.tipoDelito ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const matchResultado =
      filtroResultado === "todos" || r.resultado === filtroResultado;
    return matchBusqueda && matchResultado;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center text-gray-400">
          Cargando registros…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-2">
            Verificá que la base de datos esté configurada (variable DATABASE_URL).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">

        {stats && (
          <div className="mb-8">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Estadísticas</h2>
              <span className="text-sm text-gray-400">{stats.total} casos clasificados</span>
            </div>

            {stats.total === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                Todavía no hay clasificaciones registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.keys(ETIQUETA_CORTA).map((key) => {
                  const stat = stats.porResultado.find((r) => r.resultado === key);
                  const cantidad = stat?.cantidad ?? 0;
                  const pct = stats.total > 0 ? (cantidad / stats.total) * 100 : 0;
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-4 ${COLORES[key] ?? "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          {key.replace("RESULTADO_", "R")}
                        </span>
                        <span className="text-xl font-bold">{cantidad}</span>
                      </div>
                      <p className="text-xs leading-tight mb-3 opacity-80">{ETIQUETA_CORTA[key]}</p>
                      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${COLOR_BARRA[key] ?? "bg-gray-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1 opacity-60 text-right">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, acta, DNI o delito…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filtroResultado}
            onChange={(e) => setFiltroResultado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos los resultados</option>
            {Object.entries(ETIQUETA_CORTA).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {registrosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {busqueda || filtroResultado !== "todos"
                ? "No se encontraron registros con ese filtro."
                : "No hay clasificaciones guardadas aún."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Imputado</th>
                    <th className="px-4 py-3">Acta</th>
                    <th className="px-4 py-3">Delito</th>
                    <th className="px-4 py-3">Operador</th>
                    <th className="px-4 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosFiltrados.map((r) => {
                    const fecha = new Date(r.fechaRegistro).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fecha}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {r.apellidoNombre ?? "—"}
                          {r.dni && (
                            <span className="block text-xs text-gray-400 font-normal">{r.dni}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {r.numeroActa ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.tipoDelito ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.operador ?? "—"}</td>
                        <td className="px-4 py-3">
                          {r.resultado ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                COLORES[r.resultado] ?? "bg-gray-100 text-gray-700 border-gray-300"
                              }`}
                            >
                              {ETIQUETA_CORTA[r.resultado] ?? r.resultado}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {registrosFiltrados.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Mostrando {registrosFiltrados.length} de {registros.length} registros
          </p>
        )}
      </main>
    </div>
  );
}
