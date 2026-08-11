import type { Bot } from "grammy";
import {
  BOT_URL,
  BOT_USERNAME,
  CHANNEL_URL,
  CHANNEL_USERNAME,
  COLOMBIA_TE_BUSCA_URL,
  CONTACT_EMAIL,
  PRIVACY_URL,
  REPO_URL,
} from "../config.js";

const INDEPENDENCE_NOTICE = [
  "Faro Colombia 🇨🇴 es un proyecto ciudadano independiente.",
  "No reemplaza a las autoridades ni a los organismos oficiales de emergencia. Ante una emergencia, llama al 123.",
].join("\n");

const ALERT_CHANNEL_PURPOSE =
  `📡 El canal ${CHANNEL_USERNAME} existe para que rescatistas y voluntarios reciban en tiempo real lo que la comunidad reporta aquí.`;

const MISSING_PEOPLE_NOTICE =
  `Este bot NO gestiona búsqueda de personas. Para eso existe [ColombiaTeBusca (colombiatebusca.com)](${COLOMBIA_TE_BUSCA_URL}), una plataforma independiente y sin ninguna relación con Faro Colombia — solo la mencionamos aquí como referencia útil.`;

const START_MESSAGE = [
  "*Faro Colombia 🇨🇴*",
  "",
  "Bot ciudadano para enviar reportes humanitarios en Colombia a un canal público de alertas.",
  "",
  INDEPENDENCE_NOTICE,
  "",
  ALERT_CHANNEL_PURPOSE,
  "",
  "*Comandos*",
  "/reportar",
  "/emergencia",
  "/ayuda",
  "",
  "*Personas desaparecidas*",
  MISSING_PEOPLE_NOTICE,
  "",
  `Los reportes confirmados se publican en [${CHANNEL_USERNAME}](${CHANNEL_URL}).`,
  `Bot público: [${BOT_USERNAME}](${BOT_URL}).`,
  `Política de privacidad: [PRIVACY.md](${PRIVACY_URL}).`,
  "",
  `Contacto: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).`,
  `Repositorio: [GitHub](${REPO_URL}).`,
  "Creado por: Ing. Héctor Sulbarán",
].join("\n");

const HELP_MESSAGE = [
  "*Ayuda de Faro Colombia 🇨🇴*",
  "",
  "Faro Colombia 🇨🇴 recibe reportes ciudadanos humanitarios y los publica en un canal de Telegram para rescatistas y voluntarios.",
  "",
  INDEPENDENCE_NOTICE,
  "",
  ALERT_CHANNEL_PURPOSE,
  "",
  "*Cómo usarlo*",
  "/reportar abre el flujo guiado para rescate urgente, daño estructural, suministros, refugio o centro de acopio.",
  "/emergencia muestra las líneas oficiales de Colombia.",
  "/cancelar detiene un reporte en curso sin publicarlo.",
  "Solo puedes confirmar 3 reportes por hora.",
  "",
  "*Personas desaparecidas*",
  MISSING_PEOPLE_NOTICE,
  "",
  `Todos los reportes confirmados se publican en [${CHANNEL_USERNAME}](${CHANNEL_URL}) como información ciudadana no verificada.`,
  `Política de privacidad: [PRIVACY.md](${PRIVACY_URL}).`,
  "",
  `Contacto: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL}).`,
  `Repositorio: [GitHub](${REPO_URL}).`,
  "Creado por: Ing. Héctor Sulbarán",
].join("\n");

const MARKDOWN_NO_PREVIEW = {
  parse_mode: "Markdown" as const,
  link_preview_options: { is_disabled: true }
};

export function registerStartCommands(bot: Bot): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(START_MESSAGE, MARKDOWN_NO_PREVIEW);
  });

  bot.command("ayuda", async (ctx) => {
    await ctx.reply(HELP_MESSAGE, MARKDOWN_NO_PREVIEW);
  });
}
