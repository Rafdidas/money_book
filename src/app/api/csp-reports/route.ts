import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_REPORT_BYTES = 16 * 1024;
const MAX_URI_LENGTH = 2_000;
const MAX_DIRECTIVE_LENGTH = 100;

type CspReport = {
  "document-uri"?: unknown;
  "blocked-uri"?: unknown;
  "effective-directive"?: unknown;
  disposition?: unknown;
  "status-code"?: unknown;
};

const sanitizeUri = (value: unknown) => {
  if (typeof value !== "string" || value.length > MAX_URI_LENGTH) return null;

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
};

const normalizeReport = (payload: unknown) => {
  const report = (payload as { "csp-report"?: CspReport })?.["csp-report"];
  if (!report) return null;

  const documentUri = sanitizeUri(report["document-uri"]);
  const blockedUri = sanitizeUri(report["blocked-uri"]);
  const effectiveDirective = report["effective-directive"];
  const disposition = report.disposition;
  const statusCode = report["status-code"];

  if (
    !documentUri ||
    typeof effectiveDirective !== "string" ||
    !effectiveDirective ||
    effectiveDirective.length > MAX_DIRECTIVE_LENGTH ||
    (disposition !== "report" && disposition !== "enforce") ||
    (statusCode !== undefined && (typeof statusCode !== "number" || !Number.isInteger(statusCode) || statusCode < 0 || statusCode > 999))
  ) {
    return null;
  }

  return {
    document_uri: documentUri,
    blocked_uri: blockedUri,
    effective_directive: effectiveDirective,
    disposition,
    status_code: statusCode ?? null,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_REPORT_BYTES) {
      return new Response(null, { status: 413 });
    }

    const report = normalizeReport(JSON.parse(body));
    if (!report) return new Response(null, { status: 204 });

    const { error } = await createServiceClient().from("csp_reports").insert(report);
    if (error) console.error("csp-report-insert-failed", error.code);
  } catch (error) {
    console.error("csp-report-rejected", error instanceof Error ? error.name : "unknown");
  }

  return new Response(null, { status: 204 });
}
