"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, allowCurrent = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value || "");

  useEffect(() => {
    if (!query) return setSuggestions([]);
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [query]);

  const handleSelect = (place) => {
    setQuery(place.place_name);
    setSuggestions([]);
    onChange?.(place.place_name);
    onSelect?.({
      address: place.place_name,
      coordinates: { lng: place.center[0], lat: place.center[1] }
    });
  };

  const handleUseCurrent = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      // reverse geocode
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await res.json();
      const place = data.features?.[0];
      if (place) {
        handleSelect(place);
      } else {
        alert("Could not fetch address from location");
      }
    });
  };

  return (
    <div className="relative">
      <Input
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange?.(e.target.value);
        }}
      />
      {allowCurrent && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleUseCurrent}
        >
          Use My Current Location
        </Button>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white shadow rounded mt-1 max-h-60 overflow-auto">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.id}
              className="block w-full text-left px-3 py-2 hover:bg-blue-50"
              onClick={() => handleSelect(s)}
            >
              {s.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
