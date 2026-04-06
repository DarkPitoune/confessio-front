import { components } from "@/types";
import clsx from "clsx";
import { Map } from "leaflet";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { NavigationModal } from "./NavigationModal";
import { useRouter, usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { isSearchFocusedAtom } from "@/atoms";
import { ArrowLeftIcon, BuildingsIcon, ChurchIcon, CircleNotchIcon, UsersIcon, XIcon } from "@phosphor-icons/react";
import { Icon } from "@phosphor-icons/react/dist/lib/types";

const mapItemTypeToIcon: Record<string, Icon> = {
  church: ChurchIcon,
  parish: UsersIcon,
  municipality: BuildingsIcon,
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

  const onClick = useCallback(
    (item: components["schemas"]["AutocompleteItem"]) => () => {
      if (map && item.latitude && item.longitude) {
        const zoomLevel = item.type === "municipality" ? 13 : 15;
        map.setView([item.latitude, item.longitude], zoomLevel);
        inputRef.current?.blur();
      }
    },
    [map],
  );
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

  const filteredData = data.filter((item) => item.type !== "parish");

  const selectFirstResult = useCallback(() => {
    const first = filteredData[0];
    if (!first) return;
    if (first.type === "church" && first.uuid) {
      inputRef.current?.blur();
      const params = new URLSearchParams(window.location.search);
      if (first.latitude && first.longitude) {
        params.set("center", `${first.latitude},${first.longitude}`);
      }
      router.push(`/church/${first.uuid}?${params.toString()}`);
    } else {
      onClick(first)();
    }
  }, [filteredData, router, onClick]);

  const hasResults = searchQuery.length > 0 && (data.length > 0 || isLoading);

  return (
    <>
      <div
        className={clsx([
          "absolute flex flex-col items-stretch justify-start z-40 md:w-[468px] md:rounded-3xl md:inset-x-4 md:top-4",
          isFocused
            ? hasResults
              ? "inset-x-0 top-0 bg-white pt-4 px-4 max-h-[80vh] md:bg-transparent md:p-0 md:max-h-none"
              : "inset-0 bg-white pt-4 px-4 md:bg-transparent md:p-0 md:bottom-4 md:h-auto"
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
              <ArrowLeftIcon size={24} />
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                selectFirstResult();
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              history.pushState({ search: true }, "");
            }}
            onBlur={() => setIsFocused(false)}
            className="outline-none flex-1"
          />
          {isLoading && (
            <CircleNotchIcon size={18} className="animate-spin self-center shrink-0" />
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
              <XIcon size={18} />
            </button>
          )}
        </div>
        <ul
          className={clsx(
            "min-h-0 overflow-y-auto bg-white rounded-b-3xl -mt-5 pt-5",
            { hidden: !isFocused, "flex-1": !hasResults },
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
            filteredData.map((item, index) => {
              const ItemIcon = mapItemTypeToIcon[item.type] ?? BuildingsIcon;
              const inner = (
                <>
                  <ItemIcon size={24} />
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
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        inputRef.current?.blur();
                        const params = new URLSearchParams(window.location.search);
                        if (item.latitude && item.longitude) {
                          params.set("center", `${item.latitude},${item.longitude}`);
                        }
                        router.push(`/church/${item.uuid}?${params.toString()}`);
                      }}
                      className={className}
                    >
                      {inner}
                    </button>
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
