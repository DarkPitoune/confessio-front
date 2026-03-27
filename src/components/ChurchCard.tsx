import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { fetchApi, getFrenchTimeString } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowSquareOutIcon,
  CircleNotchIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from "@phosphor-icons/react";

type EventOut = components["schemas"]["EventOut"];

const formatDayLabel = (dayKey: string) => {
  const date = new Date(dayKey);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const dayName = isToday
    ? "Aujourd'hui"
    : date
        .toLocaleDateString("fr-FR", { weekday: "long" })
        .replace(/^./, (c) => c.toUpperCase());
  const dateNum = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "numeric",
  });
  return { dayName, dateNum };
};

const formatTimeRange = (event: EventOut) => {
  const start = getFrenchTimeString(event.start);
  const end = event.end ? getFrenchTimeString(event.end) : null;
  return end ? `${start} - ${end}` : `${start}`;
};

const ChurchCard = ({
  church,
}: {
  church: components["schemas"]["ChurchDetails"];
}) => {
  const { data: churchDetails, isLoading } = useQuery<
    components["schemas"]["ChurchDetails"]
  >({
    queryKey: ["churchDetails", church.uuid],
    queryFn: () => fetchApi(`/church/${church.uuid}`),
    initialData: "schedules" in church ? church : undefined,
  });

  const eventsByDay = useMemo(() => {
    const events =
      churchDetails?.events
        .filter((e) => new Date(e.start) > new Date())
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        ) ?? [];
    const byDay: Record<string, EventOut[]> = {};
    for (const event of events) {
      const key = new Date(event.start).toDateString();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(event);
    }
    return byDay;
  }, [churchDetails?.events]);

  const dayKeys = useMemo(() => Object.keys(eventsByDay), [eventsByDay]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  const selectedDay = dayKeys[selectedDayIndex];
  const eventsForDay = selectedDay ? (eventsByDay?.[selectedDay] ?? []) : [];

  const voteCount = 151; // Mocked — backend doesn't support voting yet

  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex flex-col">
        <span className="flex justify-between gap-1 items-center">
          <h3
            className="text-white leading-tight"
            style={{ fontSize: 24, fontWeight: 600 }}
          >
            {church.name}
          </h3>
          <Link
            href={`/?${query}`}
            className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <XIcon size={16} weight="bold" color="white" />
          </Link>
        </span>
        <Link
          href={`https://www.google.com/maps/dir/?api=1&destination=${church.latitude},${church.longitude}`}
          target="_blank"
          className="whitespace-pre-line hover:underline"
          style={{ fontSize: 12, fontWeight: 300, color: "#cecece" }}
        >
          {[church.address, church.city].filter(Boolean).join("\n")}
        </Link>
      </div>

      {/* Separator — 1px, #d9d9d9 at 29% opacity */}
      <hr
        className="mx-0 border-0 h-px"
        style={{ backgroundColor: "rgba(217, 217, 217, 0.29)" }}
      />

      <ModalSheetScroller draggableAt="top">
        {/* Parish link — white 12px semibold + external icon */}
        <div className="px-4 py-2 flex items-center gap-2">
          <Link
            href={`https://confessio.fr/paroisse/${church.website_uuid}`}
            target="_blank"
            className="flex items-center gap-2 hover:underline"
            style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}
          >
            <span>Paroisse de {church.name}</span>
            <ArrowSquareOutIcon size={16} color="white" className="shrink-0" />
          </Link>
        </div>
        <div className="pb-5">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <CircleNotchIcon
                size={24}
                color="white"
                className="animate-spin"
              />
            </div>
          )}

          {/* Day tabs + white card */}
          {churchDetails && churchDetails.schedules.length > 0 && (
            <div className="mx-3">
              {dayKeys.length > 0 && (
                <div
                  className="flex gap-0 overflow-x-auto snap-x snap-mandatory"
                  style={{ paddingInline: "calc(50% - 40px)" }}
                >
                  {dayKeys.map((dayKey, i) => {
                    const { dayName, dateNum } = formatDayLabel(dayKey);
                    const isSelected = i === selectedDayIndex;
                    return (
                      <button
                        key={dayKey}
                        onClick={(e) => {
                          setSelectedDayIndex(i);
                          setSelectedEventIndex(0);
                          e.currentTarget.scrollIntoView({
                            behavior: "smooth",
                            inline: "center",
                            block: "nearest",
                          });
                        }}
                        className={`relative flex flex-col items-center shrink-0 snap-center px-3 pt-0.5 pb-1.5 text-[15px] font-semibold leading-snug rounded-t-lg ${isSelected ? "bg-white text-black" : "bg-transparent text-white/50"}`}
                      >
                        <span>{dayName}</span>
                        <span>{dateNum}</span>
                        {isSelected && (
                          <>
                            <span
                              className="absolute bottom-0 -left-2 w-2 h-2 pointer-events-none"
                              style={{
                                background:
                                  "radial-gradient(circle at 0 0, transparent 8px, white 8px)",
                              }}
                            />
                            <span
                              className="absolute bottom-0 -right-2 w-2 h-2 pointer-events-none"
                              style={{
                                background:
                                  "radial-gradient(circle at 100% 0, transparent 8px, white 8px)",
                              }}
                            />
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="rounded-lg bg-white overflow-hidden">
                {/* Time slots inside card */}
                {eventsForDay.length > 0 && (
                  <div
                    className="flex gap-3 py-2 overflow-x-auto snap-x snap-mandatory"
                    style={{ paddingInline: "calc(50% - 40px)" }}
                  >
                    {eventsForDay.map((event, i) => {
                      const isSelected = i === selectedEventIndex;
                      return (
                        <button
                          key={`${event.start}-${i}`}
                          onClick={() => setSelectedEventIndex(i)}
                          className={`shrink-0 snap-center rounded-full px-4 py-1.5 text-base font-semibold ${isSelected ? "bg-deepblue text-white" : "bg-gray-100 text-gray-400"}`}
                        >
                          {formatTimeRange(event)}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p
                  className="px-4 py-3 whitespace-pre-line italic text-gray-500"
                  style={{ fontSize: 13, lineHeight: 1.6 }}
                >
                  {churchDetails.schedules.map((s) => s.explanation).join("\n")}
                </p>
              </div>
            </div>
          )}

          {/* Votes — light on dark */}
          <div className="flex items-center justify-center py-4">
            <div
              className="flex items-center gap-3 px-3"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 30,
                height: 36,
              }}
            >
              <button className="flex items-center justify-center w-5 h-5">
                <ThumbsUpIcon size={20} color="white" />
              </button>
              <span
                className="tabular-nums text-white"
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                {voteCount}
              </span>
              <div
                style={{
                  width: 1,
                  height: 24,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              />
              <button className="flex items-center justify-center w-5 h-5">
                <ThumbsDownIcon size={20} color="white" />
              </button>
            </div>
          </div>

          {/* Contribution link */}
          <div className="pb-4 text-center">
            <Link
              href={`https://confessio.fr/paroisse/${church.website_uuid}`}
              target="_blank"
              className="underline text-white/70"
              style={{ fontSize: 14 }}
            >
              Compl&eacute;ter les horaires de cette paroisse (STUB/TODO)
            </Link>
          </div>

          {!isLoading &&
            churchDetails &&
            churchDetails.schedules.length === 0 &&
            dayKeys.length === 0 && (
              <p className="text-center text-gray-500 py-6 text-sm">
                Aucun horaire disponible
              </p>
            )}
        </div>
      </ModalSheetScroller>
    </>
  );
};

export { ChurchCard };
