import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Card, PageIntro, Notice } from "@/components/site";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Privacidad — Mworks · Elecciones 29N" },
      {
        name: "description",
        content: "Información sobre el uso de los datos enviados mediante el formulario de contacto de Elecciones 29N.",
      },
    ],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <>
      <PageIntro eyebrow="Privacidad · Mworks" title="Tus datos, con claridad.">
        Información sobre los datos que envías mediante el formulario de contacto de Elecciones 29N.
      </PageIntro>

      <section className="mx-auto max-w-3xl space-y-5 px-4 pb-16">
        <Notice>
          Mworks es el nombre público del proyecto educativo Elecciones 29N. Antes de activar la recogida de datos, debe verificarse que la identificación del responsable y el resto de la información legal sean suficientes para la normativa aplicable.
        </Notice>

        <Card>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold">¿Qué datos se solicitan?</h2>
              <p className="mt-2 text-muted-foreground">
                El formulario solicita nombre, correo electrónico y mensaje. No incluyas contraseñas, datos bancarios ni información especialmente sensible. El proyecto no necesita conocer tus opiniones políticas para atender una consulta.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">¿Para qué se usan?</h2>
          <p className="mt-2 text-muted-foreground">
            Para leer y responder preguntas, sugerencias y comentarios relacionados con la web Elecciones 29N, y para gestionar solicitudes relacionadas con la privacidad.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">¿Quién procesa la información?</h2>
          <p className="mt-2 text-muted-foreground">
            El formulario funciona mediante Google Forms. La información enviada se almacena en el servicio y en la cuenta que administra el formulario, conforme a las condiciones y políticas de Google. Consulta la política de privacidad de Google para conocer cómo trata los datos en sus servicios.
          </p>
          <a
            className="mt-3 inline-block underline decoration-accent underline-offset-4"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer noopener"
          >
            Política de privacidad de Google
          </a>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Conservación</h2>
          <p className="mt-2 text-muted-foreground">
            La propuesta de conservación es mantener los mensajes durante el tiempo necesario para atender la consulta y eliminarlos, como norma general, dentro de los 12 meses siguientes al cierre. Podrán conservarse durante más tiempo cuando exista una obligación legal que lo requiera. Esta pauta debe aplicarse también a las respuestas guardadas en Google Forms.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Tus derechos y solicitudes</h2>
          <p className="mt-2 text-muted-foreground">
            Puedes enviar una solicitud relacionada con tus datos a través del formulario de contacto de la web, indicando que se trata de una solicitud de privacidad. Para tramitarla, podría ser necesario comprobar tu identidad de forma proporcionada.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Cambios en este aviso</h2>
          <p className="mt-2 text-muted-foreground">
            Este texto es una versión inicial para el proyecto educativo. Se actualizará si cambia el formulario, el uso de los datos o la información legal necesaria.
          </p>
        </Card>
      </section>
    </>
  );
}
