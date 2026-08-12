import assert from "node:assert/strict";
import { test } from "node:test";
import { Bot } from "grammy";
import type { Update } from "grammy/types";
import { registerReportarCommand } from "../src/commands/reportar.js";
import {
  checkRateLimit,
  getSession,
  recordReportSubmission,
  setSession,
  type ReportSession,
} from "../src/report-store.js";

const ALERTS_CHANNEL_ID = "-1009000000001";

test("un segundo toque en Confirmar no republica ni consume otro cupo", async () => {
  process.env.TELEGRAM_ALERTS_CHANNEL_ID = ALERTS_CHANNEL_ID;

  const userId = 9_001_001;
  const now = new Date().toISOString();
  const completedSession: ReportSession = {
    tipo: "necesidad_suministros",
    paso: 2,
    datos: {
      city: "Cali",
      description: "Se necesitan agua y alimentos",
    },
    createdAt: now,
    updatedAt: now,
  };
  const apiCalls: Array<{
    method: string;
    payload: Record<string, unknown>;
  }> = [];
  const bot = new Bot("123456:test-token", {
    botInfo: {
      id: 123456,
      is_bot: true,
      first_name: "Faro Test",
      username: "FaroTestBot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    },
  });

  bot.api.config.use(async (_previous, method, payload) => {
    const requestPayload = payload as unknown as Record<string, unknown>;

    apiCalls.push({
      method,
      payload: requestPayload,
    });

    if (method === "sendMessage") {
      const chatId = requestPayload.chat_id;

      return {
        ok: true,
        result: {
          message_id: apiCalls.length,
          date: Math.floor(Date.now() / 1000),
          chat:
            String(chatId) === ALERTS_CHANNEL_ID
              ? { id: Number(chatId), type: "channel", title: "Alertas Test" }
              : { id: Number(chatId), type: "private", first_name: "Persona Test" },
          text: requestPayload.text,
        },
      } as never;
    }

    return { ok: true, result: true } as never;
  });
  registerReportarCommand(bot);
  await setSession(userId, completedSession);

  await bot.handleUpdate(buildConfirmationUpdate(1, userId));

  const sentSession = await getSession(userId);
  const reference = sentSession?.submission?.reference;

  assert.equal(sentSession?.submission?.status, "sent");
  assert.match(reference ?? "", /^#FCOL-\d{5,}$/);
  assert.deepEqual(sentSession?.datos, {});

  await bot.handleUpdate(buildConfirmationUpdate(2, userId));

  const channelPublications = apiCalls.filter(
    ({ method, payload }) =>
      method === "sendMessage" && String(payload.chat_id) === ALERTS_CHANNEL_ID
  );
  const duplicateAnswer = [...apiCalls].reverse().find(
    ({ method, payload }) =>
      method === "answerCallbackQuery" && payload.callback_query_id === "confirm-2"
  );

  assert.equal(channelPublications.length, 1);
  assert.equal(
    duplicateAnswer?.payload.text,
    `Este reporte ya fue enviado (${reference}).`
  );

  await recordReportSubmission(userId);
  assert.deepEqual(await checkRateLimit(userId), { allowed: true });

  await recordReportSubmission(userId);
  assert.equal((await checkRateLimit(userId)).allowed, false);
});

function buildConfirmationUpdate(updateId: number, userId: number): Update {
  return {
    update_id: updateId,
    callback_query: {
      id: `confirm-${updateId}`,
      from: {
        id: userId,
        is_bot: false,
        first_name: "Persona Test",
      },
      chat_instance: "test-chat-instance",
      data: "reportar:confirm",
      message: {
        message_id: 100,
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: userId,
          type: "private",
          first_name: "Persona Test",
        },
        text: "Confirmar reporte",
      },
    },
  };
}
