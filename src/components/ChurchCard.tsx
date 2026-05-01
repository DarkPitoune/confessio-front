import { components } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import ModalSheetScroller from "./ModalSheet/ModalSheetScroller";
import ModalSheetDragZone from "./ModalSheet/ModalSheetDragZone";
import { fetchApi, getFrenchTimeString } from "@/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import {
  ArrowSquareOutIcon,
  CircleNotchIcon,
  NavigationArrowIcon,
  PaperPlaneTiltIcon,
  SealCheckIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from "@phosphor-icons/react";

type ChurchDetails = components["schemas"]["ChurchDetails"];
type ChurchOut = components["schemas"]["ChurchOut"];
type ChurchCacheEntry = ChurchDetails | ChurchOut;
type EventOut = components["schemas"]["EventOut"];
type FeedbackType = components["schemas"]["FeedbackTypeEnum"];
type ErrorType = components["schemas"]["ErrorTypeEnum"];
type CommentNode = {
  comment: string;
  created_at: string;
  feedback_type: FeedbackType;
  children: CommentNode[];
};

const isFullDetails = (
  entry: ChurchCacheEntry | undefined,
): entry is ChurchDetails =>
  !!entry && "schedules" in entry && "website" in entry && "parsings" in entry;

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  outdated: "Plus à jour",
  schedules: "Horaires incorrects",
  churches: "Mauvaise église",
  paragraphs: "Texte incorrect",
};

const CommentEntry = ({ node }: { node: CommentNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="tabular text-deepblue/50 text-[11px] font-medium">
      {new Date(node.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </span>
    <p className="text-ink text-[13px] leading-normal">{node.comment}</p>
    {node.children.length > 0 && (
      <div className="mt-3 pl-4 border-l border-ink/15 flex flex-col gap-2">
        {node.children.map((child, i) => (
          <CommentEntry key={i} node={child} />
        ))}
      </div>
    )}
  </div>
);

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
  uuid,
  initialData,
}: {
  uuid: string;
  initialData?: ChurchDetails;
}) => {
  const queryClient = useQueryClient();

  // When the server hands us full ChurchDetails (cold load or RSC payload
  // arriving after a soft-nav loading state), write it into the cache *during
  // render* so it overrides any partial seed left by a marker click. useQuery's
  // `initialData` only applies when the cache is empty — without this, a stale
  // seed would shadow the fresh server data until the next refetch.
  const seededUuidRef = useRef<string | null>(null);
  if (initialData && seededUuidRef.current !== uuid) {
    seededUuidRef.current = uuid;
    queryClient.setQueryData(["churchDetails", uuid], initialData);
  }

  const { data: churchDetails, isFetching } = useQuery<ChurchCacheEntry>({
    queryKey: ["churchDetails", uuid],
    queryFn: () => fetchApi(`/church/${uuid}`),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });

  const fullDetails = isFullDetails(churchDetails) ? churchDetails : null;

  const eventsByDay = useMemo(() => {
    const events =
      churchDetails?.events.slice().sort(
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

  const selectedDay = dayKeys[selectedDayIndex];
  const eventsForDay = selectedDay ? (eventsByDay?.[selectedDay] ?? []) : [];

  const getSchedulesForEvent = (event: EventOut) => {
    if (!fullDetails) return [];
    const indices = new Set(event.schedules_indices);
    return fullDetails.schedules.filter((_, i) => indices.has(i));
  };

  const { upvotes, downvotes, comments } = useMemo(() => {
    const reports = fullDetails?.website?.reports ?? [];
    let up = 0;
    let down = 0;
    const countVotes = (list: typeof reports) => {
      for (const r of list) {
        if (r.feedback_type === "good") up++;
        if (r.feedback_type === "error") down++;
        countVotes(r.sub_reports);
      }
    };
    countVotes(reports);

    const buildComments = (list: typeof reports): CommentNode[] => {
      const result: CommentNode[] = [];
      for (const r of list) {
        const children = buildComments(r.sub_reports);
        if (r.comment) {
          result.push({
            comment: r.comment,
            created_at: r.created_at,
            feedback_type: r.feedback_type,
            children,
          });
        } else {
          result.push(...children);
        }
      }
      return result;
    };
    return {
      upvotes: up,
      downvotes: down,
      comments: buildComments(reports),
    };
  }, [fullDetails?.website?.reports]);

  const [feedbackOpen, setFeedbackOpen] = useState<"good" | "error" | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const postReport = useMutation({
    mutationFn: async (payload: components["schemas"]["ReportIn"]) =>
      fetchApi("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["churchDetails", uuid],
      });
      setFeedbackOpen(null);
      setFeedbackText("");
      setErrorType(null);
    },
  });

  useEffect(() => {
    if (feedbackOpen) textareaRef.current?.focus();
  }, [feedbackOpen]);

  const handleFeedbackClick = (type: "good" | "error") => {
    if (!churchDetails) return;
    posthog.capture(
      type === "good" ? "church_upvoted" : "church_downvoted",
      { church_uuid: uuid, church_name: churchDetails.name },
    );
    setFeedbackOpen((current) => (current === type ? null : type));
    setFeedbackText("");
    setErrorType(null);
  };

  const handleSubmitFeedback = () => {
    if (!fullDetails?.website?.uuid || !feedbackOpen) return;
    postReport.mutate({
      website_uuid: fullDetails.website.uuid,
      feedback_type: feedbackOpen,
      error_type: feedbackOpen === "error" ? errorType : null,
      comment: feedbackText.trim() || null,
    });
  };

  const canReport = Boolean(fullDetails?.website?.uuid);

  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const closeHref = query ? `/?${query}` : "/";

  const trackedUuidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!churchDetails || trackedUuidRef.current === churchDetails.uuid) return;
    trackedUuidRef.current = churchDetails.uuid;
    const prev = document.title;
    document.title = `${churchDetails.name} — Confessio`;
    posthog.capture("church_viewed", {
      church_uuid: churchDetails.uuid,
      church_name: churchDetails.name,
      church_city: churchDetails.city,
    });
    return () => {
      document.title = prev;
    };
  }, [churchDetails]);

  // Cold direct-URL visit, no seed, no SSR hydration: render only X + spinner.
  if (!churchDetails) {
    return (
      <>
        <ModalSheetDragZone>
          <div className="px-5 pt-4 pb-3 flex items-start justify-end">
            <Link
              href={closeHref}
              aria-label="Fermer"
              className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <XIcon size={16} weight="bold" color="white" />
            </Link>
          </div>
          <hr className="mx-0 border-0 h-px bg-white/12" />
        </ModalSheetDragZone>
        <ModalSheetScroller draggableAt="top">
          <div className="flex items-center justify-center py-12">
            <CircleNotchIcon
              size={28}
              color="white"
              className="animate-spin"
            />
          </div>
        </ModalSheetScroller>
      </>
    );
  }

  const showSchedulesSpinner = !fullDetails && isFetching;

  return (
    <>
      <ModalSheetDragZone>
        <div className="px-5 pt-4 pb-3 flex flex-col gap-1.5">
          <span className="flex justify-between gap-2 items-start">
            <h3 className="text-white leading-[1.15] text-[22px] font-semibold tracking-[-0.01em]">
              {churchDetails.name}
            </h3>
            <Link
              href={closeHref}
              aria-label="Fermer"
              className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <XIcon size={16} weight="bold" color="white" />
            </Link>
          </span>
          <Link
            href={`https://www.google.com/maps/dir/?api=1&destination=${churchDetails.latitude},${churchDetails.longitude}`}
            target="_blank"
            className="group inline-flex items-start gap-1.5 self-start text-[13px] leading-snug text-white/70 hover:text-white transition-colors"
            onClick={() =>
              posthog.capture("directions_opened", {
                church_uuid: uuid,
                church_name: churchDetails.name,
              })
            }
          >
            <NavigationArrowIcon
              size={14}
              weight="fill"
              className="mt-[3px] shrink-0 text-white/55 group-hover:text-white transition-colors"
            />
            <span className="whitespace-pre-line">
              {[churchDetails.address, churchDetails.city]
                .filter(Boolean)
                .join("\n")}
            </span>
          </Link>
        </div>

        <hr className="mx-0 border-0 h-px bg-white/12" />
      </ModalSheetDragZone>

      <ModalSheetScroller draggableAt="top">
        {fullDetails?.website?.home_url && (
          <div className="px-5 pt-3 pb-1 flex">
            <Link
              href={fullDetails.website.home_url}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/75 hover:text-white transition-colors"
              onClick={() =>
                posthog.capture("parish_website_clicked", {
                  church_uuid: uuid,
                  church_name: churchDetails.name,
                  parish_url: fullDetails.website?.home_url,
                })
              }
            >
              <span>Paroisse de {churchDetails.name}</span>
              <ArrowSquareOutIcon
                size={13}
                weight="bold"
                className="shrink-0"
              />
            </Link>
          </div>
        )}
        <div className="pb-6 pt-2">
          {showSchedulesSpinner && (
            <div className="flex items-center justify-center py-8">
              <CircleNotchIcon
                size={24}
                color="white"
                className="animate-spin"
              />
            </div>
          )}

          {fullDetails && dayKeys.length > 0 && (
            <div className="mx-3">
              <div className="flex gap-0 overflow-x-auto snap-x snap-mandatory px-[calc(50%-40px)] scrollbar-hide">
                {dayKeys.map((dayKey, i) => {
                  const { dayName, dateNum } = formatDayLabel(dayKey);
                  const isSelected = i === selectedDayIndex;
                  return (
                    <button
                      key={dayKey}
                      onClick={(e) => {
                        setSelectedDayIndex(i);
                        e.currentTarget.scrollIntoView({
                          behavior: "smooth",
                          inline: "center",
                          block: "nearest",
                        });
                      }}
                      className={[
                        "day-tab relative flex flex-col items-center shrink-0 snap-center px-3 pt-1 pb-2 text-[14px] font-semibold leading-tight rounded-t-xl transition-colors",
                        isSelected
                          ? "day-tab-selected bg-paper text-deepblue"
                          : "bg-transparent text-white/65 hover:text-white/90",
                      ].join(" ")}
                    >
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] opacity-80">
                        {dayName}
                      </span>
                      <span className="tabular text-[15px] font-semibold leading-tight">
                        {dateNum}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl bg-paper overflow-hidden divide-y divide-hairline shadow-[0_4px_16px_-6px_rgba(0,0,0,0.25)]">
                {eventsForDay.map((event, i) => {
                  const schedules = getSchedulesForEvent(event);
                  return (
                    <div
                      key={`${event.start}-${i}`}
                      className="px-4 py-3.5 flex flex-col gap-2"
                    >
                      <div className="flex justify-center">
                        <span className="tabular inline-flex items-center rounded-full px-4 py-1.5 text-[15px] font-semibold bg-deepblue text-white">
                          {formatTimeRange(event)}
                        </span>
                      </div>
                      {schedules.length > 0 && (
                        <div className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-ink/70">
                          {schedules.map((s, j) => {
                            const sourceParsing = s.sources
                              .filter(
                                (src) =>
                                  src.source_type === "parsing" &&
                                  src.parsing_uuid,
                              )
                              .map((src) =>
                                fullDetails.parsings.find(
                                  (p) => p.uuid === src.parsing_uuid,
                                ),
                              )
                              .find((p) => p?.scraping_url || p?.image_url);
                            const sourceUrl =
                              sourceParsing?.scraping_url ??
                              sourceParsing?.image_url;
                            const hasOclocher = s.sources.some(
                              (src) => src.source_type === "oclocher",
                            );
                            return (
                              <div
                                key={j}
                                className="whitespace-pre-line flex flex-col gap-1"
                              >
                                <p>{s.explanation}</p>
                                {hasOclocher && (
                                  <div className="flex justify-end">
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border select-none"
                                      style={{
                                        borderColor: "#609E2E",
                                        color: "#609E2E",
                                      }}
                                      title="Source vérifiée par OClocher"
                                    >
                                      <SealCheckIcon size={12} weight="fill" />
                                      <span className="text-[11px] font-medium tracking-tight">
                                        OClocher
                                      </span>
                                    </span>
                                  </div>
                                )}
                                {sourceUrl && (
                                  <Link
                                    href={sourceUrl}
                                    target="_blank"
                                    className="text-deepblue/50 hover:text-deepblue block text-right text-[12px]"
                                  >
                                    Source ↗
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center py-5 gap-3">
            <div className="flex items-center gap-3 px-3 bg-white/8 border border-white/12 rounded-full h-9">
              <button
                aria-label="Utile"
                disabled={!canReport}
                className={[
                  "flex items-center justify-center w-6 h-6 transition-colors",
                  feedbackOpen === "good"
                    ? "text-emerald-300"
                    : "text-white/85 hover:text-white",
                  !canReport && "opacity-40 cursor-not-allowed",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleFeedbackClick("good")}
              >
                <ThumbsUpIcon
                  size={18}
                  weight={feedbackOpen === "good" ? "fill" : "regular"}
                />
              </button>
              <span className="tabular text-white text-[14px] font-semibold min-w-[1ch] text-center">
                {upvotes}
              </span>
              <div className="w-px h-5 bg-white/20" />
              <span className="tabular text-white text-[14px] font-semibold min-w-[1ch] text-center">
                {downvotes}
              </span>
              <button
                aria-label="Pas utile"
                disabled={!canReport}
                className={[
                  "flex items-center justify-center w-6 h-6 transition-colors",
                  feedbackOpen === "error"
                    ? "text-rose-300"
                    : "text-white/85 hover:text-white",
                  !canReport && "opacity-40 cursor-not-allowed",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleFeedbackClick("error")}
              >
                <ThumbsDownIcon
                  size={18}
                  weight={feedbackOpen === "error" ? "fill" : "regular"}
                />
              </button>
            </div>

            {feedbackOpen && (
              <div className="w-full px-4">
                <div className="bg-paper rounded-xl p-3 flex flex-col gap-2 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]">
                  {feedbackOpen === "error" && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(ERROR_TYPE_LABELS) as ErrorType[]).map(
                        (key) => {
                          const selected = errorType === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={postReport.isPending}
                              onClick={() =>
                                setErrorType((curr) =>
                                  curr === key ? null : key,
                                )
                              }
                              className={[
                                "text-[12px] font-medium rounded-full px-2.5 py-1 transition-colors border",
                                selected
                                  ? "bg-deepblue text-white border-deepblue"
                                  : "bg-transparent text-deepblue/70 border-hairline hover:border-deepblue/40 hover:text-deepblue",
                              ].join(" ")}
                            >
                              {ERROR_TYPE_LABELS[key]}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Un commentaire ? (optionnel)"
                    rows={3}
                    disabled={postReport.isPending}
                    className="w-full resize-none text-ink text-[13px] leading-normal placeholder:text-ink/40 bg-transparent focus:outline-none disabled:opacity-60"
                  />
                  {postReport.isError && (
                    <p className="text-rose-600 text-[12px]">
                      Erreur lors de l&apos;envoi. Réessayez.
                    </p>
                  )}
                  <div className="flex justify-end gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackOpen(null);
                        setFeedbackText("");
                        setErrorType(null);
                      }}
                      disabled={postReport.isPending}
                      className="text-deepblue/60 hover:text-deepblue text-[13px] px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitFeedback}
                      disabled={postReport.isPending}
                      className="inline-flex items-center gap-1.5 bg-deepblue text-white text-[13px] font-semibold rounded-full px-3.5 py-1.5 hover:bg-deepblue/90 transition-colors disabled:opacity-60"
                    >
                      {postReport.isPending ? (
                        <CircleNotchIcon
                          size={14}
                          weight="bold"
                          className="animate-spin"
                        />
                      ) : (
                        <PaperPlaneTiltIcon size={14} weight="fill" />
                      )}
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {comments.length > 0 && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {comments.map((c, i) => (
                <div
                  key={i}
                  className="relative bg-paper rounded-xl px-3.5 py-2.5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]"
                >
                  {c.feedback_type === "good" && (
                    <ThumbsUpIcon
                      size={14}
                      weight="fill"
                      aria-label="Avis positif"
                      className="absolute top-2.5 right-3 text-emerald-700/60"
                    />
                  )}
                  {c.feedback_type === "error" && (
                    <ThumbsDownIcon
                      size={14}
                      weight="fill"
                      aria-label="Avis négatif"
                      className="absolute top-2.5 right-3 text-rose-700/60"
                    />
                  )}
                  <CommentEntry node={c} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center px-4">
            <Link
              href={`https://confessio.fr/paroisse/${fullDetails?.website?.uuid}#feedbackForm`}
              target="_blank"
              className="inline-block underline underline-offset-4 decoration-white/30 hover:decoration-white/70 text-white/75 hover:text-white text-[13px] transition-colors"
              onClick={() =>
                posthog.capture("contribution_link_clicked", {
                  church_uuid: uuid,
                  church_name: churchDetails.name,
                })
              }
            >
              Compl&eacute;ter les horaires de cette paroisse
            </Link>
          </div>

          {fullDetails && dayKeys.length === 0 && (
            <p className="text-center text-white/55 py-6 text-sm">
              Aucun horaire disponible
            </p>
          )}
        </div>
      </ModalSheetScroller>
    </>
  );
};

export { ChurchCard };
