import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const MAX_REPORT_BYTES = 16 * 1024;
const MAX_URI_LENGTH = 2_000;
const MAX_DIRECTIVE_LENGTH = 100;

type LegacyCspReport = {
  "document-uri"?: unknown;
  "blocked-uri"?: unknown;
  "effective-directive"?: unknown;
  disposition?: unknown;
  "status-code"?: unknown;
};

type ReportingApiCspReport = {
  type?: unknown;
  url?: unknown;
  body?: {
    blockedURL?: unknown;
    disposition?: unknown;
    documentURL?: unknown;
    effectiveDirective?: unknown;
    statusCode?: unknown;
  };
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

const normalizeReportFields = ({
  documentUri: documentUriValue,
  blockedUri: blockedUriValue,
  effectiveDirective,
  disposition: dispositionValue,
  statusCode,
}: {
  documentUri: unknown;
  blockedUri: unknown;
  effectiveDirective: unknown;
  disposition: unknown;
  statusCode: unknown;
}) => {
  const documentUri = sanitizeUri(documentUriValue);
  const blockedUri = sanitizeUri(blockedUriValue);
  const disposition = dispositionValue === "reporting" ? "report" : dispositionValue;

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

const normalizeReport = (payload: unknown) => {
  const legacyReport = (payload as { "csp-report"?: LegacyCspReport })?.["csp-report"];
  if (legacyReport) {
    return normalizeReportFields({
      documentUri: legacyReport["document-uri"],
      blockedUri: legacyReport["blocked-uri"],
      effectiveDirective: legacyReport["effective-directive"],
      disposition: legacyReport.disposition,
      statusCode: legacyReport["status-code"],
    });
  }

  const reportingApiReport = Array.isArray(payload)
    ? payload.find(
        (report): report is ReportingApiCspReport =>
          typeof report === "object" && report !== null && (report as ReportingApiCspReport).type === "csp-violation",
      )
    : null;

  if (!reportingApiReport?.body) return null;

  return normalizeReportFields({
    documentUri: reportingApiReport.body.documentURL ?? reportingApiReport.url,
    blockedUri: reportingApiReport.body.blockedURL,
    effectiveDirective: reportingApiReport.body.effectiveDirective,
    disposition: reportingApiReport.body.disposition,
    statusCode: reportingApiReport.body.statusCode,
  });
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
