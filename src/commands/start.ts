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

const MISSING_PEOPLE_NOTICE =
  `Este bot no gestiona búsqueda de personas. Para eso existe [ColombiaTeBusca (colombiatebusca.com)](${COLOMBIA_TE_BUSCA_URL}) — plataforma independiente, sin relación con este proyecto.`;

const START_MESSAGE = [
  "*Faro Colombia 🇨🇴*",
  "",
  `Reporta lo que veas del terremoto —daños, necesidades, refugios, centros de acopio o rescates urgentes— y llega en segundos a rescatistas y voluntarios en [${CHANNEL_USERNAME}](${CHANNEL_URL}).`,
  "",
  "Cualquiera puede reportar. El canal es principalmente para rescatistas y voluntarios en terreno.",
  "",
  "Proyecto ciudadano independiente. No reemplaza a las autoridades ni a los organismos oficiales de emergencia. Ante una emergencia, llama al 123.",
  "",
  "*Comandos*",
  "/reportar",
  "/emergencia",
  "/ayuda",
  "",
  "*Personas desaparecidas*",
  MISSING_PEOPLE_NOTICE,
  "",
  `Bot: [${BOT_USERNAME}](${BOT_URL}) · Canal: [${CHANNEL_USERNAME}](${CHANNEL_URL})`,
  `Privacidad: [PRIVACY.md](${PRIVACY_URL}) · Contacto: [${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`,
  `Repositorio: [GitHub](${REPO_URL}) · Creado por: Ing. Héctor Sulbarán`,
].join("\n");

const HELP_MESSAGE = [
  "*Ayuda de Faro Colombia 🇨🇴*",
  "",
  "Cualquier persona puede reportar daños, necesidades, refugios, centros de acopio o rescates urgentes.",
  `El canal ${CHANNEL_USERNAME} está dirigido principalmente a rescatistas y voluntarios en terreno; no es exclusivo para personas ya organizadas en labores de rescate.`,
  "",
  INDEPENDENCE_NOTICE,
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
