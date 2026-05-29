import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

// Todas las preguntas en orden, con etiqueta corta para el header
const PREGUNTAS = [
  // Momento 1
  { id: "M1_1", header: "M1.1 — ¿No encuadra en figura penal?" },
  { id: "M1_2", header: "M1.2 — ¿Causa de justificación?" },
  { id: "M1_3", header: "M1.3 — ¿Inimputable?" },
  { id: "M1_4", header: "M1.4 — ¿Excusa absolutoria?" },
  // Momento 2
  { id: "M2_1", header: "M2.1 — ¿Funcionario público?" },
  { id: "M2_2", header: "M2.2 — ¿Pena mínima > 3 años?" },
  { id: "M2_3", header: "M2.3 — ¿Criminalidad organizada?" },
  { id: "M2_4", header: "M2.4 — ¿Incompatible con DDHH?" },
  { id: "M2_5", header: "M2.5 — ¿Pena de inhabilitación?" },
  { id: "M2_6", header: "M2.6 — ¿Víctima menor de edad?" },
  { id: "M2_7", header: "M2.7 — ¿Usó menor para cometer el hecho?" },
  { id: "M2_8", header: "M2.8 — ¿Violencia doméstica/género/discriminatoria?" },
  { id: "M2_9", header: "M2.9 — ¿Grave violencia física?" },
  // Antecedentes
  { id: "A_1", header: "A.1 — ¿Antecedentes penales computables?" },
  { id: "A_2", header: "A.2 — ¿Beneficiado con RDAP anterior?" },
  { id: "A_3", header: "A.3 — ¿Beneficiado con SPAP anterior?" },
  // Composicional
  { id: "C_1", header: "C.1 — ¿Particular ofendido/a?" },
  { id: "C_2", header: "C.2 — ¿Voluntad distinta a la pena?" },
  { id: "C_3", header: "C.3 — ¿Igualdad imputado-ofendida?" },
  // Pena natural
  { id: "PN_1", header: "PN.1 — ¿Daño físico/moral hace innecesaria la pena?" },
  // Enfermedad terminal
  { id: "ET_1", header: "ET.1 — ¿Enfermedad terminal?" },
  // Insignificancia
  { id: "INS_1", header: "INS.1 — ¿Hecho insignificante?" },
  // Participación menor
  { id: "PM_1", header: "PM.1 — ¿Múltiples partícipes?" },
  { id: "PM_2", header: "PM.2 — ¿Se determina acción de c/u?" },
  { id: "PM_3", header: "PM.3 — ¿Acción de menor relevancia?" },
  // Pena menor
  { id: "PE_1", header: "PE.1 — ¿Múltiples procesos o pena vigente?" },
  { id: "PE_2", header: "PE.2 — ¿Pena por este hecho irrelevante?" },
  // SPAP
  { id: "SP_1", header: "SP.1 — ¿Pena no privativa de libertad?" },
  { id: "SP_2", header: "SP.2 — ¿Condena anterior + 5 años + pena ≤ 3 años?" },
  { id: "SP_3", header: "SP.3 — ¿Condena condicional probable?" },
] as const;

function fmtRespuesta(val: unknown): string {
  if (val === "SI") return "Sí";
  if (val === "NO") return "No";
  if (val === "NO_APLICA") return "No aplica";
  return "—";
}

export async function GET() {
  try {
    const registros = await prisma.clasificacion.findMany({
      orderBy: { fechaRegistro: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Clasificador MPF Córdoba";
    wb.created = new Date();

    const ws = wb.addWorksheet("Clasificaciones", {
      views: [{ state: "frozen", ySplit: 2 }],
    });

    // ── Columnas ────────────────────────────────────────────────────────────
    ws.columns = [
      { key: "id",             width: 6  },
      { key: "fechaRegistro",  width: 18 },
      { key: "operador",       width: 22 },
      { key: "numeroActa",     width: 14 },
      { key: "apellidoNombre", width: 28 },
      { key: "dni",            width: 14 },
      { key: "tipoDelito",     width: 24 },
      { key: "fechaHecho",     width: 13 },
      { key: "descripcion",    width: 40 },
      ...PREGUNTAS.map((p) => ({ key: p.id, width: 14 })),
      { key: "resultado",      width: 42 },
    ];

    // ── Fila de encabezado de grupos (fila 1) ────────────────────────────────
    const grupoRow = ws.getRow(1);

    const grupos: { label: string; cols: number }[] = [
      { label: "DATOS DEL CASO",            cols: 9  },
      { label: "MOMENTO 1 — Exclusiones sobreseimiento",  cols: 4  },
      { label: "MOMENTO 2 — Exclusiones RDAP",            cols: 9  },
      { label: "ANTECEDENTES",              cols: 3  },
      { label: "COMPOSICIONAL",             cols: 3  },
      { label: "PENA NATURAL",              cols: 1  },
      { label: "ENFERMED. TERMINAL",        cols: 1  },
      { label: "INSIGNIFICANCIA",           cols: 1  },
      { label: "PARTICIP. MENOR RELEVANCIA",cols: 3  },
      { label: "PENA MENOR",                cols: 2  },
      { label: "SPAP",                      cols: 3  },
      { label: "RESULTADO",                 cols: 1  },
    ];

    let colIdx = 1;
    for (const g of grupos) {
      const startCol = colIdx;
      const endCol   = colIdx + g.cols - 1;
      const cell     = grupoRow.getCell(startCol);
      cell.value     = g.label;
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border    = { right: { style: "medium", color: { argb: "FFFFFFFF" } } };
      if (g.cols > 1) ws.mergeCells(1, startCol, 1, endCol);
      colIdx += g.cols;
    }
    grupoRow.height = 28;

    // ── Fila de encabezados de columnas (fila 2) ─────────────────────────────
    const headerRow = ws.getRow(2);
    const headers = [
      "#", "Fecha de clasificación", "Funcionario", "N° de acta",
      "Apellido y nombre", "DNI", "Tipo de delito", "Fecha del hecho", "Descripción",
      ...PREGUNTAS.map((p) => p.header),
      "Resultado",
    ];
    headers.forEach((h, i) => {
      const cell     = headerRow.getCell(i + 1);
      cell.value     = h;
      cell.font      = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5F8A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    headerRow.height = 48;

    // ── Filas de datos ────────────────────────────────────────────────────────
    const respMap: Record<string, unknown> = {};
    registros.forEach((reg, i) => {
      const resp = (reg.respuestas ?? {}) as Record<string, unknown>;
      PREGUNTAS.forEach((p) => { respMap[p.id] = resp[p.id] ?? null; });

      const dataRow = ws.addRow({
        id:             reg.id,
        fechaRegistro:  new Date(reg.fechaRegistro).toLocaleString("es-AR"),
        operador:       reg.operador       ?? "",
        numeroActa:     reg.numeroActa     ?? "",
        apellidoNombre: reg.apellidoNombre ?? "",
        dni:            reg.dni            ?? "",
        tipoDelito:     reg.tipoDelito     ?? "",
        fechaHecho:     reg.fechaHecho
          ? new Date(reg.fechaHecho + "T12:00:00").toLocaleDateString("es-AR")
          : "",
        descripcion:    reg.descripcion    ?? "",
        ...Object.fromEntries(
          PREGUNTAS.map((p) => [p.id, fmtRespuesta(resp[p.id])])
        ),
        resultado: reg.resultadoTexto ?? reg.resultado ?? "",
      });

      // Zebra + alineación
      const bg = i % 2 === 0 ? "FFF5F7FA" : "FFFFFFFF";
      dataRow.eachCell((cell, colNum) => {
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = { vertical: "top", wrapText: colNum === 9 };
        cell.font      = { size: 9 };
        // Colorear respuestas SI en verde claro, NO en gris
        if (colNum >= 10 && colNum <= 9 + PREGUNTAS.length) {
          if (cell.value === "Sí")
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
          else if (cell.value === "No")
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
        }
      });
      dataRow.height = 18;
    });

    // ── Hoja de estadísticas ─────────────────────────────────────────────────
    const wsStats = wb.addWorksheet("Estadísticas");
    wsStats.columns = [
      { key: "item",      width: 52 },
      { key: "cantidad",  width: 12 },
      { key: "pct",       width: 18 },
    ];

    const totalRow = wsStats.addRow({ item: "Total de casos clasificados", cantidad: registros.length, pct: "100%" });
    totalRow.font = { bold: true };

    const porResultado: Record<string, number> = {};
    registros.forEach((r) => {
      const k = r.resultadoTexto ?? r.resultado ?? "Sin resultado";
      porResultado[k] = (porResultado[k] ?? 0) + 1;
    });

    Object.entries(porResultado).forEach(([key, count]) => {
      wsStats.addRow({
        item:     key,
        cantidad: count,
        pct:      registros.length > 0 ? `${((count / registros.length) * 100).toFixed(1)}%` : "0%",
      });
    });

    // ── Respuesta ─────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const fecha  = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="clasificaciones-${fecha}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/registros/exportar error:", error);
    return NextResponse.json({ error: "Error al generar el Excel" }, { status: 500 });
  }
}
