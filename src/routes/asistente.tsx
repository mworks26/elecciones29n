import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/asistente")({
  beforeLoad: () => {
    throw redirect({ to: "/buscar", statusCode: 301 });
  },
});
