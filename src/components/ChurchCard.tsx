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
      <div className="px-5 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Image
                src="/church.svg"
                alt=""
                width={20}
                height={20}
                className="invert opacity-80"
              />
            </div>
            <h3 className="font-semibold text-xl text-white leading-tight truncate">
              {church.name}
            </h3>
          </div>
          <Link
            href={`/?${query}`}
            className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Image
              src="/x-mark.svg"
              alt="Fermer"
              width={16}
              height={16}
              className="invert"
            />
          </Link>
        </div>

        <Link
          href={`https://www.google.com/maps/dir/?api=1&destination=${church.latitude},${church.longitude}`}
          className="mt-3 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors group"
        >
          <svg
            className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span>
            {church.address}, {church.city} {church.zipcode}
          </span>
        </Link>
      </div>

      <ModalSheetScroller draggableAt="top">
        <div className="px-5 pb-5 pt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Image
                src="/spinner.svg"
                alt=""
                width={24}
                height={24}
                className="invert animate-spin"
              />
            </div>
          )}

          {!isLoading &&
            churchDetails &&
            churchDetails.schedules.length === 0 && (
              <p className="text-center text-gray-500 py-6 text-sm">
                Aucun horaire disponible
              </p>
            )}

          {churchDetails && churchDetails.schedules.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">
                Horaires de confession
              </h4>
              <div className="rounded-2xl bg-white/[0.07] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]">
                {churchDetails.schedules.map((schedule) => (
                  <div
                    key={schedule.explanation}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-lightblue)] shrink-0" />
                    <span className="text-sm text-gray-200 leading-snug">
                      {schedule.explanation}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                className="mt-3 block text-center text-sm text-[var(--color-lightblue)] hover:underline"
                href={`https://confessio.fr/paroisse/${church.website_uuid}`}
              >
                Voir la page de la paroisse &rarr;
              </Link>
            </div>
          )}
        </div>
      </ModalSheetScroller>
    </>
  );
};

export { ChurchCard };
