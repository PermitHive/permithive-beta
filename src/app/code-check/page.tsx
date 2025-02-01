"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CodeCheckHeader } from "@/components/code-check-header";
import { StepProgress } from "@/components/step-progress";
import CodeCheckLayout from "@/components/code-check-layout";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/loading-spinner-new";
import "@/app/globals.css";

const SearchParamsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const codeCheckId = searchParams.get("codeCheckId");

  const coordinates = {
    latitude: latitude ? parseFloat(latitude) : 0,
    longitude: longitude ? parseFloat(longitude) : 0,
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!codeCheckId) {
    return <div>No code check ID provided</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow bg-gray-50">
        <main className="container mx-auto px-8 py-8">
          <CodeCheckHeader
            address={decodeURIComponent(address || "")}
            latitude={coordinates.latitude}
            longitude={coordinates.longitude}
          />
          <CodeCheckLayout codeCheckId={codeCheckId} />
        </main>
      </div>
    </div>
  );
};

const CodeCheckPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchParamsContent />
    </Suspense>
  );
};

export default CodeCheckPage;