import { components } from "@/types";
import clsx from "clsx";
import { Map } from "leaflet";
import Image from "next/image";
import { useState } from "react";

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
  const [isFocused, setIsFocused] = useState(false);
  const onClick = (item: components["schemas"]["AutocompleteItem"]) => () => {
    console.log("Clicked item:", item);
    if (map && item.latitude && item.longitude) {
      const zoomLevel = item.type === "municipality" ? 13 : 15;
      map.setView([item.latitude, item.longitude], zoomLevel);
      setSearchQuery(item.name);
    }
  };

  return (
    <div
      className={clsx([
        "absolute flex flex-col items-stretch justify-start p-4",
        isFocused
          ? "inset-0 bg-deepblue transition-colors"
          : "inset-x-0 rounded-full bg-transparent",
      ])}
      style={{ zIndex: 10_000 }} // to one-up the modal at the bottom
    >
      <div className="p-2 border bg-white shadow-lg gap-2 border-gray-300 rounded-full text-black flex">
        <Image
          src="/confessioLogoBlue.svg"
          alt="Logo de Confessio"
          width={24}
          height={24}
        />
        <input
          type="text"
          placeholder="Chercher une église ou une ville"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="outline-none flex-1"
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery("")}
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
      <ul className={clsx("min-h-0 overflow-scroll", { hidden: !isFocused })}>
        {isLoading && (
          <li className="p-2 text-white">
            <div className="flex items-center justify-center">Chargement</div>
          </li>
        )}
        {data.map((item, index) => (
          <li key={index} className="p-2 text-white divide-gray-600">
            <button
              onMouseDown={onClick(item)}
              className="w-full text-left p-2 rounded-lg transition-colors cursor-pointer flex gap-2 items-center"
            >
              <Image
                src={item.type === "church" ? "/church.svg" : "/city.svg"}
                alt={item.type === "church" ? "Église" : "Ville"}
                width={24}
                height={24}
              />
              <div className="flex flex-col">{item.name}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
