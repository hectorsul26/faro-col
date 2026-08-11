import {
  checkRateLimit,
  deleteSession,
  getReportStoreMode,
  getSession,
  nextRef,
  recordReportSubmission,
  type ReportSession,
  setSession,
} from "../src/report-store.js";

const userId = `check-report-store-${Date.now()}`;
const now = new Date().toISOString();
const session: ReportSession = {
  tipo: "rescate_urgente",
  paso: 1,
  datos: {
    descripcion: "Reporte de prueba",
    ciudad: "Cali",
  },
  createdAt: now,
  updatedAt: now,
};

await setSession(userId, session, 60);

const loadedSession = await getSession(userId);

if (!loadedSession) {
  throw new Error("Report store check failed: session was not saved.");
}

if (loadedSession.datos.descripcion !== session.datos.descripcion) {
  throw new Error("Report store check failed: session data changed.");
}

const rateLimit = await checkRateLimit(userId);

if (!rateLimit.allowed) {
  throw new Error(`Report store check failed: rate limit blocked unexpectedly ${rateLimit.retryHint}.`);
}

for (let index = 0; index < 3; index += 1) {
  await recordReportSubmission(userId);
}

const blockedRateLimit = await checkRateLimit(userId);

if (blockedRateLimit.allowed) {
  throw new Error("Report store check failed: fourth report was not blocked.");
}

const ref = await nextRef();

if (!/^#FCOL-\d{5,}$/.test(ref)) {
  throw new Error(`Report store check failed: invalid reference ${ref}.`);
}

await deleteSession(userId);

const deletedSession = await getSession(userId);

if (deletedSession) {
  throw new Error("Report store check failed: session was not deleted.");
}

console.log(`Report store OK (${getReportStoreMode()})`);
console.log(`Reference OK: ${ref}`);
