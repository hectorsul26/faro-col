export type ReportType =
  | "rescate_urgente"
  | "necesidad_suministros"
  | "refugio_disponible"
  | "dano_estructural"
  | "centro_acopio";

export type ChannelReport = {
  record_type: ReportType;
  title?: string | null;
  summary?: string | null;
  location_name?: string | null;
  city?: string | null;
  contact?: string | null;
};

export type ReportFieldKey =
  | "city"
  | "address"
  | "description"
  | "title"
  | "schedule"
  | "contact"
  | "needs";

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export type ReportStepDefinition = {
  key: ReportFieldKey;
  label: string;
  prompt: string;
  optional?: boolean;
  kind?: "text" | "multi_select";
  validate?: (value: string) => ValidationResult;
};

export type ReportDefinition = {
  type: ReportType;
  record_type: ReportType;
  label: string;
  steps: ReportStepDefinition[];
};

const INVALID_NAME_MESSAGE = "Escribe al menos 3 caracteres del nombre.";
const INVALID_CITY_MESSAGE = "Escribe al menos 3 caracteres de ciudad o zona.";
const INVALID_ADDRESS_MESSAGE = "Escribe al menos 3 caracteres de direccion o referencia.";
const INVALID_DESCRIPTION_MESSAGE = "Escribe al menos 5 caracteres de descripcion.";
const MAX_NAME_LENGTH = 80;
const MAX_CITY_LENGTH = 80;
const MAX_ADDRESS_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_SHORT_TEXT_LENGTH = 120;

export const REPORT_DEFINITIONS = {
  rescate_urgente: {
    type: "rescate_urgente",
    record_type: "rescate_urgente",
    label: "Se necesita rescate",
    steps: [
      {
        key: "city",
        label: "Ciudad o zona",
        prompt: "En que ciudad o zona se necesita el rescate?",
        validate: validateCity,
      },
      {
        key: "address",
        label: "Direccion o referencia",
        prompt: "Direccion o punto de referencia lo mas preciso posible.",
        validate: validateAddress,
      },
      {
        key: "description",
        label: "Situacion",
        prompt: "Describe la situacion. Personas atrapadas, heridas, riesgos o necesidades urgentes.",
        validate: validateDescription,
      },
    ],
  },
  necesidad_suministros: {
    type: "necesidad_suministros",
    record_type: "necesidad_suministros",
    label: "Se necesitan suministros",
    steps: [
      {
        key: "city",
        label: "Ciudad o zona",
        prompt: "En que ciudad o zona se necesitan suministros?",
        validate: validateCity,
      },
      {
        key: "description",
        label: "Necesidad",
        prompt: "Que se necesita? Alimentos, medicinas, agua, ropa u otros detalles.",
        validate: validateDescription,
      },
    ],
  },
  refugio_disponible: {
    type: "refugio_disponible",
    record_type: "refugio_disponible",
    label: "Ofrezco refugio",
    steps: [
      {
        key: "city",
        label: "Ciudad o zona",
        prompt: "En que ciudad o zona esta el refugio?",
        validate: validateCity,
      },
      {
        key: "address",
        label: "Direccion o referencia",
        prompt: "Direccion o punto de referencia del refugio.",
        validate: validateAddress,
      },
      {
        key: "description",
        label: "Detalles",
        prompt: "Describe que puedes ofrecer. Cupos, condiciones, servicios o restricciones.",
        validate: validateDescription,
      },
      {
        key: "contact",
        label: "Contacto",
        prompt: "Telefono o contacto. Escribe /saltar si prefieres no publicarlo.",
        optional: true,
        validate: validateShortText,
      },
    ],
  },
  dano_estructural: {
    type: "dano_estructural",
    record_type: "dano_estructural",
    label: "Daño estructural",
    steps: [
      {
        key: "city",
        label: "Ciudad o zona",
        prompt: "En que ciudad o zona esta el daño estructural?",
        validate: validateCity,
      },
      {
        key: "address",
        label: "Direccion o referencia",
        prompt: "Direccion o punto de referencia del daño.",
        validate: validateAddress,
      },
      {
        key: "description",
        label: "Descripcion",
        prompt: "Describe el daño. Tipo de estructura, grietas, colapso, riesgos visibles.",
        validate: validateDescription,
      },
    ],
  },
  centro_acopio: {
    type: "centro_acopio",
    record_type: "centro_acopio",
    label: "Centro de acopio",
    steps: [
      {
        key: "title",
        label: "Nombre o referencia",
        prompt: "Nombre o referencia del lugar?",
        validate: validateName,
      },
      {
        key: "city",
        label: "Ciudad o zona",
        prompt: "En que ciudad o zona esta el centro de acopio?",
        validate: validateCity,
      },
      {
        key: "address",
        label: "Direccion o referencia",
        prompt: "Direccion o punto de referencia.",
        validate: validateAddress,
      },
      {
        key: "needs",
        label: "Que reciben",
        prompt: "Que reciben? Puedes marcar varios.",
        kind: "multi_select",
      },
      {
        key: "schedule",
        label: "Horario",
        prompt: "Horario de recepcion? Escribe /saltar si no lo sabes.",
        optional: true,
        validate: validateShortText,
      },
      {
        key: "contact",
        label: "Contacto",
        prompt: "Telefono o contacto. Escribe /saltar si no tienes.",
        optional: true,
        validate: validateShortText,
      },
    ],
  },
} satisfies Record<ReportType, ReportDefinition>;

export const REPORT_TYPES = Object.keys(REPORT_DEFINITIONS) as ReportType[];

export function getReportDefinition(type: ReportType): ReportDefinition {
  return REPORT_DEFINITIONS[type];
}

export function isReportType(value: string): value is ReportType {
  return value in REPORT_DEFINITIONS;
}

const CHANNEL_NOTIFICATION_BY_TYPE: Record<ReportType, true> = {
  rescate_urgente: true,
  necesidad_suministros: true,
  refugio_disponible: true,
  dano_estructural: true,
  centro_acopio: true,
};

export function shouldNotifyChannel(recordType: string): boolean {
  return isReportType(recordType) && CHANNEL_NOTIFICATION_BY_TYPE[recordType];
}

function validateName(value: string): ValidationResult {
  return validateUsefulText(value, 3, MAX_NAME_LENGTH, INVALID_NAME_MESSAGE);
}

function validateCity(value: string): ValidationResult {
  return validateUsefulText(value, 3, MAX_CITY_LENGTH, INVALID_CITY_MESSAGE);
}

function validateAddress(value: string): ValidationResult {
  return validateUsefulText(value, 3, MAX_ADDRESS_LENGTH, INVALID_ADDRESS_MESSAGE);
}

function validateDescription(value: string): ValidationResult {
  return validateUsefulText(value, 5, MAX_DESCRIPTION_LENGTH, INVALID_DESCRIPTION_MESSAGE);
}

function validateShortText(value: string): ValidationResult {
  return validateMaxLength(value, MAX_SHORT_TEXT_LENGTH);
}

function validateUsefulText(
  value: string,
  minLength: number,
  maxLength: number,
  message: string
): ValidationResult {
  const trimmed = value.trim();
  const usefulCharacters = trimmed.match(/[\p{L}\p{N}]/gu)?.length ?? 0;

  if (trimmed.length < minLength || usefulCharacters < minLength) {
    return { ok: false, message };
  }

  return validateMaxLength(trimmed, maxLength);
}

function validateMaxLength(value: string, maxLength: number): ValidationResult {
  if (value.trim().length > maxLength) {
    return { ok: false, message: `Usa maximo ${maxLength} caracteres.` };
  }

  return { ok: true };
}
