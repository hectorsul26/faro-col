import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { webhookCallback } from "grammy";
import { createBot } from "../src/bot.js";

const bot = createBot();
const handleWebhook = webhookCallback(bot, "http");
const TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token";

export default function handler(req: IncomingMessage, res: ServerResponse): void | Promise<void> {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = getHeader(req, TELEGRAM_SECRET_HEADER);

  if (!expectedSecret) {
    console.error("Missing TELEGRAM_WEBHOOK_SECRET environment variable.");
    res.statusCode = 500;
    res.end("Webhook secret not configured.");
    return;
  }

  if (!receivedSecret || !isSameSecret(receivedSecret, expectedSecret)) {
    res.statusCode = 401;
    res.end("Unauthorized.");
    return;
  }

  return handleWebhook(req, res);
}

function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];

  return Array.isArray(value) ? value[0] : value;
}

function isSameSecret(receivedSecret: string, expectedSecret: string): boolean {
  const received = Buffer.from(receivedSecret);
  const expected = Buffer.from(expectedSecret);

  return received.length === expected.length && timingSafeEqual(received, expected);
}
