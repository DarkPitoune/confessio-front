import { components } from "@/types";
import clsx from "clsx";
import { Map } from "leaflet";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { NavigationModal } from "./NavigationModal";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { isSearchFocusedAtom } from "@/atoms";

const mapItemTypeToImageProps: Record<string, { src: string; alt: string }> = {
  church: { src: "/church.svg", alt: "Église" },
  parish: { src: "/parish.svg", alt: "Paroisse" },
  municipality: { src: "/city.svg", alt: "Ville" },
};

export const SearchInput = ({
  map,
  data,
  isLoading,
  searchQuery,
  setSearchQuery,
}: {
  map: Map | null;
  data: components["schemas"]["AutocompleteItem"][];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => {
  const [isFocused, setIsFocused] = useAtom(isSearchFocusedAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => {
    setIsFocused(false);
    inputRef.current?.blur();
  }, [setIsFocused]);

  // Android back button closes search instead of navigating away
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isFocused) {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isFocused, closeSearch]);

  const onClick = (item: components["schemas"]["AutocompleteItem"]) => () => {
    if (map && item.latitude && item.longitude) {
      const zoomLevel = item.type === "municipality" ? 13 : 15;
      map.setView([item.latitude, item.longitude], zoomLevel);
      inputRef.current?.blur();
    }
  };
  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      // When user types, navigate back to home if on a church detail page
      if (pathname?.startsWith("/church/")) {
        const currentParams = new URLSearchParams(window.location.search);
        router.push(`/?${currentParams.toString()}`);
      }
    },
    [setSearchQuery, pathname, router],
  );

  return (
    <>
      <div
        className={clsx([
          "absolute flex flex-col items-stretch justify-start z-40 md:w-[468px] md:rounded-3xl md:inset-x-4 md:top-4",
          isFocused
            ? "inset-0 bg-white pt-4 px-4 md:bg-transparent md:p-0 md:bottom-4 md:h-auto"
            : "inset-x-4 top-4 rounded-3xl",
        ])}
      >
        <div
          className={clsx([
            "p-2 border bg-white gap-2 border-gray-300 rounded-full text-black flex relative z-10",
            { "shadow-lg": !isFocused },
          ])}
        >
          {isFocused ? (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeSearch}
              className="cursor-pointer"
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button onClick={() => setIsNavigationModalOpen(true)} className="cursor-pointer">
              <Image
                src="/confessioLogoBlue.svg"
                alt="Logo de Confessio"
                width={24}
                height={24}
              />
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Chercher une église ou une ville"
            value={searchQuery}
            onChange={onInputChange}
            onFocus={() => {
              setIsFocused(true);
              history.pushState({ search: true }, "");
            }}
            onBlur={() => setIsFocused(false)}
            className="outline-none flex-1"
          />
          {isLoading && (
            <Image
              src="/spinner.svg"
              alt="Loading"
              width={18}
              height={18}
              className="animate-spin"
            />
          )}
          {searchQuery.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsFocused(false);
                inputRef.current?.blur();
              }}
              className="cursor-pointer"
              aria-label="Clear search"
              title="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={(e) => e.preventDefault()}
            >
              <Image
                src="/x-mark.svg"
                alt="Clear search"
                width={18}
                height={18}
              />
            </button>
          )}
        </div>
        <ul
          className={clsx(
            "min-h-0 overflow-y-auto bg-white rounded-b-3xl flex-1 -mt-5 pt-5",
            { hidden: !isFocused },
          )}
        >
          {isFocused && data.length === 0 && !isLoading && (
            <li className="flex items-center justify-center h-full p-4">
              <p className="font-bold text-gray-400 text-center">
                {searchQuery.length > 0
                  ? "Pas de résultat trouvé pour cette recherche"
                  : "Tapez le nom d'une ville, d'une église"}
              </p>
            </li>
          )}
          {isFocused &&
            data.filter((item) => item.type !== "parish").map((item, index) => {
              const inner = (
                <>
                  <Image
                    src={mapItemTypeToImageProps[item.type]?.src ?? "/city.svg"}
                    alt={mapItemTypeToImageProps[item.type]?.alt ?? "Lieu"}
                    width={24}
                    height={24}
                  />
                  <div className="flex flex-col">
                    <div className="flex flex-col">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.context}</div>
                  </div>
                </>
              );
              const className =
                "w-full text-left px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center hover:bg-gray-100 gap-2";
              return (
                <li key={index} className="p-2 text-black divide-gray-600">
                  {item.type === "church" && item.uuid ? (
                    <Link
                      href={`/church/${item.uuid}`}
                      onMouseDown={(e) => e.preventDefault()}
                      className={className}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={onClick(item)}
                      className={className}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
      <NavigationModal
        isOpen={isNavigationModalOpen}
        onClose={() => setIsNavigationModalOpen(false)}
      />
    </>
  );
};
