import type { Bot } from "grammy";

export const EMERGENCY_LINES_TEXT = [
  "123 — Línea de emergencia",
  "112 — Policía Nacional",
  "132 — Cruz Roja Colombiana",
  "144 — Defensa Civil",
  "119 — Bomberos",
].join("\n");

const EMERGENCY_MESSAGE = [
  "<b>Líneas oficiales de emergencia en Colombia</b>",
  "",
  EMERGENCY_LINES_TEXT,
  "",
  "Ante una emergencia, usa primero las líneas oficiales.",
].join("\n");

export function registerEmergenciaCommand(bot: Bot): void {
  bot.command("emergencia", async (ctx) => {
    await ctx.reply(EMERGENCY_MESSAGE, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  });
}
