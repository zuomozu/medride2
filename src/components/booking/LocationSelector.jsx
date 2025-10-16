"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Loader2, X } from "lucide-react";


const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const ONTARIO_BBOX = [-95.15, 41.67, -74.34, 56.86];
const TORONTO = { lng: -79.3832, lat: 43.6532 };

async function reverseGeocode({ lng, lat }) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en&country=CA`;
  const r = await fetch(url);
  const j = await r.json();
  const feature =
    j?.features?.find((f) => f.place_type.includes("address")) ||
    j?.features?.[0] ||
    { place_name: "Selected location", text: "" };
  return feature;
}

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export default function LocationSelector({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
}) {
  const [pickupQuery, setPickupQuery] = useState(pickup?.address || "");
  const [dropoffQuery, setDropoffQuery] = useState(dropoff?.address || "");
  const [pickupBlocked, setPickupBlocked] = useState(!!pickup);
  const [dropoffBlocked, setDropoffBlocked] = useState(!!dropoff);

  const [pickupSugg, setPickupSugg] = useState([]);
  const [dropoffSugg, setDropoffSugg] = useState([]);
  const [openPickup, setOpenPickup] = useState(false);
  const [openDropoff, setOpenDropoff] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [pendingPickup, setPendingPickup] = useState(null);
  const [pendingDropoff, setPendingDropoff] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectingText, setSelectingText] = useState("");
  const [statusText, setStatusText] = useState(
    pickup ? "" : "Set your Pickup"
  );

  const wrapperRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  const [route, setRoute] = useState(null);

useEffect(() => {
  if (pickupBlocked && dropoffBlocked && pickup?.coordinates && dropoff?.coordinates) {
    fetchRoute(pickup.coordinates, dropoff.coordinates).then(setRoute);
  } else {
    setRoute(null); // clear route if not both confirmed
  }
}, [pickupBlocked, dropoffBlocked, pickup, dropoff]);


  const center = useMemo(
    () =>
      dropoff?.coordinates ||
      pickup?.coordinates ||
      TORONTO,
    [pickup, dropoff]
  );

  const [view, setView] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 11,
  });

  // 🔑 track which selection is active
  const [activeSelection, setActiveSelection] = useState("pickup");

  useEffect(() => {
    setView((v) => ({
      ...v,
      longitude: center.lng,
      latitude: center.lat,
    }));
  }, [center.lng, center.lat]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpenPickup(false);
        setOpenDropoff(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const [proximity, setProximity] = useState(TORONTO);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setProximity({ lng: longitude, lat: latitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const fetchSugg = async (q) => {
    try {
      if (!q || q.length < 2) return [];
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          q
        )}.json` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&autocomplete=true&limit=5&language=en` +
        `&country=CA` +
        `&bbox=${ONTARIO_BBOX.join(",")}` +
        `&types=address,poi,place,neighborhood,locality`;
      const r = await fetch(url);
      const j = await r.json();
      return j.features || [];
    } catch (err) {
      console.error("geocode error", err);
      return [];
    }
  };

  const formatPlaceName = (feature) => {
    const houseNum = feature.address || "";
    const street = feature.text || "";
    const city = feature.context?.find((c) => c.id.includes("place"))?.text;
    const province = feature.context?.find((c) => c.id.includes("region"))?.text;
    const postal = feature.context?.find((c) => c.id.includes("postcode"))?.text;
    return `${houseNum ? houseNum + " " : ""}${street}${
      city ? ", " + city : ""
    }${province ? ", " + province : ""}${postal ? " " + postal : ""}`;
  };

  const debouncedPickup = useDebounce(pickupQuery, 300);
  const debouncedDropoff = useDebounce(dropoffQuery, 300);

  // Pickup suggestions
  useEffect(() => {
    (async () => {
      if (!debouncedPickup || pendingPickup || pickupBlocked) {
        setPickupSugg([]);
        return;
      }
      const features = await fetchSugg(debouncedPickup);
      setPickupSugg(features);
      setOpenPickup(features.length > 0);
    })();
  }, [debouncedPickup, proximity.lng, proximity.lat, pendingPickup, pickupBlocked]);

  // Dropoff suggestions
  useEffect(() => {
    (async () => {
      if (!debouncedDropoff || pendingDropoff || dropoffBlocked) {
        setDropoffSugg([]);
        return;
      }
      const features = await fetchSugg(debouncedDropoff);
      setDropoffSugg(features);
      setOpenDropoff(features.length > 0);
    })();
  }, [debouncedDropoff, proximity.lng, proximity.lat, pendingDropoff, dropoffBlocked]);

  const chooseSuggestion = (place, isPickup) => {
  const loc = {
    address: place.place_name,
    coordinates: { lng: place.center[0], lat: place.center[1] },
    place_name: formatPlaceName(place),
    city: place.context?.find((c) => c.id.includes("place"))?.text,
    province: place.context?.find((c) => c.id.includes("region"))?.text,
    postal: place.context?.find((c) => c.id.includes("postcode"))?.text,
  };

  if (isPickup) {
    setPickupQuery(loc.place_name);
    setPickupSugg([]);
    setOpenPickup(false);
    setPickupBlocked(true);           // block dropdown
    setActiveSelection("dropoff");    // move to dropoff step
    setStatusText("Set your Destination");
    onPickupChange?.(loc);            // ✅ confirm immediately
    setShowMap(true);                 // ✅ auto open map
    setView((v) => ({
      ...v,
      longitude: loc.coordinates.lng,
      latitude: loc.coordinates.lat,
      zoom: 14,
    }));
  } else {
    setDropoffQuery(loc.place_name);
    setDropoffSugg([]);
    setOpenDropoff(false);
    setDropoffBlocked(true);          // block dropdown
    setActiveSelection("dropoff");
    setStatusText("");
    onDropoffChange?.(loc);           // ✅ confirm immediately
    setShowMap(true);                 // ✅ auto open map
    setView((v) => ({
      ...v,
      longitude: loc.coordinates.lng,
      latitude: loc.coordinates.lat,
      zoom: 14,
    }));
  }
};


  const useCurrentLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        const feature = await reverseGeocode(coords);
        const displayName = formatPlaceName(feature);
        setPickupQuery(displayName);
        setPendingPickup({
          address: feature.place_name,
          coordinates: coords,
          place_name: displayName,
        });
        setSelectingText("Selecting Pickup");
        setStatusText("Set your Pickup");
        setActiveSelection("pickup");
        setView((v) => ({
          ...v,
          longitude: coords.lng,
          latitude: coords.lat,
          zoom: 14,
        }));
        setLoading(false);
      },
      (err) => {
        alert("Location error: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  const handleMapClick = async (e) => {
    const coords = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    const feature = await reverseGeocode(coords);
    const displayName = formatPlaceName(feature);

    if (activeSelection === "pickup") {
      setPickupQuery(displayName);
      setPendingPickup({
        address: feature.place_name,
        coordinates: coords,
        place_name: displayName,
      });
      setSelectingText("Selecting Pickup");
      setStatusText("Set your Pickup");
    } else if (activeSelection === "dropoff") {
      setDropoffQuery(displayName);
      setPendingDropoff({
        address: feature.place_name,
        coordinates: coords,
        place_name: displayName,
      });
      setSelectingText("Selecting Dropoff");
      setStatusText("Set your Destination");
    }

    setView((v) => ({
      ...v,
      longitude: coords.lng,
      latitude: coords.lat,
      zoom: 14,
    }));
  };

  const onDragEnd = async (type, evt) => {
    const coords = { lng: evt.lngLat.lng, lat: evt.lngLat.lat };
    const feature = await reverseGeocode(coords);
    const displayName = formatPlaceName(feature);
    if (type === "pickup") {
      setPickupQuery(displayName);
      setPendingPickup({
        address: feature.place_name,
        coordinates: coords,
        place_name: displayName,
      });
      setSelectingText("Selecting Pickup");
      setStatusText("Set your Pickup");
      setActiveSelection("pickup");
    } else {
      setDropoffQuery(displayName);
      setPendingDropoff({
        address: feature.place_name,
        coordinates: coords,
        place_name: displayName,
      });
      setSelectingText("Selecting Dropoff");
      setStatusText("Set your Destination");
      setActiveSelection("dropoff");
    }

    setView((v) => ({
      ...v,
      longitude: coords.lng,
      latitude: coords.lat,
      zoom: 14,
    }));
  };

  async function fetchRoute(pickupCoords, dropoffCoords) {
  const res = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords.lng},${pickupCoords.lat};${dropoffCoords.lng},${dropoffCoords.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
  );
  const data = await res.json();
  return data.routes[0].geometry;
}


  const confirmPending = (type) => {
    if (type === "pickup" && pendingPickup) {
      setPickupQuery(pendingPickup.place_name);
      onPickupChange?.(pendingPickup);
      setPendingPickup(null);
      setSelectingText("");
      setOpenPickup(false);
      setPickupBlocked(true);
      setActiveSelection("dropoff");
      setStatusText(dropoffBlocked ? "" : "Set your Destination");
    } else if (type === "dropoff" && pendingDropoff) {
      setDropoffQuery(pendingDropoff.place_name);
      onDropoffChange?.(pendingDropoff);
      setPendingDropoff(null);
      setSelectingText("");
      setOpenDropoff(false);
      setDropoffBlocked(true);
      setStatusText("");
    }
  };

  return (
    <div className="space-y-4">
      <div ref={wrapperRef} className="relative z-50 space-y-4">
        {/* Pickup */}
        <div className="relative z-50 flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={pickupInputRef}
              value={pickupQuery}
              onChange={(e) => {
                const newVal = e.target.value;
                setPickupQuery(newVal);
                setActiveSelection("pickup");
                if (pickupBlocked) {
                  setPickupBlocked(false);
                  setPendingPickup(null);
                  setStatusText("Set your Pickup");
                }
              }}
              placeholder="Pickup (Ontario only)"
              onFocus={() => {
                pickupQuery && setOpenPickup(true);
                setActiveSelection("pickup");
              }}
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              onClick={useCurrentLocation}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
            </button>
            {pickupQuery && (
              <button
                type="button"
                className="absolute right-8 top-2 text-gray-500"
                onClick={() => setPickupQuery("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {openPickup && pickupSugg.length > 0 && (
              <ul className="absolute z-50 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg">
                {pickupSugg.map((f) => (
                  <li
                    key={f.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => chooseSuggestion(f, true)}
                  >
                    {formatPlaceName(f)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowMap((v) => !v)}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>

        {/* Dropoff */}
        <div className="relative z-40 flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={dropoffInputRef}
              value={dropoffQuery}
              onChange={(e) => {
                const newVal = e.target.value;
                setDropoffQuery(newVal);
                setActiveSelection("dropoff");
                if (dropoffBlocked) {
                  setDropoffBlocked(false);
                  setPendingDropoff(null);
                  setStatusText("Set your Destination");
                }
              }}
              placeholder="Dropoff (Ontario only)"
              onFocus={() => {
                dropoffQuery && setOpenDropoff(true);
                setActiveSelection("dropoff");
              }}
              disabled={!pickup}
            />
            {dropoffQuery && (
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                onClick={() => setDropoffQuery("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {openDropoff && dropoffSugg.length > 0 && pickup && (
              <ul className="absolute z-50 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-auto shadow-lg">
                {dropoffSugg.map((f) => (
                  <li
                    key={f.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => chooseSuggestion(f, false)}
                  >
                    {formatPlaceName(f)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowMap((v) => !v)}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map */}
      {showMap && (
        <div className="w-full h-72 rounded-lg overflow-hidden relative z-0 space-y-2">
          {statusText && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded shadow z-50 text-sm font-medium">
              {statusText}
            </div>
          )}

          <Map
  mapboxAccessToken={MAPBOX_TOKEN}
  mapStyle="mapbox://styles/mapbox/streets-v11"
  {...view}
  onMove={(evt) => setView(evt.viewState)}
  style={{ width: "100%", height: "100%" }}
  onClick={handleMapClick}
>
  {/* Pickup Marker */}
  {(pickup?.coordinates || pendingPickup) && (
    <Marker
      longitude={(pendingPickup || pickup).coordinates.lng}
      latitude={(pendingPickup || pickup).coordinates.lat}
      color="green"
      draggable
      onDragEnd={(e) => onDragEnd("pickup", e)}
    />
  )}

  {/* Dropoff Marker */}
  {(dropoff?.coordinates || pendingDropoff || activeSelection === "dropoff") && (
    <Marker
      longitude={
        (pendingDropoff || dropoff)?.coordinates?.lng ||
        view.longitude
      }
      latitude={
        (pendingDropoff || dropoff)?.coordinates?.lat ||
        view.latitude
      }
      color="red"
      draggable={!!(pendingDropoff || dropoff)}
      onDragEnd={(e) => onDragEnd("dropoff", e)}
    />
  )}

  {route && (
  <Source id="route" type="geojson" data={{ type: "Feature", geometry: route }}>
    <Layer
      id="route-line"
      type="line"
      paint={{
        "line-color": "#4264fb",
        "line-width": 5
      }}
    />
  </Source>
)}
</Map>


          {pendingPickup && (
            <Button
              className="absolute bottom-3 left-3 z-50"
              onClick={() => confirmPending("pickup")}
            >
              Confirm Pickup
            </Button>
          )}
          {pendingDropoff && (
            <Button
              className="absolute bottom-3 right-3 z-50"
              onClick={() => confirmPending("dropoff")}
            >
              Confirm Dropoff
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
