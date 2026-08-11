import { createBot } from "./bot.js";

const bot = createBot();

console.log("Faro Col dev bot starting with long polling...");

await bot.start({
  onStart: (botInfo) => {
    console.log(`Faro Col dev bot running as @${botInfo.username}`);
  }
});
