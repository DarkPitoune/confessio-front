import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { fetchApi, getFrenchTimeString } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type EventOut = components["schemas"]["EventOut"];

/** Fetch upcoming events for a specific church via the search API */
const useChurchEvents = (church: components["schemas"]["ChurchDetails"]) => {
  return useQuery<Record<string, EventOut[]>>({
    queryKey: ["churchEvents", church.uuid],
    queryFn: async () => {
      const delta = 0.01;
      const params = new URLSearchParams({
        min_lat: (church.latitude - delta).toString(),
        min_lng: (church.longitude - delta).toString(),
        max_lat: (church.latitude + delta).toString(),
        max_lng: (church.longitude + delta).toString(),
      });
      const result: components["schemas"]["SearchResult"] = await fetchApi(
        `/search?${params.toString()}`,
      );
      const website = result.websites.find(
        (w) => w.uuid === church.website_uuid,
      );
      const events =
        website?.events
          .filter((e) => e.church_uuid === church.uuid)
          .filter((e) => new Date(e.start) > new Date())
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime(),
          ) ?? [];

      const byDay: Record<string, EventOut[]> = {};
      for (const event of events) {
        const key = new Date(event.start).toDateString();
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(event);
      }
      return byDay;
    },
  });
};

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

  const { data: eventsByDay } = useChurchEvents(church);

  const dayKeys = useMemo(
    () => (eventsByDay ? Object.keys(eventsByDay) : []),
    [eventsByDay],
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [showAllInfo, setShowAllInfo] = useState(false);

  const selectedDay = dayKeys[selectedDayIndex];
  const eventsForDay = selectedDay ? (eventsByDay?.[selectedDay] ?? []) : [];

  const voteCount = 151; // Mocked — backend doesn't support voting yet

  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <>
      {/* Close button — floating top-right */}
      <Link
        href={`/?${query}`}
        className="absolute top-3 right-3 shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
      >
        <Image
          src="/x-mark.svg"
          alt="Fermer"
          width={16}
          height={16}
          className="invert"
        />
      </Link>

      {/* Church name + address — dark bg, px-4 matches design's 16px padding */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
        <h3
          className="text-white leading-tight"
          style={{ fontSize: 24, fontWeight: 600 }}
        >
          {church.name}
        </h3>
        <p
          className="whitespace-pre-line"
          style={{ fontSize: 12, fontWeight: 300, color: "#cecece" }}
        >
          {[church.address, church.city].filter(Boolean).join("\n")}
        </p>
      </div>

      {/* Separator — 1px, #d9d9d9 at 29% opacity */}
      <hr
        className="mx-0 border-0 h-px"
        style={{ backgroundColor: "rgba(217, 217, 217, 0.29)" }}
      />

      {/* Parish link — white 12px semibold + external icon */}
      <div className="px-2 py-2 flex items-center gap-2">
        <Link
          href={`https://confessio.fr/paroisse/${church.website_uuid}`}
          target="_blank"
          className="flex items-center gap-2 hover:underline"
          style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}
        >
          <span>Paroisse de {church.name}</span>
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="white">
            <path d="M5 1h-.5A2.5 2.5 0 0 0 2 3.5v9A2.5 2.5 0 0 0 4.5 15h9a2.5 2.5 0 0 0 2.5-2.5V11a.5.5 0 0 0-1 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 12.5v-9A1.5 1.5 0 0 1 4.5 2H6a.5.5 0 0 0 0-1H5ZM9 1a.5.5 0 0 0 0 1h4.793L7.146 8.646a.5.5 0 1 0 .708.708L14.5 2.707V7.5a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5H9Z" />
          </svg>
        </Link>
      </div>

      <ModalSheetScroller draggableAt="top">
        <div className="pb-5">
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

          {/* White content card — bg-white, rounded-lg, 8px margin from edges */}
          <div className="mx-2 rounded-lg bg-white overflow-hidden">
            {/* Day selector — horizontal scroll row */}
            {dayKeys.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-2 pt-2 pb-1">
                {dayKeys.map((dayKey, i) => {
                  const { dayName, dateNum } = formatDayLabel(dayKey);
                  const isSelected = i === selectedDayIndex;
                  return (
                    <button
                      key={dayKey}
                      onClick={() => {
                        setSelectedDayIndex(i);
                        setSelectedEventIndex(0);
                      }}
                      className="flex flex-col items-center shrink-0 rounded-md transition-colors"
                      style={{
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        ...(isSelected
                          ? {
                              backgroundColor: "#ffffff",
                              color: "#000000",
                              border: "1px solid #242e4c",
                            }
                          : {
                              backgroundColor: "transparent",
                              color: "#ffffff",
                              border: "2px solid #242e4c",
                              opacity: 0.5,
                            }),
                      }}
                    >
                      <span>{dayName}</span>
                      <span>{dateNum}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Time slot selector */}
            {eventsForDay.length > 0 && (
              <div className="flex gap-3 px-3 py-2">
                {eventsForDay.map((event, i) => {
                  const isSelected = i === selectedEventIndex;
                  return (
                    <button
                      key={`${event.start}-${i}`}
                      onClick={() => setSelectedEventIndex(i)}
                      className="rounded-md transition-colors"
                      style={{
                        padding: "4px 12px",
                        fontWeight: 600,
                        ...(isSelected
                          ? {
                              fontSize: 14,
                              color: "#000000",
                              border: "1px solid #242e4c",
                            }
                          : {
                              fontSize: 12,
                              color: "#000000",
                              opacity: 0.5,
                            }),
                      }}
                    >
                      {formatTimeRange(event)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Schedule explanation — text block in a subtle inner card */}
            {churchDetails && churchDetails.schedules.length > 0 && (
              <div className="px-3 py-2">
                <div className="rounded-md" style={{ border: "1px solid #f3f4f6" }}>
                  <p
                    className={`px-2 py-1 whitespace-pre-line ${!showAllInfo ? "line-clamp-6" : ""}`}
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: "#000000",
                      lineHeight: 1.6,
                    }}
                  >
                    {churchDetails.schedules
                      .map((s) => s.explanation)
                      .join("\n")}
                  </p>
                  <button
                    onClick={() => setShowAllInfo(!showAllInfo)}
                    className="w-full py-1.5 transition-colors"
                    style={{
                      fontSize: 10,
                      color: "rgba(0,0,0,0.52)",
                    }}
                  >
                    {showAllInfo
                      ? "Masquer les informations"
                      : "Afficher toutes les informations"}
                  </button>
                </div>
              </div>
            )}

            {/* Votes — gray pill with thumbs-down | count | thumbs-up */}
            <div className="flex items-center justify-center py-3">
              <div
                className="flex items-center gap-3 px-2"
                style={{
                  backgroundColor: "#e5e7eb",
                  borderRadius: 30,
                  height: 36,
                }}
              >
                <button className="flex items-center justify-center w-5 h-5">
                  <svg className="w-5 h-5" viewBox="0 0 20 18" fill="black">
                    <path d="M12.8 17.1H6.2c-.5 0-1-.2-1.4-.5L1 13.1c-.6-.5-1-1.2-1-2V7.5c0-1 .5-1.9 1.3-2.4L6.9.9C7.3.3 8 0 8.7 0c1.3 0 2.3 1 2.3 2.3v3.2h4.3c1.4 0 2.7.9 3.1 2.2l1 3.5c.5 1.8-.5 3.7-2.3 4.2-.4.1-.7.2-1.1.2h-3.2ZM3.5 7.5v3.6c0 .3.1.5.3.7l3.8 3.5c.1.1.3.2.5.2h4.7c.6 0 1.2-.3 1.5-.8.3-.5.3-1.1.1-1.6l-1-3.5c-.2-.5-.6-.8-1.1-.8H8.5c-.7 0-1.2-.5-1.2-1.2V4.2c0-.5-.2-.9-.5-1.2L3.5 7.5Z" />
                  </svg>
                </button>
                <div
                  style={{
                    width: 1,
                    height: 24,
                    backgroundColor: "#d1d5db",
                  }}
                />
                <span
                  className="tabular-nums"
                  style={{ fontSize: 16, fontWeight: 600, color: "#000000" }}
                >
                  {voteCount}
                </span>
                <div
                  style={{
                    width: 1,
                    height: 24,
                    backgroundColor: "#d1d5db",
                  }}
                />
                <button className="flex items-center justify-center w-5 h-5">
                  <svg className="w-5 h-5" viewBox="0 0 20 18" fill="black">
                    <path d="M7.2.9h6.6c.5 0 1 .2 1.4.5L19 4.9c.6.5 1 1.2 1 2v3.6c0 1-.5 1.9-1.3 2.4l-5.6 4.2c-.4.6-1.1.9-1.8.9-1.3 0-2.3-1-2.3-2.3v-3.2H4.7c-1.4 0-2.7-.9-3.1-2.2l-1-3.5C.1 5 1.1 3.1 2.9 2.6c.4-.1.7-.2 1.1-.2h3.2Zm9.3 6.6V3.9c0-.3-.1-.5-.3-.7L12.4 0c-.1-.1-.3-.2-.5-.2H7.2c-.6 0-1.2.3-1.5.8-.3.5-.3 1.1-.1 1.6l1 3.5c.2.5.6.8 1.1.8h3.8c.7 0 1.2.5 1.2 1.2v3.4c0 .5.2.9.5 1.2l3.3-4.5Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contribution link */}
            <div className="pb-4 text-center">
              <Link
                href={`https://confessio.fr/paroisse/${church.website_uuid}`}
                target="_blank"
                className="underline"
                style={{ fontSize: 14, fontWeight: 400, color: "#000000" }}
              >
                Compl&eacute;ter les horaires de cette paroisse
              </Link>
            </div>
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
