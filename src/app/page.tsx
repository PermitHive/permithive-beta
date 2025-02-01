"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/hero";
import { SiteList } from "@/components/site-list";
import { LoadingScreen } from "@/components/loading-spinner";

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
  const [activeTab, setActiveTab] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      fetchProperties();
    };
    
    checkUserAndFetch();
  }, []);

  async function fetchProperties() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from("code_checks")
        .select("*")
        .eq('user_id', user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching properties:", error);
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error("Error in fetchProperties:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section className="bg-white border-b border-gray-200">
        <Hero />
      </section>

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-1/4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-auto">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-4">Filter Sites</h3>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-3">Status</h4>
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="completed">Done</TabsTrigger>
                        <TabsTrigger value="in_progress">Active</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Sites</span>
                      <span className="font-medium">{properties.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active</span>
                      <span className="font-medium">
                        {properties.filter(p => p.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">
                        {properties.filter(p => p.status === 'completed').length}
                      </span>
                    </div>
                  </div>
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
