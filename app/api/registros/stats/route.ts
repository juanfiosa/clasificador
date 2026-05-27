import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [total, porResultado] = await Promise.all([
      prisma.clasificacion.count(),
      prisma.clasificacion.groupBy({
        by: ["resultado", "resultadoTexto"],
        _count: { id: true },
        orderBy: { resultado: "asc" },
      }),
    ]);

    const stats = {
      total,
      porResultado: porResultado.map((r) => ({
        resultado:      r.resultado,
        resultadoTexto: r.resultadoTexto,
        cantidad:       r._count.id,
        porcentaje:     total > 0 ? r._count.id / total : 0,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/registros/stats error:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
