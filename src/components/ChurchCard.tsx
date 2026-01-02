import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { fetchApi } from "@/utils";
import { useSearchParams } from "next/navigation";

const ChurchCard = ({
  church,
}: {
  church: components["schemas"]["ChurchDetails"];
}) => {
  const { data, isLoading } = useQuery<components["schemas"]["ChurchDetails"]>({
    queryKey: ["churchDetails", church.uuid],
    queryFn: () => fetchApi(`/church/${church.uuid}`),
  });

  // Use the server-fetched church only if it's type safe
  const churchDetails = isLoading && "schedules" in church ? church : data;

  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <>
      <div className="px-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-2xl text-white">{church.name}</h3>
          <Link
            href={`/?${query}`}
            className="rounded-full bg-white/10 p-1 shrink-0"
          >
            <Image
              src="/x-mark.svg"
              alt="Close"
              width={24}
              height={24}
              className="invert"
            />
          </Link>
        </div>
        <Link
          href={`https://www.google.com/maps/dir/?api=1&destination=${church.latitude},${church.longitude}`}
          className="text-sm text-gray-300 italic font-light leading-none"
        >
          {church.address}
          <br />
          {church.city} - {church.zipcode}
        </Link>
      </div>
      <hr className="text-gray-500 my-4" />
      <ModalSheetScroller draggableAt="top">
        <div className="px-4 pb-4 flex flex-col gap-4 items-center">
          <h4 className="text-lg font-semibold text-white">
            {churchDetails && churchDetails.schedules.length > 0
              ? "Horaires"
              : isLoading
                ? "Chargement..."
                : "Aucun horaire"}
          </h4>
          {churchDetails && churchDetails.schedules.length > 0 && (
            <article className="p-4 rounded-lg bg-white text-black w-full">
              <ul className="list-disc list-inside">
                {churchDetails.schedules.map((schedule) => (
                  <li key={schedule.explanation} className="">
                    {schedule.explanation}
                  </li>
                ))}
              </ul>
              <Link
                className="text-blue-600 visited:text-purple-800"
                href={`https://confessio.fr/paroisse/${church.website_uuid}`}
              >
                Pour en savoir plus, visitez la page de la paroisse
              </Link>
            </article>
          )}
        </div>
      </ModalSheetScroller>
    </>
  );
};

export { ChurchCard };
