"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Upload, X, FileText, Info, Save, Edit } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Map from "@mapbox/react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { uploadDocument } from "./document-upload"; // Import the uploadDocument function

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const Hero: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [noAddressFound, setNoAddressFound] = useState(false);
  const [zoningRegions, setZoningRegions] = useState<string[]>([]);
  const [zoningRegion, setZoningRegion] = useState("");
  const [buildingCodes, setBuildingCodes] = useState<string[]>([]);
  const [buildingCode, setBuildingCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [municipalityFiles, setMunicipalityFiles] = useState<File[]>([]);
  const [municipalityFileIds, setMunicipalityFileIds] = useState<string[]>([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const municipalityFileInputRef = useRef<HTMLInputElement>(null);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createCodeCheck = async (documentId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found");
        setUploadError("User authentication required");
        return null;
      }

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error("No access token available");
      }

      // Create the code check
      const { data: codeCheckData, error: codeCheckError } = await supabase
        .from("code_checks")
        .insert([
          {
            user_id: user.id,
            document_type: "user",
            address: address,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude.toString(),
            zoning_codes: zoningRegions,
            original_content: { content: "Original content" },
            edited_content: { content: "Edited content" },
            status: "pending",
          },
        ])
        .select()
        .single();

      if (codeCheckError) throw codeCheckError;

      // Create the relationship in code_check_documents
      const { error: relationError } = await supabase
        .from("code_check_documents")
        .insert([
          {
            code_check_id: codeCheckData.id,
            document_id: documentId,
          },
        ]);

      if (relationError) throw relationError;

      return codeCheckData;
    } catch (err) {
      console.error("Unexpected error creating code check:", err);
      setUploadError("Unexpected error creating code check");
      return null;
    }
  };

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
      } else {
        setAddressSuggestions([]);
        setNoAddressFound(true);
      }
    } else {
      setAddressSuggestions([]);
    }
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

  const handleBuildingCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buildingCode && !buildingCodes.includes(buildingCode)) {
      setBuildingCodes([...buildingCodes, buildingCode]);
      setBuildingCode("");
    }
  };

  const removeBuildingCode = (codeToRemove: string) => {
    setBuildingCodes(buildingCodes.filter((code) => code !== codeToRemove));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Call the uploadDocument function from document-upload
      try {
        const fileId = await uploadDocument(file); // Pass the file to uploadDocument
        if (fileId) {
          setSelectedFileId(fileId);
          await createCodeCheck(fileId);
        }
      } catch (error) {
        // Type assertion to handle the error as a string
        const errorMessage =
          (error as Error).message || "An unknown error occurred.";
        setUploadError(errorMessage);
      }
    }
  };

  const handleMunicipalityFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      try {
        setIsLoading(true);
        const newFiles = Array.from(e.target.files);
        setMunicipalityFiles((prev) => [...prev, ...newFiles]);

        // Upload each file and get document IDs
        const uploadPromises = newFiles.map(async (file) => {
          try {
            const documentId = await uploadDocument(file);
            console.log("File uploaded with document ID:", documentId);
            return documentId;
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
            return null;
          }
        });

        const fileIds = await Promise.all(uploadPromises);
        const validFileIds = fileIds.filter((id): id is string => id !== null);

        if (validFileIds.length > 0) {
          console.log("Valid file IDs:", validFileIds);
          setMunicipalityFileIds((prev) => [...prev, ...validFileIds]);
        }
      } catch (error) {
        console.error("Error in handleMunicipalityFileChange:", error);
        setUploadError("Failed to upload one or more files");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeMunicipalityFile = (fileToRemove: File, index: number) => {
    setMunicipalityFiles((files) =>
      files.filter((file) => file !== fileToRemove)
    );
    setMunicipalityFileIds((ids) => ids.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    setMunicipalityFiles((prev) => [...prev, ...files]);

    const uploadPromises = files.map((file) => uploadDocument(file));
    const fileIds = await Promise.all(uploadPromises);
    const validFileIds = fileIds.filter((id): id is string => id !== null);

    const codeCheckPromises = validFileIds.map((id) => createCodeCheck(id));
    await Promise.all(codeCheckPromises);

    setMunicipalityFileIds((prev) => [...prev, ...validFileIds]);
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:hello@govgoose.com";
  };

  const handleSubmit = async () => {
    if (!address || !coordinates.latitude || !coordinates.longitude) {
      setUploadError("Please enter a valid address");
      return;
    }

    setIsLoading(true);
    try {
      // First check if we have city documents
      const checkResponse = await fetch(
        "https://api.govgoose.com/check_city_documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: address,
            zone: zoningRegions.join(","), // Assuming we want to send all zoning regions
          }),
        }
      );

      const checkData = await checkResponse.json();

      if (!checkData.exists_in_s3) {
        setUploadError(
          "No municipal documents found for this city. Please upload the required documents."
        );
        // You might want to show a UI element to guide users to upload documents
        return;
      }

      // Continue with existing submission logic
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("User authentication required");
        return;
      }

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error("No access token available");
      }

      // First create the code check
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

      // Then create relationships in code_check_documents if we have any documents
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

      // Add municipality files if any
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

  useEffect(() => {
    const getCoordinates = async () => {
      if (address) {
        console.log("Fetching coordinates for:", address);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        console.log("Geocoding response:", data);

        if (data.features && data.features[0]) {
          const [lng, lat] = data.features[0].center;
          console.log("Setting coordinates:", { lat, lng });
          setCoordinates({ latitude: lat, longitude: lng });
        }
      }
    };

    getCoordinates();
  }, [address]);

  return (
    <section className="bg-white border-b border-gray-200 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <Card className="w-full lg:w-2/3 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                🔮 Run New AI Code Check
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter an address to start a new code check
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{uploadError}</p>
                    {uploadError.includes("upload") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          municipalityFileInputRef.current?.click()
                        }
                      >
                        Upload Municipal Documents
                      </Button>
                    )}
                  </div>
                )}
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    id="address"
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="123 Main St, City, State, ZIP"
                    className="pl-10"
                  />
                  {addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setAddress(suggestion);
                            setAddressSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {noAddressFound && (
                    <div className="mt-2">
                      <p className="text-sm text-red-500">
                        Nothing is showing up for this address.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleContactSupport}
                        className="mt-1"
                      >
                        Contact Support
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="zoningRegion"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Add Zoning Region
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="text"
                      id="zoningRegion"
                      value={zoningRegion}
                      onChange={(e) => setZoningRegion(e.target.value)}
                      placeholder="Enter zoning region"
                    />
                    <Button type="button" onClick={handleZoningRegionSubmit}>
                      Add
                    </Button>
                  </div>
                  {zoningRegions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {zoningRegions.map((region, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"
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

                {buildingCodes.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Added Building Codes:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {buildingCodes.map((code, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"
                        >
                          <span>{code}</span>
                          <button
                            onClick={() => removeBuildingCode(code)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="municipalityDocs"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Upload Municipality Documents (Optional)
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600">
                              We are constantly growing our catalog of municipal
                              data, but if there is munipal data you're looking
                              for that we don't have, you can add it here for
                              your analysis.
                            </p>
                            <Button
                              variant="link"
                              className="text-sm p-0 h-auto mt-2"
                              onClick={() =>
                                (window.location.href =
                                  "https://app.govgoose.com/catalog")
                              }
                            >
                              See our catalog
                            </Button>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div
                    className={`mt-1 p-4 border-2 border-dashed rounded-lg ${
                      municipalityFiles?.length > 0
                        ? "border-green-300"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-600">
                        Drag and drop PDF files here, or click to select
                      </p>
                      <Input
                        type="file"
                        id="municipalityDocs"
                        accept=".pdf"
                        onChange={handleMunicipalityFileChange}
                        className="hidden"
                        ref={municipalityFileInputRef}
                        multiple
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          municipalityFileInputRef.current?.click()
                        }
                        className="mt-2"
                      >
                        Choose Files
                      </Button>
                    </div>
                    {municipalityFiles && municipalityFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {municipalityFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span className="text-sm text-gray-600">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                removeMunicipalityFile(file, index)
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Run Code Check"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full lg:w-1/3 shadow-sm bg-gray-100">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-700">
                Upload Existing Check
              </CardTitle>
              <CardDescription className="text-gray-500">
                Drag and drop or select a file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Drag and drop your file here, or click to select
                </p>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button className="w-full mt-4" variant="secondary">
                Store Code Check
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
