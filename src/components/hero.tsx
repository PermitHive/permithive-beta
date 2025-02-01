"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MapPin, X, FileText, Info, Rocket, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadDocument } from "./document-upload";
import { cn } from "@/lib/utils";

export const Hero: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [noAddressFound, setNoAddressFound] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [projectUploadError, setProjectUploadError] = useState<string | null>(
    null
  );
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoningRegions, setZoningRegions] = useState<string[]>([]);
  const [zoningRegion, setZoningRegion] = useState("");
  const [municipalityFiles, setMunicipalityFiles] = useState<File[]>([]);
  const [municipalityFileIds, setMunicipalityFileIds] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [codeChecksCount, setCodeChecksCount] = useState(0);
  const [displayedText, setDisplayedText] = useState("\u00A0");
  const [displayedStats, setDisplayedStats] = useState("\u00A0");
  const municipalityFileInputRef = useRef<HTMLInputElement>(null);
  const hasAnimatedRef = useRef(false);
  const [newProject, setNewProject] = useState({
    project_title: "",
    project_description: "",
    start_date: "",
    end_date: "",
    client_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  const startTypingAnimation = useCallback((name: string, count: number) => {
    const welcomeText = `Welcome back, ${name}.`;
    const statsText = `You've saved ${Math.round(
      count * 0.5
    )} hours running ${count} code checks with GovGoose.`;
    let welcomeIndex = 0;
    let statsIndex = 0;
    let statsStarted = false;
    let welcomeInterval: NodeJS.Timeout;
    let statsInterval: NodeJS.Timeout;

    // Set initial state immediately to prevent flash
    setDisplayedText("\u00A0");
    setDisplayedStats("\u00A0");

    welcomeInterval = setInterval(() => {
      if (welcomeIndex <= welcomeText.length) {
        setDisplayedText(welcomeText.slice(0, welcomeIndex));
        welcomeIndex++;
      } else if (!statsStarted) {
        statsStarted = true;
        clearInterval(welcomeInterval);

        setTimeout(() => {
          statsInterval = setInterval(() => {
            if (statsIndex <= statsText.length) {
              setDisplayedStats(statsText.slice(0, statsIndex));
              statsIndex++;
            } else {
              clearInterval(statsInterval);
              sessionStorage.setItem("hasAnimated", "true");
            }
          }, 40);
        }, 500);
      }
    }, 100);

    // Cleanup function
    return () => {
      clearInterval(welcomeInterval);
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Try to show cached data first
        const cachedStats = localStorage.getItem("userStats");
        if (cachedStats) {
          const { name, count } = JSON.parse(cachedStats);
          const hasAnimated = sessionStorage.getItem("hasAnimated") === "true";
          if (!hasAnimated) {
            startTypingAnimation(name, count);
          } else {
            setDisplayedText(`Welcome back, ${name}.`);
            setDisplayedStats(
              `You've saved ${Math.round(
                count * 0.5
              )} hours running ${count} code checks with GovGoose.`
            );
          }
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setDisplayedText("Welcome to GovGoose");
          setDisplayedStats("Start your first code check today");
          return;
        }

        const { data: userData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { count } = await supabase
          .from("code_checks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const name =
          userData?.full_name || user.email?.split("@")[0] || "there";
        const codeChecks = count || 0;

        // Cache the values
        localStorage.setItem(
          "userStats",
          JSON.stringify({ name, count: codeChecks })
        );

        const hasAnimated = sessionStorage.getItem("hasAnimated") === "true";
        if (!hasAnimated) {
          startTypingAnimation(name, codeChecks);
        } else {
          setDisplayedText(`Welcome back, ${name}.`);
          setDisplayedStats(
            `You've saved ${Math.round(
              codeChecks * 0.5
            )} hours running ${codeChecks} code checks with GovGoose.`
          );
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setDisplayedText("Welcome to GovGoose");
        setDisplayedStats("Start your first code check today");
      }
    };

    fetchUserStats();
  }, [startTypingAnimation]);

  const handleAddressChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setAddress(value);
    setNoAddressFound(false);

    if (value.length > 2) {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US`
      );
      const data = await response.json();
      if (data.features.length > 0) {
        setAddressSuggestions(data.features.map((f: any) => f.place_name));
        if (data.features[0]) {
          const [lng, lat] = data.features[0].center;
          setCoordinates({ latitude: lat, longitude: lng });
        }
      } else {
        setAddressSuggestions([]);
        setNoAddressFound(true);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleAddressSelect = (suggestion: string) => {
    setAddress(suggestion);
    setAddressSuggestions([]);
    // Fetch coordinates for the selected address
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${suggestion}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.features && data.features[0]) {
          const [lng, lat] = data.features[0].center;
          setCoordinates({ latitude: lat, longitude: lng });
        }
      })
      .catch((error) => {
        console.error("Error fetching coordinates:", error);
        setUploadError("Failed to get location coordinates");
      });
  };

  const handleZoningRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zoningRegion && !zoningRegions.includes(zoningRegion)) {
      setZoningRegions([...zoningRegions, zoningRegion]);
      setZoningRegion("");
    }
  };

  const removeZoningRegion = (regionToRemove: string) => {
    setZoningRegions(
      zoningRegions.filter((region) => region !== regionToRemove)
    );
  };

  const handleMunicipalityFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      try {
        setIsSubmitting(true);
        const newFiles = Array.from(e.target.files);
        setMunicipalityFiles((prev) => [...prev, ...newFiles]);

        const uploadPromises = newFiles.map(async (file) => {
          try {
            const documentId = await uploadDocument(file);
            return documentId;
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
            return null;
          }
        });

        const fileIds = await Promise.all(uploadPromises);
        const validFileIds = fileIds.filter((id): id is string => id !== null);

        if (validFileIds.length > 0) {
          setMunicipalityFileIds((prev) => [...prev, ...validFileIds]);
        }
      } catch (error) {
        console.error("Error in handleMunicipalityFileChange:", error);
        setUploadError("Failed to upload one");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const removeMunicipalityFile = (fileToRemove: File, index: number) => {
    setMunicipalityFiles((files) =>
      files.filter((file) => file !== fileToRemove)
    );
    setMunicipalityFileIds((ids) => ids.filter((_, i) => i !== index));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectUploadError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user");

      if (
        !newProject.project_title.trim() ||
        !newProject.project_description.trim() ||
        !newProject.client_name.trim()
      ) {
        setProjectUploadError("All fields are required");
        return;
      }

      if (newProject.start_date && newProject.end_date) {
        const startDate = new Date(newProject.start_date);
        const endDate = new Date(newProject.end_date);
        if (endDate < startDate) {
          setProjectUploadError("End date cannot be before start date");
          return;
        }
      }

      const { error: insertError, data } = await supabase
        .from("projects")
        .insert({
          project_title: newProject.project_title.trim(),
          project_description: newProject.project_description.trim(),
          start_date: newProject.start_date
            ? new Date(newProject.start_date).toISOString()
            : null,
          end_date: newProject.end_date
            ? new Date(newProject.end_date).toISOString()
            : null,
          client_name: newProject.client_name.trim(),
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (insertError) throw insertError;

      if (!data || data.length === 0) {
        throw new Error("No data returned after project creation");
      }

      // Store in session storage that this is a new project
      sessionStorage.setItem("newProject", "true");
      router.push(`/projects/${data[0].project_id}`);
    } catch (error: any) {
      setProjectUploadError(error.message || "Failed to create project");
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("address", address);
      formData.append("zone", zoningRegions.join(","));

      const response = await fetch(
        "https://api.govgoose.com/upload_municipal_code",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUploadError(null);
        setShowDocumentUpload(false);
        // Optionally retry the submission
        handleSubmit();
      } else {
        // Make sure we're handling the error message properly
        setUploadError(
          typeof data.detail === "object"
            ? JSON.stringify(data.detail)
            : data.detail || "Failed to upload document"
        );
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    }
  };

  const handleSubmit = async () => {
    if (!address || !coordinates.latitude || !coordinates.longitude) {
      setUploadError("Please enter a valid address");
      return;
    }

    setIsLoading(true);
    try {
      // Check for demo cases first
      if (zoningRegions.some(region => region.toLowerCase().includes('demo'))) {
        setIsLoading(false);
        router.push('/code-check/101-orangethorpe-fullerton');
        return;
      }

      // First check if city documents exist
      const checkResponse = await fetch(
        "https://api.govgoose.com/check_city_documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: address,
            zone: zoningRegions.join(","),
          }),
        }
      );

      const checkData = await checkResponse.json();

      if (!checkData.exists_in_s3 || checkData.status === "missing_documents") {
        setUploadError(
          "This city's documents are not in our system yet. Please upload the municipal code documents."
        );
        setShowDocumentUpload(true);
        setIsLoading(false);
        return;
      }

      // Only proceed with Supabase upload if documents exist
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("User authentication required");
        return;
      }

      const { data: codeCheckData, error: codeCheckError } = await supabase
        .from("code_checks")
        .insert([
          {
            user_id: user.id,
            original_content: { content: "Original content" },
            edited_content: { content: "Edited content" },
            document_type: "city",
            address: address,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude.toString(),
            zoning_codes: zoningRegions,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (codeCheckError) {
        throw codeCheckError;
      }

      if (selectedFileId) {
        const { error: relationError } = await supabase
          .from("code_check_documents")
          .insert([
            {
              code_check_id: codeCheckData.id,
              document_id: selectedFileId,
            },
          ]);

        if (relationError) throw relationError;
      }

      if (municipalityFileIds.length > 0) {
        const relationPromises = municipalityFileIds.map((fileId) =>
          supabase.from("code_check_documents").insert([
            {
              code_check_id: codeCheckData.id,
              document_id: fileId,
            },
          ])
        );

        await Promise.all(relationPromises);
      }

      let queryParams = `address=${encodeURIComponent(address)}&latitude=${
        coordinates.latitude
      }&longitude=${coordinates.longitude}`;

      if (codeCheckData?.id) {
        queryParams += `&codeCheckId=${codeCheckData.id}`;
      }

      router.push(`/code-check?${queryParams}`);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setUploadError("Failed to process submission");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative border-b border-gray-200 overflow-hidden -mt-16">
      <div className="gradient-background absolute inset-0" />
      <div className="pt-32 pb-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 h-[88px]">
            <h1 className="text-4xl text-gray-900">
              <span className="font-bold">{displayedText || "\u00A0"}</span>
            </h1>
            <p className="text-xl mt-2 text-gray-700">
              {displayedStats || "\u00A0"}
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Project Creation Section - 60% */}
            <Card className="w-full lg:w-[60%] shadow-sm bg-[#1E293B] border-gray-700 flex flex-col">
              <CardHeader className="border-b border-gray-700 pb-6">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Rocket className="h-6 w-6" /> Create New Project
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Start a new project to organize your code checks
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col flex-1">
                <form
                  onSubmit={handleCreateProject}
                  className="flex flex-col flex-1"
                >
                  <div className="space-y-4 flex-1">
                    {projectUploadError && (
                      <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-md p-4">
                        <p className="text-sm">{projectUploadError}</p>
                      </div>
                    )}
                    <div>
                      <Label
                        htmlFor="project_title"
                        className="font-medium text-gray-200"
                      >
                        Project Title
                      </Label>
                      <Input
                        id="project_title"
                        value={newProject.project_title}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            project_title: e.target.value,
                          })
                        }
                        required
                        className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="project_description"
                        className="font-medium text-gray-200"
                      >
                        Project Description
                      </Label>
                      <Input
                        id="project_description"
                        value={newProject.project_description}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            project_description: e.target.value,
                          })
                        }
                        required
                        className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="start_date"
                          className="font-medium text-gray-200"
                        >
                          Start Date
                        </Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newProject.start_date}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              start_date: e.target.value,
                            })
                          }
                          required
                          className="bg-white/10 border-gray-700 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor="end_date"
                          className="font-medium text-gray-200"
                        >
                          End Date
                        </Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newProject.end_date}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              end_date: e.target.value,
                            })
                          }
                          required
                          className="bg-white/10 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="client_name"
                        className="font-medium text-gray-200"
                      >
                        Client Name
                      </Label>
                      <Input
                        id="client_name"
                        value={newProject.client_name}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            client_name: e.target.value,
                          })
                        }
                        required
                        className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-green-600 hover:bg-green-700 mt-6"
                  >
                    Create Project
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Code Check Section - 40% */}
            <Card className="w-full lg:w-[40%] shadow-sm border-gray-200 flex flex-col">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" /> Run New Code Check
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Run a standalone code check
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}
                  <div>
                    <Label
                      htmlFor="address"
                      className="font-medium text-gray-900"
                    >
                      Property Address
                    </Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        id="address"
                        value={address}
                        onChange={handleAddressChange}
                        placeholder="123 Main St, City, State, ZIP"
                        className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                      {addressSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-[#1E293B] border border-gray-700 rounded-md mt-1 shadow-lg">
                          {addressSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-gray-700/50 cursor-pointer text-gray-200"
                              onClick={() => {
                                handleAddressSelect(suggestion);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                      {noAddressFound && (
                        <div className="mt-2">
                          <p className="text-sm text-red-400">
                            Nothing is showing up for this address.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              (window.location.href =
                                "mailto:hello@govgoose.com")
                            }
                            className="mt-1 border-gray-700 text-gray-200 hover:bg-gray-700/50"
                          >
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="zoningRegion"
                      className="font-medium text-gray-900"
                    >
                      Add Zoning Region
                    </Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        type="text"
                        id="zoningRegion"
                        value={zoningRegion}
                        onChange={(e) => setZoningRegion(e.target.value)}
                        placeholder="Enter zoning region"
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                      <Button
                        type="button"
                        onClick={handleZoningRegionSubmit}
                        variant="secondary"
                        className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                      >
                        Add
                      </Button>
                    </div>
                    {zoningRegions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {zoningRegions.map((region, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-900"
                          >
                            <span>{region}</span>
                            <button
                              onClick={() => removeZoningRegion(region)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {showDocumentUpload && (
                    <div className="mt-6 p-6 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Upload Municipal Code
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Please upload the municipal code PDF document for your
                          city
                        </p>
                        <div className="relative">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleDocumentUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            id="municipal-code-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="relative z-10"
                            onClick={() => {
                              document
                                .getElementById("municipal-code-upload")
                                ?.click();
                            }}
                          >
                            {/* <Upload className="w-4 h-4 mr-2" /> */}
                            Choose PDF File
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className={cn(
                    "w-full h-11 bg-green-600 hover:bg-green-700 text-white mt-6",
                    isSubmitting ? "bg-gray-400 cursor-not-allowed" : ""
                  )}
                  disabled={isSubmitting || !address}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    "Create Code Check"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
