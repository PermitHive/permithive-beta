"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoCodeCheckHeader } from "@/components/demo-code-check-header";
import { StepProgress } from "@/components/step-progress";
import { CodeCheckLayout } from "@/components/demo-code-check";
import PermitSubmission from "@/components/demo-permit-submission";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/lib/supabase";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchParamsContent = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<"code-check" | "permit">("code-check");
  const address = "101 E Orangethorpe Ave Ste Ne, Fullerton, CA 92832";
  const coordinates = {
    latitude: 33.8597,
    longitude: -117.9224
  };
  const codeCheckId = "43709c65-7580-41b2-ba98-0a5626fa0b0d";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="sticky top-[64px] z-30 bg-white">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-lg font-medium">{address}</div>
                <div className="text-sm text-gray-500 font-mono">
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </div>
              </div>
            </div>
            <nav className="space-x-4 flex">
              <Button variant="outline" onClick={() => {}}>
                Analyze Documents
              </Button>
              <Button variant="outline">Save as PDF</Button>
              <Button variant="outline">Edit Details</Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8 bg-white">
        <DemoCodeCheckHeader
          address={address}
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
        />

        {/* Step Navigation */}
        <div className="mt-8">
          <StepProgress
            steps={[
              { label: "Site restrictions and code review", value: "code-check" },
              { label: "Permit submission", value: "permit" }
            ]}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step as "code-check" | "permit")}
          />
        </div>

        {/* Conditional Rendering based on step */}
        {currentStep === "code-check" ? (
          <CodeCheckLayout codeCheckId={codeCheckId} />
        ) : (
          <PermitSubmission />
        )}
      </div>
    </div>
  );
};

const CodeCheckPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsContent />
    </Suspense>
  );
};

export default CodeCheckPage;