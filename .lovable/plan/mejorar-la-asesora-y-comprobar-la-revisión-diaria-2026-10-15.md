# Mejorar la asesora y comprobar la revisión diaria

## 1. Nueva asesora de campaña
- Sustituir el dibujo actual por un **personaje femenino cartoon**, sonriente y más cuidado, acorde con los tonos pastel de la página.
- Dibujar bien el rostro, los brazos y las manos: ambas manos sujetarán una **papeleta blanca rectangular**, claramente reconocible como voto, sin moneda ni símbolos de partidos.
- Mantener el fondo transparente y comprobar que se distingue bien junto a los mensajes de ayuda, tanto al empezar como durante el simulador.
- No cambiar las preguntas, respuestas ni el cálculo de afinidad.

## 2. Comprobar la tarea diaria
### Lo comprobado
- Existe una tarea activa llamada `sync-programmes-daily`, programada a las **06:00 UTC cada día**: actualmente son las 08:00 de Madrid; con el horario de invierno serán las 07:00.
- El código consulta Programas en Claro y registra novedades para revisión editorial; no publica documentos automáticamente.
- Hay **15 avisos pendientes**, cuya última detección registrada fue el 14 de octubre. Esta fecha no demuestra un fallo: una comprobación sin novedades no añade avisos.
- La fuente consultada responde, pero sus documentos se presentan como referencias de 2023 para el seguimiento de 2026. No basta para asegurar que recoge todos los nuevos programas y manifiestos de 2026.
- No se ha podido consultar el historial de ejecuciones con las herramientas disponibles; todavía **no está verificado que la ejecución diaria termine correctamente**.

### Verificación y ajustes
- Comprobar la entrega de la llamada diaria y su respuesta real, no solo que la tarea esté activa. Si hace falta, usar el historial de **Cloud → Jobs** para confirmar el resultado.
- Revisar que los programas íntegros, manifiestos y propuestas parciales de 2026 presentes en la fuente se detecten con su enlace, sin confundirse con documentos históricos.
- Comprobar que una segunda revisión de los mismos documentos no duplica avisos y que ninguna novedad se publica sin tu confirmación.
- Corregir los fallos demostrados que permitan las herramientas, y ajustar el texto del panel para reflejar el horario real y los límites de la fuente. Si faltan fuentes de 2026, identificar los canales oficiales necesarios antes de prometer cobertura completa.

## Detalles técnicos y límites
- Crear una ilustración optimizada y reutilizarla en `AdvisorMascot`; comprobar visualmente su integración y la legibilidad de la papeleta.
- La tarea aparece sin los metadatos de una programación gestionada moderna. **No sustituir su autenticación ni recrearla a ciegas**, porque podría dejar de funcionar. La migración automática de esa tarea no está disponible.
- El receptor actual solo comprueba que haya un token, no su autenticidad. Cualquier refuerzo requerirá un mecanismo compatible y verificado con la tarea existente; nunca rebajar la seguridad ni permitir publicación automática.
- Probar detección, ausencia de duplicados y separación entre avisos y contenido público. Si no puede verificarse una ejecución real, informar expresamente de ese límite y del paso pendiente.

## Resultado
Una asesora más atractiva con el voto entre las manos, y un diagnóstico comprobado de la revisión diaria, distinguiendo lo que funciona de lo que requiere intervención.