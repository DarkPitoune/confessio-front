import { fetchDioceseBySlug, dioceseToBounds } from "@/utils";
import { HomePage } from "../../default";

export default async function DioceseMapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const diocese = await fetchDioceseBySlug(slug);
  const bounds = diocese ? dioceseToBounds(diocese) : null;

  return <HomePage serverBounds={bounds} />;
}
