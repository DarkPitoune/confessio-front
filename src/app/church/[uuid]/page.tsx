"use client";

// This page exists only for direct URL access and SEO
// The actual UI is handled by the homepage with shadow routing
import { redirect } from "next/navigation";

export default function ChurchPage() {
  // Redirect to homepage - the URL will be handled by shadow routing
  redirect('/');
}