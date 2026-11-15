"use client";

import dynamic from "next/dynamic";

const ParkingMap = dynamic(
  () => import("./parking-map").then((module) => module.ParkingMap),
  {
    ssr: false,
    loading: () => <div className="app-shell" aria-busy="true" />,
  },
);

export function ParkingMapLoader() {
  return <ParkingMap />;
}
