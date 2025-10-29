import { setSelectedChurchAtom } from "@/store/atoms";
import { AggregatedSearchResults } from "@/utils";
import { useSetAtom } from "jotai";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const formatted = date
    .toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
    })
    .replace(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

const ChurchTile = ({
  church,
}: {
  church: AggregatedSearchResults["churches"][number];
}) => {
  const setSelectedChurch = useSetAtom(setSelectedChurchAtom);
  return (
    <div
      onClick={() => setSelectedChurch(church)}
      key={church.uuid}
      className="w-full bg-white rounded-2xl p-3"
    >
      <h3 className="font-medium text-gray-900 text-lg">{church.name}</h3>
      <p className="text-sm text-gray-500 italic">{church.address}</p>
      <div className="p-2.5 flex gap-2.5 overflow-x-auto">
        {Object.entries(church.website?.eventsByDay || []).map(
          ([day, [event]]) =>
            event ? (
              <div key={day} className="flex flex-col gap-1 items-stretch">
                <span className="text-gray-400 whitespace-nowrap w-16 text-center">
                  {formatDate(event.start)}
                </span>
                <div className="px-1 flex flex-col rounded py-0.5 bg-blue-100 items-center">
                  <span className="text-black text-sm">
                    {formatTime(event.start)}
                  </span>
                  <span className="text-black text-sm">
                    {event.end ? formatTime(event.end) : "?"}
                  </span>
                </div>
              </div>
            ) : null,
        )}
      </div>
    </div>
  );
};
export default ChurchTile;
