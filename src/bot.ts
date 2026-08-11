import { Bot } from "grammy";
import { registerEmergenciaCommand } from "./commands/emergencia.js";
import { registerFallbackCommand } from "./commands/fallback.js";
import { registerReportarCommand } from "./commands/reportar.js";
import { registerStartCommands } from "./commands/start.js";

export function createBot(token = process.env.TELEGRAM_BOT_TOKEN): Bot {
  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable.");
  }

  const bot = new Bot(token);

  registerStartCommands(bot);
  registerEmergenciaCommand(bot);
  registerReportarCommand(bot);
  registerFallbackCommand(bot);

  bot.catch(async (error) => {
    console.error("Unhandled bot error", error.error);

    try {
      await error.ctx.reply(
        "No pude completar esa accion en este momento. Intenta de nuevo en unos minutos.",
        { link_preview_options: { is_disabled: true } }
      );
    } catch (replyError) {
      console.error("Failed to send error message", replyError);
    }
  });

  return bot;
}
