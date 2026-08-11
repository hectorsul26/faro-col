import type { Bot } from "grammy";

const FALLBACK_MESSAGE = [
  "<b>No reconoci ese mensaje.</b>",
  "",
  "Usa estos comandos:",
  "/reportar",
  "/emergencia",
  "/ayuda",
  "",
  "Ejemplos:",
  "/reportar"
].join("\n");

export function registerFallbackCommand(bot: Bot): void {
  bot.on("message:text", async (ctx) => {
    await ctx.reply(FALLBACK_MESSAGE, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true }
    });
  });
}
