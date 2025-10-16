"use client";

import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import { Car, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "mapbox-gl/dist/mapbox-gl.css";
import { auth } from "@/utils/auth";

export default function ActiveBookingCard({ booking }) {
  const [liveBooking, setLiveBooking] = useState(booking);
  const [driverLocation, setDriverLocation] = useState(booking.vehicle_location);
  const [etaPickup, setEtaPickup] = useState(null);
  const [etaDropoff, setEtaDropoff] = useState(null);
  const [arrivalPickup, setArrivalPickup] = useState(null);
  const [arrivalDropoff, setArrivalDropoff] = useState(null);
  const [routePickupDrop, setRoutePickupDrop] = useState(null);
  const [routeDriverPickup, setRouteDriverPickup] = useState(null);

  const mapRef = useRef(null);

  if (!booking) return null;

  const pickup = [booking.pickup_coordinates.lng, booking.pickup_coordinates.lat];
  const dropoff = [booking.dropoff_coordinates.lng, booking.dropoff_coordinates.lat];

  // Format time nicely
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Live socket: driver location + status updates
  useEffect(() => {
    const token = auth.getToken();
    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("driver:location", (data) => {
      if (data.bookingId === liveBooking._id) {
        setDriverLocation(data.location);
      }
    });

    socket.on("booking:updated", (b) => {
      if (b._id === liveBooking._id) {
        setLiveBooking(b);
        if (["arrived", "in_transit", "completed"].includes(b.status)) {
          setRouteDriverPickup(null);
        }
      }
    });

    return () => socket.disconnect();
  }, [liveBooking]);

  // Always recalc ETAs every minute + whenever driverLocation changes
  useEffect(() => {
    const updateEtas = async () => {
      if (!driverLocation) return;

      // Reset values first
      setEtaPickup(null);
      setEtaDropoff(null);
      setArrivalPickup(null);
      setArrivalDropoff(null);

      // If pending → no ETAs
      if (liveBooking.status === "pending") return;

      // Assigned or en_route → calc both pickup and dropoff
      if (["assigned", "en_route"].includes(liveBooking.status)) {
        // Driver → Pickup
        const urlPickup = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${driverLocation.lng},${driverLocation.lat};${pickup[0]},${pickup[1]}?geometries=geojson&overview=simplified&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
        const resPickup = await fetch(urlPickup);
        const jsonPickup = await resPickup.json();
        let pickupDur = 0;
        if (jsonPickup.routes?.[0]) {
          setRouteDriverPickup({
            type: "Feature",
            properties: {},
            geometry: jsonPickup.routes[0].geometry,
          });
          pickupDur = jsonPickup.routes[0].duration;
          setEtaPickup(Math.round(pickupDur / 60));
          setArrivalPickup(new Date(Date.now() + pickupDur * 1000));
        }

        // Pickup → Dropoff
        const urlDrop = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}?geometries=geojson&overview=simplified&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
        const resDrop = await fetch(urlDrop);
        const jsonDrop = await resDrop.json();
        if (jsonDrop.routes?.[0]) {
          setRoutePickupDrop({
            type: "Feature",
            properties: {},
            geometry: jsonDrop.routes[0].geometry,
          });
          const dropDur = jsonDrop.routes[0].duration;
          const totalDur = pickupDur + dropDur;
          setEtaDropoff(Math.round(totalDur / 60));
          setArrivalDropoff(new Date(Date.now() + totalDur * 1000));
        }
      }

      // Arrived or in_transit → only driver → dropoff
      if (["arrived", "in_transit"].includes(liveBooking.status)) {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${driverLocation.lng},${driverLocation.lat};${dropoff[0]},${dropoff[1]}?geometries=geojson&overview=simplified&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes?.[0]) {
          setRoutePickupDrop({
            type: "Feature",
            properties: {},
            geometry: json.routes[0].geometry,
          });
          const dur = json.routes[0].duration;
          setEtaDropoff(Math.round(dur / 60));
          setArrivalDropoff(new Date(Date.now() + dur * 1000));
        }
      }
    };

    updateEtas(); // run immediately
    const interval = setInterval(updateEtas, 60000); // update every 60s
    return () => clearInterval(interval);
  }, [driverLocation, liveBooking.status]);

  // Custom driver car marker
  const CarMarker = ({ lng, lat }) => (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <Car className="w-5 h-5 text-blue-700" />
    </Marker>
  );

  return (
    <Card className="border border-blue-500 shadow-sm mb-4 max-w-md mx-auto">
      <CardHeader className="flex items-center justify-between py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-blue-700 text-base font-semibold">
          <Car className="w-4 h-4" /> Active Ride
        </CardTitle>
        <Badge variant="outline" className="capitalize text-xs">
          {liveBooking.status.replace("_", " ")}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2 text-xs px-4 pb-4">
        {/* Addresses */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3 h-3 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium">From</p>
            <p className="truncate">{liveBooking.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-3 h-3 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium">To</p>
            <p className="truncate">{liveBooking.dropoff_address}</p>
          </div>
        </div>

        {/* Map */}
        <div className="w-full h-64 rounded-md overflow-hidden my-2">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: pickup[0], latitude: pickup[1], zoom: 12 }}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {/* Pickup/Drop markers */}
            <Marker longitude={pickup[0]} latitude={pickup[1]} color="green" />
            <Marker longitude={dropoff[0]} latitude={dropoff[1]} color="red" />
            {/* Driver marker (car icon) */}
            {driverLocation && <CarMarker lng={driverLocation.lng} lat={driverLocation.lat} />}

            {/* Pickup → Dropoff line */}
            {routePickupDrop && (
              <Source id="pickup-drop" type="geojson" data={routePickupDrop}>
                <Layer
                  id="pickupDropLine"
                  type="line"
                  layout={{ "line-join": "round", "line-cap": "round" }}
                  paint={{
                    "line-color":
                      liveBooking.status === "in_transit" || liveBooking.status === "arrived"
                        ? "#1d4ed8"
                        : "#999999",
                    "line-width": liveBooking.status === "in_transit" ? 4 : 2,
                  }}
                />
              </Source>
            )}

            {/* Driver → Pickup line */}
            {routeDriverPickup && ["assigned", "en_route"].includes(liveBooking.status) && (
              <Source id="driver-pickup" type="geojson" data={routeDriverPickup}>
                <Layer
                  id="driverPickupLine"
                  type="line"
                  layout={{ "line-join": "round", "line-cap": "round" }}
                  paint={{ "line-color": "#1d4ed8", "line-width": 4 }}
                />
              </Source>
            )}
          </Map>
        </div>

        {/* ETAs */}
        {["assigned", "en_route"].includes(liveBooking.status) &&
          etaPickup &&
          arrivalPickup && (
            <p className="text-blue-600 font-medium">
              ETA to Pickup: {etaPickup} mins (arrives {formatTime(arrivalPickup)})
            </p>
          )}

        {["assigned", "en_route", "arrived", "in_transit"].includes(liveBooking.status) &&
          etaDropoff &&
          arrivalDropoff && (
            <p className="text-blue-600 font-medium">
              ETA to Dropoff: {etaDropoff} mins (arrives {formatTime(arrivalDropoff)})
            </p>
          )}

        {/* Driver Info */}
        {liveBooking.driver_name && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <p className="font-medium text-blue-700 text-sm">Driver: {liveBooking.driver_name}</p>
            {liveBooking.driver_phone && (
              <div className="flex items-center gap-1 text-blue-600">
                <Phone className="w-3 h-3" />
                <span>{liveBooking.driver_phone}</span>
              </div>
            )}
            {liveBooking.vehicle_info && (
              <p className="text-gray-600 text-xs">{liveBooking.vehicle_info}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
