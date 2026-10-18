import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Card, Notice, PageIntro } from "@/components/site";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Elecciones 2026" },
      {
        name: "description",
        content: "Contacta con Elecciones 29N para enviar preguntas, sugerencias o comentarios.",
      },
      { property: "og:title", content: "Contacto — Elecciones 2026" },
      {
        property: "og:description",
        content: "¿Tienes una pregunta o sugerencia sobre Elecciones 29N? Escríbenos.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Contacto,
});

function Contacto() {
  const formEmbedUrl = import.meta.env.VITE_CONTACT_GOOGLE_FORM_EMBED_URL as string | undefined;
  const privacyNoticeUrl = import.meta.env.VITE_CONTACT_PRIVACY_NOTICE_URL as string | undefined;
  const contactReady = Boolean(formEmbedUrl && privacyNoticeUrl);

  return (
    <>
      <PageIntro eyebrow="Contacto" title="Tu voz también cuenta.">
        ¿Tienes alguna pregunta, sugerencia o comentario sobre Elecciones 29N? Envíanos tu mensaje mediante el formulario de contacto.
      </PageIntro>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Card className="relative overflow-hidden bg-secondary">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-card text-accent shadow-soft">
              <MessageCircle className="size-6" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold">Cuéntanos qué necesitas</h2>
            <p className="mt-2 text-muted-foreground">
              Este espacio está pensado para preguntas, sugerencias y comentarios sobre el funcionamiento y el contenido de la web.
            </p>
            <div className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <Mail className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <p>El formulario estará disponible cuando terminemos de configurar el envío y la información de privacidad.</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <h2 className="font-semibold">Privacidad de tus datos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Antes de activar el formulario, añadiremos la información sobre el tratamiento de los datos personales y el enlace al aviso de privacidad.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Formulario de contacto</p>
          <h2 className="mt-2 text-2xl font-semibold">Contacto — Tu voto empieza aquí</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Los campos previstos son nombre, correo electrónico y mensaje.
          </p>

          {contactReady ? (
            <div className="mt-6">
              <iframe
                src={formEmbedUrl}
                title="Formulario de contacto de Elecciones 29N"
                className="w-full rounded-2xl border border-border bg-background"
                style={{ minHeight: "760px" }}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Consulta el <a className="underline decoration-accent underline-offset-4" href={privacyNoticeUrl}>aviso de privacidad</a> antes de enviar tus datos.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <Notice>
                El formulario está pendiente de configuración. No se están recogiendo datos desde esta página.
              </Notice>
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
                <Mail className="mx-auto size-8 text-accent" aria-hidden />
                <p className="mt-3 font-semibold">Estamos preparando el formulario</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lo activaremos cuando el formulario de Google y el aviso de privacidad estén listos.
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
