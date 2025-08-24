import { hasSelectedChurchAtom, selectedChurchAtom } from "@/store/atoms";
import { useAtom } from "jotai";

export function SelectedChurchInfo() {
  const [selectedChurch] = useAtom(selectedChurchAtom);
  const [hasSelectedChurch] = useAtom(hasSelectedChurchAtom);

  if (!hasSelectedChurch) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Aucune église sélectionnée</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-lg text-blue-900 mb-2">
        Église sélectionnée
      </h3>
      <div className="space-y-2">
        <p className="text-blue-800">
          <span className="font-medium">Nom:</span> {selectedChurch?.name}
        </p>
        <p className="text-blue-800">
          <span className="font-medium">Ville:</span>{" "}
          {selectedChurch?.city || "Non spécifiée"}
        </p>
        <p className="text-blue-800">
          <span className="font-medium">Code postal:</span>{" "}
          {selectedChurch?.zipcode || "Non spécifié"}
        </p>
        <p className="text-blue-800">
          <span className="font-medium">Adresse:</span>{" "}
          {selectedChurch?.address || "Non spécifiée"}
        </p>
      </div>
    </div>
  );
}
