import { components } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import { fetchApi, getFrenchTimeString } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import posthog from "posthog-js";
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
      churchDetails?.events.sort(
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

  const selectedEvent = eventsForDay[selectedEventIndex];
  const schedulesForEvent = useMemo(() => {
    if (!churchDetails || !selectedEvent) return [];
    const indices = new Set(selectedEvent.schedules_indices);
    return churchDetails.schedules.filter((_, i) => indices.has(i));
  }, [churchDetails, selectedEvent]);

  const { upvotes, downvotes, comments } = useMemo(() => {
    const reports = churchDetails?.website?.reports ?? [];
    let up = 0;
    let down = 0;
    const allComments: { comment: string; created_at: string }[] = [];
    const walk = (list: typeof reports) => {
      for (const r of list) {
        if (r.feedback_type === "good") up++;
        if (r.feedback_type === "outdated" || r.feedback_type === "error")
          down++;
        if (r.comment)
          allComments.push({ comment: r.comment, created_at: r.created_at });
        walk(r.sub_reports);
      }
    };
    walk(reports);
    return { upvotes: up, downvotes: down, comments: allComments };
  }, [churchDetails?.website?.reports]);

  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    const prev = document.title;
    document.title = `${church.name} — Confessio`;
    posthog.capture("church_viewed", {
      church_uuid: church.uuid,
      church_name: church.name,
      church_city: church.city,
    });
    return () => {
      document.title = prev;
    };
  }, [church.name, church.uuid, church.city]);

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex flex-col">
        <span className="flex justify-between gap-1 items-center">
          <h3 className="text-white leading-tight text-2xl font-semibold">
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
          className="whitespace-pre-line hover:underline text-xs font-light text-[#cecece]"
          onClick={() =>
            posthog.capture("directions_opened", {
              church_uuid: church.uuid,
              church_name: church.name,
            })
          }
        >
          {[church.address, church.city].filter(Boolean).join("\n")}
        </Link>
      </div>

      {/* Separator — 1px, #d9d9d9 at 29% opacity */}
      <hr className="mx-0 border-0 h-px bg-[#d9d9d94a]" />

      <ModalSheetScroller draggableAt="top">
        {/* Parish link — white 12px semibold + external icon */}
        {churchDetails?.website?.home_url && (
          <div className="px-4 py-2 flex items-center gap-2">
            <Link
              href={churchDetails.website.home_url}
              target="_blank"
              className="flex items-center gap-2 hover:underline text-xs font-semibold text-white"
              onClick={() =>
                posthog.capture("parish_website_clicked", {
                  church_uuid: church.uuid,
                  church_name: church.name,
                  parish_url: churchDetails.website?.home_url,
                })
              }
            >
              <span>Paroisse de {church.name}</span>
              <ArrowSquareOutIcon
                size={16}
                color="white"
                className="shrink-0"
              />
            </Link>
          </div>
        )}
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
          {churchDetails &&
            (dayKeys.length > 0 || schedulesForEvent.length > 0) && (
              <div className="mx-3">
                {dayKeys.length > 0 && (
                  <div className="flex gap-0 overflow-x-auto snap-x snap-mandatory px-[calc(50%-40px)] scrollbar-hide">
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
                              <span className="absolute bottom-0 -left-2 w-2 h-2 pointer-events-none bg-[radial-gradient(circle_at_0_0,transparent_8px,white_8px)]" />
                              <span className="absolute bottom-0 -right-2 w-2 h-2 pointer-events-none bg-[radial-gradient(circle_at_100%_0,transparent_8px,white_8px)]" />
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
                      className={`flex gap-3 py-2 ${eventsForDay.length > 2 ? "overflow-x-auto snap-x snap-mandatory px-[calc(50%-40px)]" : "justify-center"}`}
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
                  <div className="px-4 py-3 italic text-gray-500 flex flex-col gap-1 text-[13px] leading-relaxed">
                    {schedulesForEvent.map((s, i) => {
                      const sourceUrl = s.sources
                        .filter(
                          (src) =>
                            src.source_type === "parsing" && src.parsing_uuid,
                        )
                        .map((src) =>
                          churchDetails.parsings.find(
                            (p) => p.uuid === src.parsing_uuid,
                          ),
                        )
                        .find((p) => p?.scraping_url)?.scraping_url;
                      return (
                        <p key={i} className="whitespace-pre-line">
                          {s.explanation}
                          {sourceUrl && (
                            <Link
                              href={sourceUrl}
                              target="_blank"
                              className="not-italic text-gray-400 block text-right text-sm mt-1"
                            >
                              Source <span className="text-lg">↗</span>
                            </Link>
                          )}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* Votes — light on dark */}
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-3 px-3 bg-white/10 rounded-full h-9">
              <button
                className="flex items-center justify-center w-5 h-5"
                onClick={() =>
                  posthog.capture("church_upvoted", {
                    church_uuid: church.uuid,
                    church_name: church.name,
                  })
                }
              >
                <ThumbsUpIcon size={20} color="white" />
              </button>
              <span className="tabular-nums text-white text-base font-semibold">
                {upvotes}
              </span>
              <div className="w-px h-6 bg-white/20" />
              <span className="tabular-nums text-white text-base font-semibold">
                {downvotes}
              </span>
              <button
                className="flex items-center justify-center w-5 h-5"
                onClick={() =>
                  posthog.capture("church_downvoted", {
                    church_uuid: church.uuid,
                    church_name: church.name,
                  })
                }
              >
                <ThumbsDownIcon size={20} color="white" />
              </button>
            </div>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              {comments.map((c, i) => (
                <div
                  key={i}
                  className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col gap-0.5"
                >
                  <span className="text-white/40 text-[11px]">
                    {new Date(c.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <p className="text-white text-[13px] leading-normal">
                    {c.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Contribution link */}
          <div className="text-center">
            <Link
              href={`https://confessio.fr/paroisse/${churchDetails?.website?.uuid}#feedbackForm`}
              target="_blank"
              className="underline text-white/70 text-sm"
              onClick={() =>
                posthog.capture("contribution_link_clicked", {
                  church_uuid: church.uuid,
                  church_name: church.name,
                })
              }
            >
              Compl&eacute;ter les horaires de cette paroisse
            </Link>
          </div>

          {!isLoading && churchDetails && dayKeys.length === 0 && (
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
