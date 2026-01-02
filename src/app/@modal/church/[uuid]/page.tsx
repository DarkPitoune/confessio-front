import ModalSheet from "@/components/ModalSheet";
import { components } from "@/types";
import { fetchApi } from "@/utils";

export default async function ChurchModal({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const originalSelectedChurch: components["schemas"]["ChurchDetails"] =
    await fetchApi(`/church/${uuid}`);
  return (
    <ModalSheet
      originalSelectedChurch={originalSelectedChurch}
    />
  );
}
