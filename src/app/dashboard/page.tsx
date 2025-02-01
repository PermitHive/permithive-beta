"use client";

import React, { useState, useEffect } from "react";
// import { analyzeDocument } from "@/app/actions";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/hero";
import { SiteList } from "@/components/site-list";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  project_type: string[];
  last_updated: string;
  status: string;
};

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // const [documentText, setDocumentText] = useState<string>("");
  // const [analysisResult, setAnalysisResult] = useState<string>("");
  // const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    checkUser();
    fetchProperties();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }

  async function fetchProperties() {
    const { data, error } = await supabase
      .from("code_checks")
      .select("*")
      .neq("status", "deleted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return;
    }

    const statuses = Array.from(
      new Set(data?.map((p) => p.status) || [])
    ).filter((status) => status && status !== "deleted");
    const cities = Array.from(
      new Set(data?.map((p) => p.city).filter(Boolean))
    );

    console.log("Available statuses:", statuses);
    setStatusFilters(["all", ...statuses]);
    setAvailableCities(cities);
    setProperties(data || []);
  }

  const filteredProperties = properties.filter(
    (property) => activeTab === "all" || property.status === activeTab
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <section className="bg-white border-b border-gray-200">
          <Hero />
        </section>
        <main className="flex-grow py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // const handleAnalysis = async (documentText: string) => {
  //   const result = await analyzeDocument(documentText);
  //   if (result.error) {
  //     console.error("Error analyzing document:", result.error);
  //     throw new Error(result.error);
  //   }
  //   return result;
  // };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section className="bg-white border-b border-gray-200">
        <Hero />
      </section>

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-1/4">
              <Card>
                <CardContent className="p-0">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    orientation="vertical"
                    className="w-full h-full"
                  >
                    <TabsList className="flex flex-col items-stretch h-full">
                      <TabsTrigger
                        key="all"
                        value="all"
                        className="justify-start px-4 py-2 text-left"
                      >
                        All Sites
                      </TabsTrigger>
                      {statusFilters
                        .filter((status) => status !== "all")
                        .map((status) => (
                          <TabsTrigger
                            key={status}
                            value={status}
                            className="justify-start px-4 py-2 text-left capitalize"
                          >
                            {`${status} Projects`}
                          </TabsTrigger>
                        ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Filter by City</h3>
                  <Command>
                    <CommandInput placeholder="Search cities..." />
                    <CommandEmpty>No cities found.</CommandEmpty>
                    <CommandGroup>
                      {availableCities.map((city) => (
                        <CommandItem
                          key={city}
                          onSelect={() => {
                            setSelectedCities((current) => {
                              if (current.includes(city)) {
                                return current.filter((c) => c !== city);
                              }
                              return [...current, city];
                            });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCities.includes(city)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                  {selectedCities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedCities.map((city) => (
                        <Badge
                          key={city}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedCities((current) =>
                              current.filter((c) => c !== city)
                            )
                          }
                        >
                          {city}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>

            <div className="w-full lg:w-3/4">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Your Sites
              </h2>
              <SiteList filter={activeTab} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
