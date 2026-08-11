<!-- Este archivo se genera desde docs/PRIVACY.template.md. No editar directamente: ejecuta npm run docs:sync después de cambiar src/config.ts o esta plantilla. -->

# Política de privacidad de Faro Colombia 🇨🇴

Última actualización: 11 de agosto de 2026.

Faro Colombia 🇨🇴 es un proyecto ciudadano independiente. No reemplaza a las autoridades ni a los organismos oficiales de emergencia. Ante una emergencia, llama al 123.

## Qué datos recolectamos

Al usar `/reportar`, Faro Colombia 🇨🇴 procesa:

- `telegram_user_id`: identificador técnico que Telegram proporciona para mantener la sesión temporal, aplicar el límite de reportes y evitar publicaciones duplicadas.
- `telegram_username`: nombre de usuario público, cuando existe y Telegram lo incluye en la interacción.
- Tipo de reporte seleccionado.
- Texto de la descripción y demás datos que escribes voluntariamente, como nombre o referencia del lugar, necesidades, horario y contacto.
- Ubicación, únicamente si la compartes, como ciudad, zona, dirección o punto de referencia.
- Fecha y hora de la interacción y de la publicación del reporte.

Faro Colombia 🇨🇴 no tiene campos específicos para correo electrónico, documento de identidad ni fotografía, y no los recolecta de forma automática. Si los incluyes voluntariamente en un campo de texto, pasarán a formar parte del reporte público.

No publiques información personal que no sea necesaria para coordinar la ayuda. No incluyas datos sensibles de terceros sin su autorización.

## Publicación en Telegram

Todo reporte confirmado se publica en el canal público [{{CHANNEL_USERNAME}}]({{CHANNEL_URL}}). El contenido podrá ser visto, copiado o reenviado por otras personas. Faro Colombia 🇨🇴 no puede garantizar la eliminación de copias o reenvíos después de la publicación.

Telegram procesa y conserva los mensajes conforme a sus propias condiciones y políticas. Faro Colombia 🇨🇴 no mantiene una base de datos permanente propia con una copia adicional de los reportes.

## Almacenamiento temporal y prevención de abuso

- El borrador del reporte se conserva en Upstash Redis durante un máximo de 30 minutos para continuar la conversación.
- El identificador de Telegram usado para aplicar el límite de 3 reportes por hora expira en un máximo de una hora.
- Un bloqueo técnico de envío puede conservarse hasta 2 minutos para evitar publicaciones duplicadas.
- En desarrollo, si Upstash no está configurado, esos datos temporales permanecen únicamente en memoria durante la ejecución del proceso.

## Servicios y enlaces externos

Faro Colombia 🇨🇴 utiliza Telegram para recibir y publicar mensajes y Upstash Redis para el estado temporal descrito arriba. No consulta índices humanitarios ni envía reportes a APIs externas de datos.

Para búsqueda de personas desaparecidas, el bot muestra un enlace a [ColombiaTeBusca]({{COLOMBIA_TE_BUSCA_URL}}), una plataforma ciudadana independiente. Faro Colombia 🇨🇴 no consulta automatizadamente ese sitio, no completa sus formularios y no intercambia datos con él. Cualquier información enviada directamente a esa plataforma se rige por sus propias políticas.

## Contacto y repositorio

Para preguntas de privacidad o solicitudes relacionadas con un reporte, escribe a [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Cuando corresponda, incluye la referencia `#FCOL-XXXXX`.

- Repositorio: [{{REPO_URL}}]({{REPO_URL}})
- Bot: [{{BOT_USERNAME}}]({{BOT_URL}})
- Canal: [{{CHANNEL_USERNAME}}]({{CHANNEL_URL}})

Creado por: Ing. Héctor Sulbarán.
