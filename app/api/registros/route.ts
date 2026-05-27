import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.clasificacion.findMany({
        orderBy: { fechaRegistro: "desc" },
        skip,
        take: limit,
      }),
      prisma.clasificacion.count(),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error("GET /api/registros error:", error);
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      numeroActa, apellidoNombre, dni, tipoDelito, fechaHecho, descripcion,
      operador, respuestas, grupo, resultado, resultadoTexto,
    } = body;

    const registro = await prisma.clasificacion.create({
      data: {
        numeroActa:     numeroActa     ?? null,
        apellidoNombre: apellidoNombre ?? null,
        dni:            dni            ?? null,
        tipoDelito:     tipoDelito     ?? null,
        fechaHecho:     fechaHecho     ?? null,
        descripcion:    descripcion    ?? null,
        operador:       operador       ?? null,
        respuestas:     respuestas     ?? {},
        grupo:          grupo          != null ? Number(grupo) : null,
        resultado:      resultado      ?? null,
        resultadoTexto: resultadoTexto ?? null,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("POST /api/registros error:", error);
    return NextResponse.json({ error: "Error al guardar registro" }, { status: 500 });
  }
}
