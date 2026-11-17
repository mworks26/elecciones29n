# Programas nuevos detectados solos, publicados con un clic

Ya existe una revisión diaria que busca programas en la web de cada partido y en Programas en Claro, y los deja en «Programas por verificar». La mejora consiste en que detecte más y mejor, y en que publicar cada uno sea un solo clic, siempre con tu confirmación.

## Qué cambia para ti
- **Aviso visible**: en el Panel editorial, la pestaña «Programas por verificar» mostrará cuántos programas nuevos hay pendientes.
- **Todo ya rellenado**: cada aviso llegará con el partido y el tipo sugeridos (Programa íntegro 2026 o Manifiesto/propuestas 2026), según el título y el enlace. Solo tendrás que abrirlo, comprobarlo y pulsar **«Publicar»**. Podrás cambiar el tipo si la sugerencia no es correcta.
- **Sin repeticiones**: no aparecerán avisos de documentos que ya estén publicados en la biblioteca.
- **Ficha del partido al día**: al publicar un programa íntegro 2026, el partido dejará de figurar como «No localizado» y se anotará la fecha de comprobación.
- **Historial**: cada publicación quedará registrada en «Historial» con tu nombre y la fecha.

## Lo que no cambia
- Nada se publica sin tu clic.
- Los documentos de 2023 y de otras elecciones (municipales, autonómicas, europeas) siguen descartándose.
- La revisión sigue a las 07:00 de Madrid (horario de invierno).

## Detalles técnicos
- `src/lib/official-crawl.ts`: añadir `suggestKind(text, url)` (íntegro vs parcial) con test en `official-crawl.test.ts`.
- `sync-programmes.ts`: antes del upsert, omitir URLs ya presentes en `programme_documents`; mantener la autenticación actual de la tarea.
- `admin.tsx` (Candidates): contador en la pestaña, tipo preseleccionado con `suggestKind`, botón único «Publicar»; al publicar `full_2026`, actualizar `parties.programme_2026_status` y `last_checked`, y escribir en `change_log`.
