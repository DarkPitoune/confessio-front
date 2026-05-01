import ModalSheetWrapper from "@/components/ModalSheet/ModalSheetWrapper";
import { fetchDioceses } from "@/utils";

export const revalidate = false;

export async function generateStaticParams() {
  const dioceses = await fetchDioceses();
  return dioceses.map((d) => ({ slug: d.slug }));
}

export default function DiocesModalPage() {
  return <ModalSheetWrapper />;
}
