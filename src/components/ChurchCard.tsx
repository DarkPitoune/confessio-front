import { clearSelectedChurchAtom } from "@/store/atoms";
import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import Image from "next/image";
import Link from "next/link";

const ChurchCard = ({
  church,
}: {
  church: components["schemas"]["SearchResult"]["churches"][number];
}) => {
  const { data: churchDetails } = useQuery<
    components["schemas"]["ChurchDetails"]
  >({
    queryKey: ["churchDetails", church.uuid],
    queryFn: () =>
      fetch(`https://confessio.fr/front/api/church/${church.uuid}`).then(
        (res) => res.json(),
      ),
  });

  const [, clearSelectedChurch] = useAtom(clearSelectedChurchAtom);

  return churchDetails ? (
    <>
      <div className="px-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-2xl text-white">
            {churchDetails.name}
          </h3>
          <button
            onClick={() => clearSelectedChurch()}
            className="rounded-full bg-white/10 p-1 shrink-0"
          >
            <Image
              src="/x-mark.svg"
              alt="Close"
              width={24}
              height={24}
              className="invert"
            />
          </button>
        </div>
        <Link
          href={`https://www.google.com/maps/dir/?api=1&destination=${churchDetails.latitude},${churchDetails.longitude}`}
          className="text-sm text-gray-300 italic font-light leading-none"
        >
          {churchDetails.address}
          <br />
          {churchDetails.city} - {churchDetails.zipcode}
        </Link>
      </div>
      <hr className="text-gray-500 my-4" />
      <div className="px-4 flex flex-col gap-4 items-center">
        <h4 className="text-lg font-semibold text-white">
          {churchDetails.schedules.length > 0 ? "Horaires" : "Aucun horaire"}
        </h4>
        {churchDetails.schedules.length > 0 && (
          <article className="p-4 rounded-lg bg-white text-black w-full">
            <ul className="list-disc list-inside">
              {churchDetails.schedules.map((schedule) => (
                <li key={schedule.explanation} className="">
                  {schedule.explanation}
                </li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </>
  ) : (
    <div>Chargement...</div>
  );
};

export { ChurchCard };
