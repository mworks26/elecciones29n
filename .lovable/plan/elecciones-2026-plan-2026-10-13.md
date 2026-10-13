# Elecciones 2026 — plan

App en español basada en tu plantilla `index.html` (estética y secciones) y en `elecciones_2026_seed.json` como única fuente de datos inicial. Regla central: nada se inventa; toda afirmación muestra su fuente, tipo y fecha, y donde no hay evidencia se dice "No se ha encontrado una posición verificable".

## Páginas (cada una con su propia dirección)
1. **Inicio** (`/`) — fecha 29-N, calendario (campaña 13–27 nov, BOE RD 806/2026), qué está verificado y aviso visible de que los programas 2026 aún no están publicados.
2. **Partidos** (`/partidos`, `/partidos/$id`) — las 18 formaciones de la lista de seguimiento, ordenadas por nombre, con etiquetas: "Candidatura confirmada", "Pendiente de verificación", "No localizada", y estado del programa ("Programa oficial 2026", "Manifiesto/propuestas parciales 2026", "Documento histórico 2023", "Sin localizar a fecha…").
3. **Programas** (`/programas`) — biblioteca de documentos con filtros; los de 2023 separados visualmente como contexto histórico.
4. **Comparador** (`/comparar`) — los 15 temas, partido a partido, solo con posiciones con fuente y página/sección.
5. **Juegos de afinidad** (`/juega`) — no encuestas, sino:
   - *Reparte tu presupuesto*: repartir 100 fichas entre temas (prioridades).
   - *Elige la carta*: elegir entre pares de propuestas reales anónimas (sin nombre de partido) y revelar autoría al final.
   - *Ordena prioridades*: arrastrar temas por importancia.
   Resultado: afinidad calculada solo con temas que tienen evidencia verificada, mostrando cobertura y confianza; nunca se presenta como recomendación de voto. Respuestas guardadas solo en tu navegador.
6. **Asistente** (`/asistente`) — chatbot neutral que responde solo con los datos verificados de la app, cita la fuente de cada respuesta, se niega a recomendar un partido y dice "no tengo información verificada" cuando falta. Una conversación, guardada solo en el navegador, con botón "Empezar de nuevo".
7. **Fuentes y metodología** (`/fuentes`) — registro de fuentes, fórmula de afinidad, límites e historial de cambios.
8. **Panel de administración** (`/admin`, con acceso restringido) — añadir/actualizar partidos, candidaturas, documentos y afirmaciones verificadas sin tocar código; cada cambio queda registrado. Las afirmaciones "sin revisar" nunca se publican.

## Diseño
Se respeta tu plantilla: tipografías serif + sans, paleta pastel lila/rosa/amarillo, tarjetas redondeadas, móvil primero, accesible (contraste, teclado, movimiento reducido). Colores neutros por partido (no premian ni penalizan).

## Contenido real vs. pendiente
- Hoy solo hay datos verificados de convocatoria, lista de seguimiento, enlaces a programas 2023 y propuestas parciales de Democracia21. Por tanto, el comparador y los juegos mostrarán poca cobertura hasta que cargues en el panel los programas 2026 cuando se publiquen. Así se evita inventar.

## Detalles técnicos
- Lovable Cloud: tablas `parties`, `candidacies`, `programme_documents`, `claims`, `sources`, `change_log`, `user_roles`; datos del JSON insertados en la migración; lectura pública solo de lo revisado; escritura solo rol admin. Respuestas de juegos en localStorage (nunca en servidor).
- Chat: servidor con Lovable AI (modelo por defecto), streaming, contexto = afirmaciones publicadas + fuentes; instrucción de neutralidad estricta y citas obligatorias; render con AI Elements.
- Tests: fórmula de afinidad (temas sin evidencia no suman ni restan; cobertura correcta).
- Subagentes: uno para revisar el JSON y mapear a tablas, otro para extraer estilos de la plantilla.
