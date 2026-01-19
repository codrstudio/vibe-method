import { ErrorCard } from "@/components/error-card";

export default function NotFound() {
  return (
    <ErrorCard
      title="Pagina nao encontrada"
      message="A pagina que voce procura nao existe ou foi movida."
    />
  );
}
