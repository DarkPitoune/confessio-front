import { MapContainer, Popup, TileLayer, Marker } from "react-leaflet";
import { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { components } from "@/types";

const Map = ({
  setMap,
  searchResults,
  currentPosition,
}: {
  setMap: (map: LeafletMap) => void;
  searchResults: components["schemas"]["SearchResult"] | undefined;
  currentPosition: { latitude: number; longitude: number } | null;
}) => {
  return (
    <MapContainer
      center={[48.8439808, 2.2642688]}
      zoom={14}
      ref={setMap}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OSM</a> contributors'
      />
      {searchResults?.churches &&
        searchResults.churches.map((church) => (
          <Marker
            key={church.uuid}
            position={[church.latitude, church.longitude]}
            title={church.name}
          >
            <Popup>
              <strong>{church.name}</strong>
              <br />
              {church.address}
            </Popup>
          </Marker>
        ))}
      {currentPosition && (
        <Marker
          position={[currentPosition.latitude, currentPosition.longitude]}
          title="You are here"
        >
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
