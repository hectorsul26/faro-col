import { Bot, InlineKeyboard, type Context } from "grammy";
import { CHANNEL_USERNAME } from "../config.js";
import {
  acquireSubmissionLock,
  checkRateLimit,
  deleteSession,
  getSession,
  nextRef,
  recordReportSubmission,
  releaseSubmissionLock,
  setSession,
  type ReportSession,
} from "../report-store.js";
import {
  getReportDefinition,
  isReportType,
  shouldNotifyChannel,
  type ChannelReport,
  type ReportStepDefinition,
  type ReportType,
} from "../reports/definitions.js";
import { formatAlertMessage, formatConfirmationCard } from "../reports/format.js";
import { EMERGENCY_LINES_TEXT } from "./emergencia.js";

const REPORT_SELECTOR_MESSAGE = [
  "<b>Reportar en Faro Col</b>",
  "",
  "Selecciona el tipo de reporte disponible ahora.",
  "",
  `Todos los reportes confirmados se publican en ${CHANNEL_USERNAME}.`,
  "",
  "Antes de enviar cualquier dato, Faro te mostrara una tarjeta de confirmacion.",
].join("\n");

const RESCUE_GATE_MESSAGE = [
  "<b>Antes de continuar con un rescate urgente</b>",
  "",
  EMERGENCY_LINES_TEXT,
  "",
  "Llama primero al 123. Faro Col es un proyecto ciudadano independiente que complementa la respuesta oficial, pero no reemplaza a las autoridades ni a los organismos oficiales de emergencia.",
].join("\n");

const REPORT_TYPES_AVAILABLE_NOW: ReportType[] = [
  "rescate_urgente",
  "dano_estructural",
  "necesidad_suministros",
  "refugio_disponible",
  "centro_acopio",
];

const REPORT_TYPE_BUTTON_LABELS: Record<ReportType, string> = {
  rescate_urgente: "🛟 Se necesita rescate",
  necesidad_suministros: "📦 Se necesitan suministros",
  refugio_disponible: "🏠 Ofrezco refugio",
  dano_estructural: "🏚️ Daño estructural",
  centro_acopio: "📦 Centro de acopio",
};

const HTML_NO_PREVIEW = {
  parse_mode: "HTML" as const,
  link_preview_options: { is_disabled: true },
};

const TEXT_NO_PREVIEW = {
  link_preview_options: { is_disabled: true },
};

const NEED_OPTIONS = [
  { id: "alimentos", label: "Alimentos" },
  { id: "medicinas", label: "Medicinas" },
  { id: "ropa", label: "Ropa" },
  { id: "panales_bebes", label: "Panales/bebes" },
  { id: "varios", label: "Varios/Todo" },
] as const;

type ReplyFn = (text: string, options?: Parameters<Context["reply"]>[1]) => Promise<unknown>;

export function registerReportarCommand(bot: Bot): void {
  bot.command("reportar", async (ctx) => {
    await ctx.reply(REPORT_SELECTOR_MESSAGE, {
      ...HTML_NO_PREVIEW,
      reply_markup: buildReportTypeKeyboard(),
    });
  });

  bot.command("cancelar", async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply("No pude identificar esta conversacion.", TEXT_NO_PREVIEW);
      return;
    }

    const session = await getSession(userId);

    if (!session) {
      await ctx.reply("No tienes un reporte en curso.", TEXT_NO_PREVIEW);
      return;
    }

    await deleteSession(userId);
    await ctx.reply("Reporte cancelado. No se envio ningun dato.", TEXT_NO_PREVIEW);
  });

  bot.callbackQuery(/^reportar:type:([a-z_]+)$/, async (ctx) => {
    const selectedType = ctx.match[1];

    if (!isReportType(selectedType)) {
      await ctx.answerCallbackQuery({
        text: "No reconoci ese tipo de reporte.",
        show_alert: true,
      });
      return;
    }

    if (!isReportTypeAvailableNow(selectedType)) {
      await ctx.answerCallbackQuery({
        text: "Ese tipo de reporte no esta disponible en este momento.",
        show_alert: true,
      });
      return;
    }

    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.answerCallbackQuery({
        text: "No pude identificar esta conversacion.",
        show_alert: true,
      });
      return;
    }

    if (selectedType === "rescate_urgente") {
      await deleteSession(userId);
      await ctx.answerCallbackQuery();
      await ctx.reply(RESCUE_GATE_MESSAGE, {
        ...HTML_NO_PREVIEW,
        reply_markup: buildRescueGateKeyboard(),
      });
      return;
    }

    const definition = getReportDefinition(selectedType);
    const session = createSession(selectedType);

    await setSession(userId, session);
    await ctx.answerCallbackQuery();
    await ctx.reply(definition.steps[0].prompt, TEXT_NO_PREVIEW);
  });

  bot.callbackQuery("reportar:rescue_gate:continue", async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.answerCallbackQuery({
        text: "No pude identificar esta conversacion.",
        show_alert: true,
      });
      return;
    }

    const definition = getReportDefinition("rescate_urgente");
    const session = createSession("rescate_urgente", {
      emergencyGateAccepted: true,
    });

    await setSession(userId, session);
    await ctx.answerCallbackQuery();
    await ctx.reply(definition.steps[0].prompt, TEXT_NO_PREVIEW);
  });

  bot.callbackQuery("reportar:rescue_gate:stop", async (ctx) => {
    const userId = ctx.from?.id;
    const session = userId ? await getSession(userId) : null;

    if (userId && session?.tipo === "rescate_urgente") {
      await deleteSession(userId);
    }

    await ctx.answerCallbackQuery();
    await ctx.reply(
      "Flujo cerrado. Llama primero al 123: las líneas oficiales son la vía principal para solicitar un rescate. Faro Col es un proyecto ciudadano independiente y no sustituye a las autoridades ni a los organismos oficiales de emergencia.",
      TEXT_NO_PREVIEW
    );
  });

  bot.callbackQuery("reportar:confirm", async (ctx) => {
    const userId = ctx.from?.id;
    const session = userId ? await getSession(userId) : null;

    if (!session || !isCompletedSession(session)) {
      await ctx.answerCallbackQuery({
        text: "Este reporte expiro o no esta listo. Inicia /reportar de nuevo.",
        show_alert: true,
      });
      return;
    }

    const rateLimit = await checkRateLimit(userId!);

    if (!rateLimit.allowed) {
      const message = [
        "Ya enviaste 3 reportes en la ultima hora.",
        `Intenta ${rateLimit.retryHint}.`,
      ].join(" ");

      await ctx.answerCallbackQuery({
        text: message,
        show_alert: true,
      });
      await ctx.reply(message, TEXT_NO_PREVIEW);
      return;
    }

    const lockAcquired = await acquireSubmissionLock(userId!);

    if (!lockAcquired) {
      await ctx.answerCallbackQuery({
        text: "Ya estoy enviando este reporte. Espera unos segundos.",
        show_alert: true,
      });
      return;
    }

    try {
      await ctx.answerCallbackQuery({ text: "Enviando reporte..." });

      const reference = await nextRef();
      const record = buildChannelReport(session);
      const alertPublished = await notifyAlertsChannel(ctx, record, reference);

      if (!alertPublished) {
        await ctx.reply(
          [
            `⚠️ No pudimos publicar tu reporte en ${CHANNEL_USERNAME}.`,
            "",
            "No se marcó como enviado ni contará dentro del límite de 3 reportes por hora. Conservaremos el borrador durante un máximo de 30 minutos para que puedas reintentar.",
            "",
            "Toca «Confirmar» para reintentar o usa /cancelar.",
          ].join("\n"),
          TEXT_NO_PREVIEW
        );
        return;
      }

      await finalizeSuccessfulReport(userId!);
      await ctx.reply(buildReportSentMessage(reference), TEXT_NO_PREVIEW);
    } catch (error) {
      console.error("Failed to finish report flow", error);
      await ctx.reply(
        "No pude cerrar el reporte en este momento. Intenta confirmar de nuevo o usa /cancelar.",
        TEXT_NO_PREVIEW
      );
    } finally {
      await releaseSubmissionLockSafely(userId!);
    }
  });

  bot.callbackQuery("reportar:cancel", async (ctx) => {
    const userId = ctx.from?.id;

    if (userId) {
      await deleteSession(userId);
    }

    await ctx.answerCallbackQuery();
    await ctx.reply("Reporte cancelado. No se envio ningun dato.", TEXT_NO_PREVIEW);
  });

  bot.callbackQuery(/^reportar:need:([a-z_]+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    const option = NEED_OPTIONS.find((candidate) => candidate.id === ctx.match[1]);
    const session = userId ? await getSession(userId) : null;

    if (!userId || !session || !isNeedsStep(session)) {
      await ctx.answerCallbackQuery({
        text: "Esta seleccion expiro. Inicia /reportar de nuevo.",
        show_alert: true,
      });
      return;
    }

    if (!option) {
      await ctx.answerCallbackQuery({
        text: "No reconoci esa opcion.",
        show_alert: true,
      });
      return;
    }

    const selectedNeeds = toggleNeed(getSelectedNeeds(session), option.label);
    const nextSession: ReportSession = {
      ...session,
      datos: {
        ...session.datos,
        needs: selectedNeeds,
      },
      updatedAt: new Date().toISOString(),
    };

    await setSession(userId, nextSession);
    await ctx.editMessageText(buildNeedsMessage(selectedNeeds), {
      ...HTML_NO_PREVIEW,
      reply_markup: buildNeedsKeyboard(selectedNeeds),
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("reportar:need_done", async (ctx) => {
    const userId = ctx.from?.id;
    const session = userId ? await getSession(userId) : null;

    if (!userId || !session || !isNeedsStep(session)) {
      await ctx.answerCallbackQuery({
        text: "Esta seleccion expiro. Inicia /reportar de nuevo.",
        show_alert: true,
      });
      return;
    }

    const selectedNeeds = getSelectedNeeds(session);

    if (selectedNeeds.length === 0) {
      await ctx.answerCallbackQuery({
        text: "Marca al menos una opcion antes de continuar.",
        show_alert: true,
      });
      return;
    }

    const definition = getReportDefinition("centro_acopio");
    const nextSession: ReportSession = {
      ...session,
      paso: session.paso + 1,
      updatedAt: new Date().toISOString(),
    };
    const nextStep = definition.steps[nextSession.paso];

    await setSession(userId, nextSession);
    await ctx.answerCallbackQuery();

    if (nextStep) {
      await ctx.reply(nextStep.prompt, TEXT_NO_PREVIEW);
      return;
    }

    await ctx.reply(formatConfirmationCard(nextSession), {
      ...HTML_NO_PREVIEW,
      reply_markup: buildConfirmationKeyboard(),
    });
  });

  bot.on("message:text", async (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await next();
      return;
    }

    const session = await getSession(userId);

    if (!session) {
      await next();
      return;
    }

    await handleReportAnswer(ctx.reply.bind(ctx), userId, session, ctx.message.text);
  });
}

function buildReportTypeKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  REPORT_TYPES_AVAILABLE_NOW.forEach((type, index) => {
    const definition = getReportDefinition(type);

    if (index > 0 && index % 2 === 0) {
      keyboard.row();
    }

    keyboard.text(REPORT_TYPE_BUTTON_LABELS[type] ?? definition.label, `reportar:type:${type}`);
  });

  return keyboard;
}

function buildRescueGateKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Ya llamé al 123, continuar", "reportar:rescue_gate:continue")
    .row()
    .text("Llamar al 123 primero", "reportar:rescue_gate:stop");
}

function isReportTypeAvailableNow(type: ReportType): boolean {
  return REPORT_TYPES_AVAILABLE_NOW.includes(type);
}

function createSession(
  type: ReportType,
  datos: Record<string, unknown> = {}
): ReportSession {
  const now = new Date().toISOString();

  return {
    tipo: type,
    paso: 0,
    datos,
    createdAt: now,
    updatedAt: now,
  };
}

async function handleReportAnswer(
  reply: ReplyFn,
  userId: number,
  session: ReportSession,
  text: string
): Promise<void> {
  if (!isReportType(session.tipo)) {
    await deleteSession(userId);
    await reply("El reporte en curso no es valido. Inicia /reportar de nuevo.", TEXT_NO_PREVIEW);
    return;
  }

  if (text.trim().toLowerCase() === "/cancelar") {
    await deleteSession(userId);
    await reply("Reporte cancelado. No se envio ningun dato.", TEXT_NO_PREVIEW);
    return;
  }

  if (session.tipo === "rescate_urgente" && !hasPassedRescueGate(session)) {
    await deleteSession(userId);
    await reply(RESCUE_GATE_MESSAGE, {
      ...HTML_NO_PREVIEW,
      reply_markup: buildRescueGateKeyboard(),
    });
    return;
  }

  const definition = getReportDefinition(session.tipo);
  const step = definition.steps[session.paso];

  if (!step) {
    await reply(formatConfirmationCard(session), {
      ...HTML_NO_PREVIEW,
      reply_markup: buildConfirmationKeyboard(),
    });
    return;
  }

  if (step.kind === "multi_select") {
    const selectedNeeds = getSelectedNeeds(session);

    await reply(buildNeedsMessage(selectedNeeds), {
      ...HTML_NO_PREVIEW,
      reply_markup: buildNeedsKeyboard(selectedNeeds),
    });
    return;
  }

  const value = text.trim();
  const wantsToSkip = value.toLowerCase() === "/saltar";

  if (wantsToSkip && !step.optional) {
    await reply("Este dato es necesario para continuar.", TEXT_NO_PREVIEW);
    await reply(step.prompt, TEXT_NO_PREVIEW);
    return;
  }

  if (!wantsToSkip && value.startsWith("/")) {
    await reply(getCommandDuringFlowMessage(step), TEXT_NO_PREVIEW);
    await reply(step.prompt, TEXT_NO_PREVIEW);
    return;
  }

  if (!wantsToSkip) {
    const validation = validateStep(step, value);

    if (!validation.ok) {
      await reply(validation.message, TEXT_NO_PREVIEW);
      await reply(step.prompt, TEXT_NO_PREVIEW);
      return;
    }
  }

  const nextSession: ReportSession = {
    ...session,
    paso: session.paso + 1,
    datos: {
      ...session.datos,
      [step.key]: wantsToSkip ? null : value,
    },
    updatedAt: new Date().toISOString(),
  };
  const nextStep = definition.steps[nextSession.paso];

  await setSession(userId, nextSession);

  if (nextStep) {
    if (nextStep.kind === "multi_select") {
      const selectedNeeds = getSelectedNeeds(nextSession);

      await reply(buildNeedsMessage(selectedNeeds), {
        ...HTML_NO_PREVIEW,
        reply_markup: buildNeedsKeyboard(selectedNeeds),
      });
      return;
    }

    await reply(nextStep.prompt, TEXT_NO_PREVIEW);
    return;
  }

  await reply(formatConfirmationCard(nextSession), {
    ...HTML_NO_PREVIEW,
    reply_markup: buildConfirmationKeyboard(),
  });
}

function validateStep(
  step: ReportStepDefinition,
  value: string
): ReturnType<NonNullable<ReportStepDefinition["validate"]>> {
  if (!step.validate) {
    return { ok: true };
  }

  return step.validate(value);
}

function isCompletedSession(session: ReportSession): boolean {
  if (!isReportType(session.tipo)) {
    return false;
  }

  if (session.tipo === "rescate_urgente" && !hasPassedRescueGate(session)) {
    return false;
  }

  const definition = getReportDefinition(session.tipo);

  return session.paso >= definition.steps.length;
}

function hasPassedRescueGate(session: ReportSession): boolean {
  return session.datos.emergencyGateAccepted === true;
}

function buildConfirmationKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Confirmar", "reportar:confirm")
    .text("Cancelar", "reportar:cancel");
}

function getCommandDuringFlowMessage(step: ReportStepDefinition): string {
  if (step.optional) {
    return "Estas llenando un reporte. Responde el dato, escribe /saltar o usa /cancelar.";
  }

  return "Estas llenando un reporte. Responde este dato o usa /cancelar.";
}

function buildChannelReport(session: ReportSession): ChannelReport {
  if (!isReportType(session.tipo)) {
    throw new Error("Invalid report type in completed session.");
  }

  if (session.tipo === "rescate_urgente") {
    return {
      record_type: session.tipo,
      city: getStringValue(session.datos.city),
      location_name: getStringValue(session.datos.address),
      summary: getStringValue(session.datos.description),
      title: buildTitle("Rescate urgente", session.datos.city),
    };
  }

  if (session.tipo === "necesidad_suministros") {
    return {
      record_type: session.tipo,
      city: getStringValue(session.datos.city),
      summary: getStringValue(session.datos.description),
      title: buildTitle("Suministros necesarios", session.datos.city),
    };
  }

  if (session.tipo === "refugio_disponible") {
    return {
      record_type: session.tipo,
      city: getStringValue(session.datos.city),
      location_name: getStringValue(session.datos.address),
      summary: getStringValue(session.datos.description),
      contact: getStringValue(session.datos.contact),
      title: buildTitle("Refugio disponible", session.datos.city),
    };
  }

  if (session.tipo === "dano_estructural") {
    return {
      record_type: session.tipo,
      city: getStringValue(session.datos.city),
      location_name: getStringValue(session.datos.address),
      summary: getStringValue(session.datos.description),
      title: buildTitle("Daño estructural", session.datos.city),
    };
  }

  if (session.tipo === "centro_acopio") {
    const title = getStringValue(session.datos.title);
    const needs = getSelectedNeeds(session);

    return {
      record_type: session.tipo,
      title: title || "Centro de acopio",
      city: getStringValue(session.datos.city),
      location_name: getStringValue(session.datos.address),
      summary: buildAcopioSummary(needs, session.datos.schedule),
      contact: getStringValue(session.datos.contact),
    };
  }

  throw new Error(`Unsupported report type: ${session.tipo}`);
}

function getStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildTitle(prefix: string, city: unknown): string {
  const cityText = getStringValue(city);

  return cityText ? `${prefix}: ${cityText}` : prefix;
}

function buildAcopioSummary(needs: string[], schedule: unknown): string | null {
  const lines = [];
  const scheduleText = getStringValue(schedule);

  if (needs.length > 0) {
    lines.push(`Reciben: ${needs.join(", ")}`);
  }

  if (scheduleText) {
    lines.push(`Horario: ${scheduleText}`);
  }

  return lines.length > 0 ? lines.join(". ") : null;
}

function isNeedsStep(session: ReportSession): boolean {
  if (session.tipo !== "centro_acopio") {
    return false;
  }

  const definition = getReportDefinition("centro_acopio");
  const step = definition.steps[session.paso];

  return step?.kind === "multi_select";
}

function getSelectedNeeds(session: ReportSession): string[] {
  return Array.isArray(session.datos.needs)
    ? session.datos.needs.filter((value): value is string => typeof value === "string")
    : [];
}

function toggleNeed(selectedNeeds: string[], label: string): string[] {
  if (selectedNeeds.includes(label)) {
    return selectedNeeds.filter((value) => value !== label);
  }

  return [...selectedNeeds, label];
}

function buildNeedsMessage(selectedNeeds: string[]): string {
  return [
    "<b>Que reciben?</b>",
    "Marca una o varias opciones y toca Listo.",
    "",
    selectedNeeds.length > 0
      ? `Seleccionado: ${selectedNeeds.join(", ")}`
      : "Seleccionado: ninguno",
  ].join("\n");
}

function buildNeedsKeyboard(selectedNeeds: string[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  NEED_OPTIONS.forEach((option, index) => {
    if (index > 0 && index % 2 === 0) {
      keyboard.row();
    }

    const prefix = selectedNeeds.includes(option.label) ? "[x] " : "";
    keyboard.text(`${prefix}${option.label}`, `reportar:need:${option.id}`);
  });

  return keyboard.row().text("Listo", "reportar:need_done");
}

async function notifyAlertsChannel(
  ctx: Context,
  record: ChannelReport,
  reference: string
): Promise<boolean> {
  const channelId = process.env.TELEGRAM_ALERTS_CHANNEL_ID;

  if (!channelId || !shouldNotifyChannel(record.record_type)) {
    return false;
  }

  try {
    await ctx.api.sendMessage(channelId, formatAlertMessage(record, reference), {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
    return true;
  } catch (error) {
    console.error("Failed to publish report alert", error);
    return false;
  }
}

async function finalizeSuccessfulReport(userId: number): Promise<void> {
  try {
    await recordReportSubmission(userId);
  } catch (error) {
    console.error("Failed to record report rate limit", error);
  }

  try {
    await deleteSession(userId);
  } catch (error) {
    console.error("Failed to delete completed report session", error);
  }
}

async function releaseSubmissionLockSafely(userId: number): Promise<void> {
  try {
    await releaseSubmissionLock(userId);
  } catch (error) {
    console.error("Failed to release report submission lock", error);
  }
}

function buildReportSentMessage(reference: string): string {
  return `Reporte enviado. Referencia: ${reference}. Ya es visible en ${CHANNEL_USERNAME}.`;
}
