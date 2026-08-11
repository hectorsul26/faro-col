import { readFile, writeFile } from "node:fs/promises";
import {
  BOT_URL,
  BOT_USERNAME,
  CHANNEL_URL,
  CHANNEL_USERNAME,
  COLOMBIA_TE_BUSCA_URL,
  CONTACT_EMAIL,
  PRIVACY_URL,
  REPO_URL,
  WEBHOOK_BASE_URL,
  WEBHOOK_URL,
} from "../src/config.js";

const PROJECT_ROOT_URL = new URL("../", import.meta.url);
const CHECK_ONLY = process.argv.includes("--check");

const REPLACEMENTS: Record<string, string> = {
  BOT_URL,
  BOT_USERNAME,
  CHANNEL_URL,
  CHANNEL_USERNAME,
  COLOMBIA_TE_BUSCA_URL,
  CONTACT_EMAIL,
  PRIVACY_URL,
  REPO_URL,
  WEBHOOK_BASE_URL,
  WEBHOOK_URL,
};

const DOCUMENTS = [
  { template: "docs/README.template.md", output: "README.md" },
  { template: "docs/PRIVACY.template.md", output: "PRIVACY.md" },
] as const;

let hasMismatch = false;

for (const document of DOCUMENTS) {
  const templateUrl = new URL(document.template, PROJECT_ROOT_URL);
  const outputUrl = new URL(document.output, PROJECT_ROOT_URL);
  const template = await readFile(templateUrl, "utf8");
  const expected = renderTemplate(template);

  if (CHECK_ONLY) {
    const current = await readFile(outputUrl, "utf8").catch(() => null);

    if (current !== expected) {
      console.error(`${document.output} is out of sync. Run npm run docs:sync.`);
      hasMismatch = true;
    }

    continue;
  }

  await writeFile(outputUrl, expected, "utf8");
  console.log(`Generated ${document.output}`);
}

if (hasMismatch) {
  process.exitCode = 1;
} else if (CHECK_ONLY) {
  console.log("Generated documentation is in sync.");
}

function renderTemplate(template: string): string {
  const rendered = template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key: string) => {
    const value = REPLACEMENTS[key];

    if (value === undefined) {
      throw new Error(`Unknown documentation placeholder: ${key}`);
    }

    return value;
  });

  if (/\{\{[^}]+\}\}/.test(rendered)) {
    throw new Error("Unresolved documentation placeholder found.");
  }

  return rendered;
}
