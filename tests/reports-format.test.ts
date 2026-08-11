import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAlertMessage,
  maskPotentialDocumentNumbers,
} from "../src/reports/format.js";

test("enmascara una cédula en medio de una oración", () => {
  assert.equal(
    maskPotentialDocumentNumbers(
      "La cédula 1098765432 corresponde al reportante."
    ),
    "La cédula *******432 corresponde al reportante."
  );
});

test("enmascara también un número telefónico de diez dígitos", () => {
  assert.equal(
    maskPotentialDocumentNumbers("Llama al 3001234567 para confirmar."),
    "Llama al *******567 para confirmar."
  );
});

test("no altera texto que no contiene secuencias numéricas", () => {
  const text = "Hay dos personas esperando ayuda junto al puente.";

  assert.equal(maskPotentialDocumentNumbers(text), text);
});

test("el formateador solo enmascara la descripción libre", () => {
  const reportedAt = new Date("2026-08-11T15:30:00.000Z");
  const message = formatAlertMessage(
    {
      record_type: "rescate_urgente",
      city: "Zona 123456",
      location_name: "Punto 654321",
      summary: "La cédula es 1098765432.",
    },
    "#FCOL-12345",
    reportedAt
  );
  const expectedTimestamp = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(reportedAt);

  assert.ok(message.includes("Situación: La cédula es *******432."));
  assert.ok(message.includes("Zona: Zona 123456"));
  assert.ok(message.includes("Lugar: Punto 654321"));
  assert.ok(message.includes("Ref: #FCOL-12345"));
  assert.ok(message.includes(`Reportado: ${expectedTimestamp}`));
});

test("no enmascara el resumen estructurado de un centro de acopio", () => {
  const message = formatAlertMessage(
    {
      record_type: "centro_acopio",
      city: "Cali",
      location_name: "Centro",
      summary: "Reciben 123456 cajas",
    },
    "#FCOL-54321"
  );

  assert.ok(message.includes("Detalles: Reciben 123456 cajas"));
});
