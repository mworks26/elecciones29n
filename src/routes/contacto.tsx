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
  const formEmbedUrl = "https://docs.google.com/forms/d/e/1FAIpQLSe44CcVju99qxR4-3-9OC-XroIURpoXm_KaTqD02IIKZQAwOA/viewform?embedded=true";
  const privacyNoticeUrl = "/privacidad";
  const contactReady = true;

  return (
    <>
      <PageIntro eyebrow="Contacto" title="Tu voz también cuenta.">
        ¿Tienes alguna pregunta, sugerencia o comentario sobre Elecciones 29N? Envíanos tu mensaje mediante el formulario de contacto.
      </PageIntro>

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 px-4 pb-16 sm:gap-5 lg:grid-cols-[0.65fr_1.65fr] lg:gap-6">
        <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:space-y-5">
          <Card className="relative overflow-hidden bg-secondary">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-card text-accent shadow-soft">
              <MessageCircle className="size-6" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold sm:text-2xl">Cuéntanos qué necesitas</h2>
            <p className="mt-2 text-muted-foreground">
              Este espacio está pensado para preguntas, sugerencias y comentarios sobre el funcionamiento y el contenido de la web.
            </p>
            <div className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <Mail className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <p>El formulario utiliza Google Forms. Antes de enviar tus datos, consulta el aviso de privacidad.</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <h2 className="font-semibold">Privacidad de tus datos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mworks es el nombre público de este proyecto educativo. Consulta cómo se gestionan los datos en el aviso de privacidad.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="order-1 min-w-0 lg:order-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Formulario de contacto</p>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Contacto — Tu voto empieza aquí</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El formulario solicita nombre, correo electrónico y mensaje.
          </p>

          {contactReady ? (
            <div className="mt-6">
              <iframe
                src={formEmbedUrl}
                title="Formulario de contacto de Elecciones 29N"
                className="block w-full max-w-full rounded-xl border border-border bg-background"
                style={{ height: "1600px", minHeight: "1600px" }}
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
                El formulario se abre dentro de esta página mediante Google Forms. Consulta el aviso de privacidad antes de enviarlo.
              </Notice>
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
                <Mail className="mx-auto size-8 text-accent" aria-hidden />
                <p className="mt-3 font-semibold">Formulario de contacto</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Antes de enviar tus datos, lee el aviso de privacidad.
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
