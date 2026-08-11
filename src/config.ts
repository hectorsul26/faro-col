export const CONTACT_EMAIL = "andesolutionsteam@gmail.com";
export const BOT_URL = "https://t.me/FaroColombiaBot";
export const CHANNEL_URL = "https://t.me/FaroColAlertas";
export const REPO_URL = "https://github.com/hectorsul26/faro-col";
export const WEBHOOK_BASE_URL = "https://faro-col.vercel.app";
export const COLOMBIA_TE_BUSCA_URL = "https://colombiatebusca.com/";

export const BOT_USERNAME = telegramUsername(BOT_URL);
export const CHANNEL_USERNAME = telegramUsername(CHANNEL_URL);
export const PRIVACY_URL = `${REPO_URL}/blob/main/PRIVACY.md`;
export const WEBHOOK_URL = `${WEBHOOK_BASE_URL}/api/webhook`;

function telegramUsername(url: string): string {
  const username = new URL(url).pathname.replace(/^\/+|\/+$/g, "");

  if (!username) {
    throw new Error(`Invalid Telegram URL: ${url}`);
  }

  return `@${username}`;
}
