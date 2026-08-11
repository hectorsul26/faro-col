import { createBot } from "./bot.js";

const bot = createBot();

console.log("Faro Colombia 🇨🇴 dev bot starting with long polling...");

await bot.start({
  onStart: (botInfo) => {
    console.log(`Faro Colombia 🇨🇴 dev bot running as @${botInfo.username}`);
  }
});
