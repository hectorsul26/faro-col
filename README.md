<!-- Este archivo se genera desde docs/README.template.md. No editar directamente: ejecuta npm run docs:sync después de cambiar src/config.ts o esta plantilla. -->

# Faro Colombia 🇨🇴

[Bot público](https://t.me/FaroColombiaBot) · [Canal de alertas](https://t.me/FaroColAlertas) · [Repositorio](https://github.com/hectorsul26/faro-col)

Faro Colombia 🇨🇴 es un bot ciudadano de Telegram para recibir reportes humanitarios relacionados con la emergencia sísmica en Colombia y publicarlos en el canal @FaroColAlertas para rescatistas y voluntarios.

**Faro Colombia 🇨🇴 es un proyecto ciudadano independiente. No reemplaza a las autoridades ni a los organismos oficiales de emergencia. Ante una emergencia, llama al 123.**

## Alcance

El bot tiene una única salida: todo reporte confirmado se publica en el canal público @FaroColAlertas. No consulta índices de datos, no ofrece búsquedas y no hace peticiones a APIs humanitarias externas.

Tipos de reporte:

- 🆘 `rescate_urgente` — Rescate
- 🏚 `dano_estructural` — Daño estructural
- 🍼 `necesidad_suministros` — Suministros necesarios
- 🏠 `refugio_disponible` — Refugio disponible
- 📦 `centro_acopio` — Centro de acopio

Los reportes se identifican con referencias `#FCOL-XXXXX` e incluyen el aviso: “Reporte ciudadano no verificado. No sustituye a organismos oficiales.”

Para buscar personas desaparecidas, consulta [ColombiaTeBusca](https://colombiatebusca.com/). Es una plataforma ciudadana independiente de Faro Colombia 🇨🇴. El bot solo publica el enlace: no consulta, automatiza ni intercambia datos con ese sitio.

## Comandos

- `/start` — bienvenida, alcance, seguridad y enlaces públicos
- `/reportar` — flujo guiado para crear y confirmar un reporte
- `/cancelar` — cancela un reporte en curso
- `/emergencia` — muestra las líneas oficiales de Colombia
- `/ayuda` — explica el funcionamiento y las limitaciones del bot

Antes de la primera pregunta de un rescate urgente, Faro Colombia 🇨🇴 muestra las líneas oficiales y exige confirmar que la persona ya llamó al 123. El botón “Llamar al 123 primero” cierra el flujo.

## Líneas oficiales

- **123** — Línea de emergencia
- **112** — Policía Nacional
- **132** — Cruz Roja Colombiana
- **144** — Defensa Civil
- **119** — Bomberos

## Privacidad y límites

- Los reportes confirmados se publican en un canal público de Telegram.
- Upstash Redis guarda el borrador durante un máximo de 30 minutos.
- El identificador técnico usado para limitar abusos expira en un máximo de una hora.
- El límite es de 3 reportes publicados por usuario en una ventana de una hora.
- Faro Colombia 🇨🇴 no mantiene una base de datos permanente propia de reportes.

Consulta la [política de privacidad](https://github.com/hectorsul26/faro-col/blob/main/PRIVACY.md) antes de publicar datos personales o de contacto.

## Desarrollo

Stack: Node.js, TypeScript, grammY, Upstash Redis y Vercel Functions.

```bash
npm install
npm run typecheck
npm run dev
```

En desarrollo local se usa long polling. Si el bot tiene un webhook de producción activo, desactívalo temporalmente antes de iniciar `npm run dev`.

### Variables de entorno

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ALERTS_CHANNEL_ID=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Upstash es obligatorio en producción. Sin sus credenciales, el bot solo usa memoria local durante el desarrollo. `TELEGRAM_ALERTS_CHANNEL_ID` debe corresponder al canal @FaroColAlertas y el bot debe tener permiso para publicar.

## Documentación generada

`src/config.ts` es la única fuente de verdad para contacto y URLs públicas. Este README y `PRIVACY.md` se generan desde sus plantillas:

```bash
npm run docs:sync
npm run docs:check
```

No edites directamente los archivos generados. Cambia `src/config.ts` o la plantilla correspondiente, ejecuta `npm run docs:sync` y confirma que `npm run docs:check` pase.

## Producción

- URL base: https://faro-col.vercel.app
- Webhook: https://faro-col.vercel.app/api/webhook

Registro del webhook:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://faro-col.vercel.app/api/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

## Créditos y contacto

- **Creado por:** Ing. Héctor Sulbarán
- **Bot:** [@FaroColombiaBot](https://t.me/FaroColombiaBot)
- **Canal:** [@FaroColAlertas](https://t.me/FaroColAlertas)
- **Contacto:** [andesolutionsteam@gmail.com](mailto:andesolutionsteam@gmail.com)
- **Repositorio:** [https://github.com/hectorsul26/faro-col](https://github.com/hectorsul26/faro-col)
- **Licencia:** MIT
