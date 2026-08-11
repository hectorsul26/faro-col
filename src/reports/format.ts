import type { ReportSession } from "../report-store.js";
import { BOT_USERNAME } from "../config.js";
import {
  getReportDefinition,
  isReportType,
  type ChannelReport,
  type ReportStepDefinition,
  type ReportType,
} from "./definitions.js";

const ALERT_TITLE_MAX_LENGTH = 120;
const ALERT_LOCATION_MAX_LENGTH = 200;
const ALERT_SUMMARY_MAX_LENGTH = 700;
const ALERT_CATEGORY_LABELS: Record<ReportType, string> = {
  rescate_urgente: "🆘 URGENTE — Rescate",
  dano_estructural: "🏚 URGENTE — Daño estructural",
  centro_acopio: "📦 INFO — Centro de acopio",
  refugio_disponible: "🏠 INFO — Refugio disponible",
  necesidad_suministros: "🍼 INFO — Suministros necesarios",
};
const ALERT_UNVERIFIED_NOTICE =
  "⚠️ Reporte ciudadano no verificado. No sustituye a organismos oficiales.";

export function formatConfirmationCard(session: ReportSession): string {
  if (!isReportType(session.tipo)) {
    return [
      "<b>Confirmar reporte</b>",
      "",
      "No pude preparar el resumen de este reporte.",
    ].join("\n");
  }

  const definition = getReportDefinition(session.tipo);
  const lines = [
    "<b>Confirma antes de enviar</b>",
    "",
    `<b>Tipo:</b> ${escapeHtml(definition.label)}`,
    "",
    ...definition.steps.map((step) => formatStepValue(step, session.datos[step.key])),
    "",
    "<b>Responsabilidad</b>",
    "Al confirmar declaras que esta informacion es veridica.",
    "No publiques información falsa, ofensiva o que ponga en riesgo a terceros.",
    "Los reportes fraudulentos pueden desviar recursos de emergencia reales.",
  ];

  return lines.join("\n");
}

function formatStepValue(step: ReportStepDefinition, value: unknown): string {
  const displayValue = formatValue(value);

  return `<b>${escapeHtml(step.label)}:</b> ${escapeHtml(displayValue)}`;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "No indicado";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "No indicado";
  }

  return String(value);
}

export function formatAlertMessage(
  record: ChannelReport,
  reference: string,
  reportedAt = new Date()
): string {
  return [
    `<b>${escapeHtml(ALERT_CATEGORY_LABELS[record.record_type])}</b>`,
    "",
    ...formatAlertDetails(record, reportedAt),
    "",
    `Reportado vía ${BOT_USERNAME}`,
    `Ref: ${escapeHtml(reference)}`,
    "",
    ALERT_UNVERIFIED_NOTICE,
  ].join("\n");
}

function formatAlertDetails(record: ChannelReport, reportedAt: Date): string[] {
  const area = escapeHtml(formatAlertArea(record.city));
  const location = escapeHtml(
    truncateAlertText(record.location_name ?? "no indicado", ALERT_LOCATION_MAX_LENGTH)
  );
  const summary = formatAlertSummary(record);
  const reported = `Reportado: ${escapeHtml(formatAlertDate(reportedAt))}`;

  if (record.record_type === "rescate_urgente") {
    return [`Zona: ${area}`, `Lugar: ${location}`, `Situación: ${summary}`, reported];
  }

  if (record.record_type === "dano_estructural") {
    return [`Zona: ${area}`, `Lugar: ${location}`, `Descripción: ${summary}`, reported];
  }

  if (record.record_type === "necesidad_suministros") {
    return [`Zona: ${area}`, `Necesidad: ${summary}`, reported];
  }

  const lines = [];

  if (record.record_type === "centro_acopio") {
    lines.push(
      `Centro: ${escapeHtml(truncateAlertText(record.title ?? "Centro de acopio", ALERT_TITLE_MAX_LENGTH))}`
    );
  }

  lines.push(`Zona: ${area}`, `Lugar: ${location}`, `Detalles: ${summary}`);

  if (record.contact) {
    lines.push(
      `Contacto: ${escapeHtml(truncateAlertText(record.contact, ALERT_LOCATION_MAX_LENGTH))}`
    );
  }

  lines.push(reported);
  return lines;
}

function formatAlertSummary(record: ChannelReport): string {
  const value = record.summary ?? "sin descripcion";
  const safeSummary =
    record.record_type === "centro_acopio"
      ? value
      : maskPotentialDocumentNumbers(value);

  return escapeHtml(truncateAlertText(safeSummary, ALERT_SUMMARY_MAX_LENGTH));
}

export function maskPotentialDocumentNumbers(value: string): string {
  return value.replace(/(?<!\d)\d{6,10}(?!\d)/g, (digits) => {
    return `${"*".repeat(digits.length - 3)}${digits.slice(-3)}`;
  });
}

function formatAlertDate(value: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(value);
}

function formatAlertArea(value: string | null | undefined): string {
  return truncateAlertText(value ?? "zona no indicada", ALERT_TITLE_MAX_LENGTH);
}

function truncateAlertText(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
