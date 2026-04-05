import { appendFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

const LOG_NAME = "debug-d2e8da.log";

/**
 * Apenas em desenvolvimento: acrescenta uma linha NDJSON em `debug-d2e8da.log` (raiz do repo ou pasta `frontend/`).
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const payload = await request.json();
    const line = `${JSON.stringify({ ...payload, timestamp: Date.now() })}\n`;
    const candidates = [
      path.join(process.cwd(), "..", LOG_NAME),
      path.join(process.cwd(), LOG_NAME)
    ];
    let lastError: unknown;
    for (const logPath of candidates) {
      try {
        await appendFile(logPath, line, "utf8");
        return NextResponse.json({ ok: true, path: logPath });
      } catch (error) {
        lastError = error;
      }
    }
    return NextResponse.json(
      { ok: false, message: String(lastError) },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, message: String(error) }, { status: 500 });
  }
}
