"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapView from "../components/MapView";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapView />
    </QueryClientProvider>
  );
}
