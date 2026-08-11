<!-- Este archivo se genera desde docs/PRIVACY.template.md. No editar directamente: ejecuta npm run docs:sync después de cambiar src/config.ts o esta plantilla. -->

# Política de privacidad de Faro Col

Última actualización: 11 de agosto de 2026.

Faro Col es un proyecto ciudadano independiente. No reemplaza a las autoridades ni a los organismos oficiales de emergencia. Ante una emergencia, llama al 123.

## Información que procesa Faro Col

Al usar `/reportar`, el bot procesa la información que escribes voluntariamente, como ciudad o zona, dirección, descripción de la situación, necesidades, horarios y datos de contacto. Telegram también proporciona el identificador técnico del usuario necesario para mantener la sesión y limitar abusos.

No publiques información personal que no sea necesaria para coordinar la ayuda. No incluyas datos sensibles de terceros sin su autorización.

## Publicación en Telegram

Todo reporte confirmado se publica en el canal público [@FaroColAlertas](https://t.me/FaroColAlertas). El contenido podrá ser visto, copiado o reenviado por otras personas. Faro Col no puede garantizar la eliminación de copias o reenvíos después de la publicación.

Telegram procesa y conserva los mensajes conforme a sus propias condiciones y políticas. Faro Col no mantiene una base de datos permanente propia con una copia adicional de los reportes.

## Almacenamiento temporal y prevención de abuso

- El borrador del reporte se conserva en Upstash Redis durante un máximo de 30 minutos para continuar la conversación.
- El identificador de Telegram usado para aplicar el límite de 3 reportes por hora expira en un máximo de una hora.
- Un bloqueo técnico de envío puede conservarse hasta 2 minutos para evitar publicaciones duplicadas.
- En desarrollo, si Upstash no está configurado, esos datos temporales permanecen únicamente en memoria durante la ejecución del proceso.

## Servicios y enlaces externos

Faro Col utiliza Telegram para recibir y publicar mensajes y Upstash Redis para el estado temporal descrito arriba. No consulta índices humanitarios ni envía reportes a APIs externas de datos.

Para búsqueda de personas desaparecidas, el bot muestra un enlace a [ColombiaTeBusca](https://colombiatebusca.com/), una plataforma ciudadana independiente. Faro Col no consulta automatizadamente ese sitio, no completa sus formularios y no intercambia datos con él. Cualquier información enviada directamente a esa plataforma se rige por sus propias políticas.

## Contacto y repositorio

Para preguntas de privacidad o solicitudes relacionadas con un reporte, escribe a [andesolutionsteam@gmail.com](mailto:andesolutionsteam@gmail.com). Cuando corresponda, incluye la referencia `#FCOL-XXXXX`.

- Repositorio: [https://github.com/hectorsul26/faro-col](https://github.com/hectorsul26/faro-col)
- Bot: [@FaroColombiaBot](https://t.me/FaroColombiaBot)
- Canal: [@FaroColAlertas](https://t.me/FaroColAlertas)

Creado por: Ing. Héctor Sulbarán.
