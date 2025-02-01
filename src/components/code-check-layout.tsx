import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  Mail,
  Check,
  X,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Separator } from "@/components/ui/separator";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Citation {
  section?: string;
  page?: string;
  text: string;
  score?: number;
}

interface Document {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

interface PDFContent {
  title: string;
  lines: string[];
  totalPages: number;
  pdfInfo: {
    Title?: string;
    Author?: string;
    CreationDate?: string;
    [key: string]: any;
  };
}

interface Analysis {
  analysis: {
    structured_response: {
      propertyInfo: {
        propertyId: string;
        siteAddress: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
        };
      };
      cityInformation: {
        jurisdiction: string;
        contact: {
          name: string;
          phone: string;
          email: string;
        };
        codeLink: string;
        zoning: {
          class: string;
          mspOrPud: string;
          mspDocumentProvided: string;
        };
      };
      permitProcess: {
        timeline: {
          reviewPeriod: string;
          validityPeriod: string;
        };
        application: {
          onlinePortal: string;
          permitExpiration: string;
          expeditedProcess: string;
          varianceAllowed: string;
          varianceNotes: string;
          reviewBoardRequired: string;
          landlordApprovalNeeded: string;
          notarizedDocsRequired: string;
          preliminaryReviewsOffered: string;
          otherDepartmentsNeeded: string;
          finalInspectionRequired: string;
        };
      };
      signageRestrictions: {
        buildingSignage: {
          squareFootage: {
            formula: string;
            isAggregate: string;
            calculationMethod: string;
            backerPanelsIncluded: string;
            basedonElevation: string;
          };
          heightRestrictions: string;
          letterHeightRestrictions: string;
          lengthRestrictions: string;
          engineerDrawingsRequired: string;
        };
        groundSignage: {
          squareFootage: string;
          heightRestrictions: string;
          lengthRestrictions: string;
          setbackRequirements: string;
          siteTriangle: string;
          engineerDrawingsRequired: string;
        };
        canopyBlade: {
          squareFootage: string;
          projectionRestrictions: string;
          clearanceRestrictions: string;
          illuminationAllowed: string;
          engineerDrawingsRequired: string;
        };
        awning: {
          squareFootageRestrictions: string;
          copyAllowed: string;
          projectionRestrictions: string;
          sizeRestrictions: string;
          placementRestrictions: string;
          colorRestrictions: string;
          engineerDrawingsRequired: string;
        };
        windowDoorVinyl: {
          permitsRequired: string;
          squareFootageRestrictions: string;
          countsTowardsPrimarySF: string;
          surfaceRestrictions: string;
          transomRestrictions: string;
        };
        temporarySignage: {
          permitsRequired: string;
          squareFootageRestrictions: string;
          specialEventRestrictions: string;
          displayDuration: string;
          mountingRestrictions: string;
        };
        interiorSignage: {
          setbackRestrictions: string;
          illuminationAllowed: string;
          setbackRequirements: string;
          windowVisibilityRules: string;
        };
        brightLights: {
          allowed: string;
          permitRequired: string;
          permitType: string;
        };
        digitalDisplays: {
          allowed: string;
          permitRequired: string;
          countsTowardsSquareFootage: string;
          permitType: string;
        };
      };
      verification?: {
        cityVerified: string;
        verificationMethod: string;
        verificationBy: string;
      };
    };
    raw_responses: Array<RawResponse>;
  };
}

interface DocumentContent {
  title: string;
  text: string;
}

// Add new interface for PDF response
interface PDFResponse {
  lines: string[];
  page_count: number;
}

// Add to existing interfaces
interface UnknownElement {
  question: string;
  context: string;
}

// Add this component for boolean indicators
const BooleanIndicator: React.FC<{ value: boolean; label?: string }> = ({
  value,
  label,
}) => (
  <div className="flex items-center gap-2">
    {value ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-red-500" />
    )}
    {label && <span>{label}</span>}
  </div>
);

// Add these missing interfaces
interface SignageInfo {
  allowed: boolean;
  restrictions: string[];
  maxSize: string;
  maxCoverage?: string;
  duration?: string;
}

interface RestrictionInfo {
  modifications: string[];
  restrictions: string[];
}

interface LightingInfo {
  allowedTypes: string[];
  restrictions: string[];
  brightness: string;
  hours: string;
}

// Add interface near the top with other interfaces
interface CityContact {
  city_name: string;
  contact_name: string;
  contact_email: string;
}

// Add this interface for S3 documents
interface S3Document {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

// First, update the interface for the raw responses
interface DetailedAnswer {
  explanation?: string;
  applicability?: string;
  conflicts?: string;
}

interface RawResponse {
  question: string;
  answer: {
    short_answer: string;
    detailed_answer: string;
  };
  citations?: Citation[];
}

// Add this helper function
const cleanCitationText = (text: string): string => {
  return (
    text
      // Replace multiple newlines with a single newline
      .replace(/\n\s*\n/g, "\n")
      // Remove newlines that don't follow a period, colon, or numbered item
      .replace(/(?<![.:]|\d\.)\n/g, " ")
      // Trim any remaining whitespace
      .trim()
  );
};

// Update the CitationDisplay to use the cleaned text
const CitationDisplay = ({ citation }: { citation: Citation }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
    {/* Header with source info */}
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="bg-blue-50 p-2 rounded-full">
          <BookOpen className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{citation.section}</h4>
          {citation.page && (
            <span className="text-sm text-gray-500">Page {citation.page}</span>
          )}
        </div>
      </div>
      {citation.score && (
        <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs font-medium text-green-700">
            {(citation.score * 100).toFixed(1)}% Match
          </span>
        </div>
      )}
    </div>

    {/* Citation content with cleaned text */}
    <div className="space-y-2 text-gray-600">
      {cleanCitationText(citation.text)
        .split("\n")
        .map((line, idx) => {
          if (!line.trim()) return null;

          const isHeading = line.toUpperCase() === line && line.length > 3;
          const isNumberedItem = /^\d+\.\s/.test(line);

          return (
            <div
              key={idx}
              className={`
              ${
                isHeading ? "font-semibold text-gray-800 text-sm uppercase" : ""
              }
              ${isNumberedItem ? "pl-4" : ""}
              text-sm leading-relaxed
            `}
            >
              {line}
            </div>
          );
        })}
    </div>
  </div>
);

// Add a new component for the answer card
const AnswerCard = ({ response }: { response: RawResponse }) => {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Question */}
          <h3 className="text-lg font-semibold">{response.question}</h3>

          {/* Answer */}
          <div className="prose max-w-none">
            <p className="text-gray-700">{response.answer.short_answer}</p>
          </div>

          {/* Citations Section */}
          {response.citations && response.citations.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {showCitations ? "Hide Citations" : "Show Citations"}
                  <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {response.citations.length}
                  </span>
                </Button>

                {/* Tooltip for quick preview */}
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <AlertCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50"
                        side="top"
                        align="start"
                        sideOffset={5}
                      >
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-2">Source References:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {response.citations.map((citation, idx) => (
                              <li key={idx}>
                                {citation.section}{" "}
                                {citation.page ? `(Page ${citation.page})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Tooltip.Arrow className="fill-white" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              {/* Collapsible Citations */}
              {showCitations && (
                <div className="mt-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
                  {response.citations.map((citation, idx) => (
                    <CitationDisplay key={idx} citation={citation} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add this interface near the top with other interfaces
interface CustomQuestion {
  id: string;
  text: string;
}

interface CodeCheckLayoutProps {
  codeCheckId: string;
}

// Add this helper function at the top of the file, before the CodeCheckLayout component
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    console.error("Invalid URL:", url);
    throw new Error(`Invalid URL: ${url}`);
  }

  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} - Fetching ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: window.location.origin,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body:`,
          errorText
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, {
        error: error.message,
        stack: error.stack,
        url,
        method: options.method,
        headers: options.headers,
      });

      if (i === retries - 1) {
        console.error("All retry attempts failed:", {
          url,
          totalAttempts: retries,
          lastError: error.message,
        });
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

const CodeCheckLayout: React.FC<CodeCheckLayoutProps> = ({ codeCheckId }) => {
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pdfContents, setPdfContents] = useState<DocumentContent[]>([]);
  const [pdfResults, setPdfResults] = useState<Record<string, PDFResponse>>({});
  const [loadingPdfs, setLoadingPdfs] = useState<Record<string, boolean>>({});
  const [unknownElements, setUnknownElements] = useState<UnknownElement[]>([]);
  const [cityContact, setCityContact] = useState<CityContact | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const searchParams = useSearchParams();
  const address = searchParams?.get("address") ?? null;
  const latitude = searchParams?.get("latitude") ?? null;
  const longitude = searchParams?.get("longitude") ?? null;
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [addingToProject, setAddingToProject] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [zoningCodes, setZoningCodes] = useState<string[]>([]);

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this effect for fetching projects with better error handling
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);

        // First check if we have a valid session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError.message);
          return;
        }

        if (!sessionData.session) {
          console.log("No active session found");
          return;
        }

        const { data, error: projectsError } = await supabase
          .from("projects")
          .select("project_id, project_title")
          .order("created_at", { ascending: false });

        if (projectsError) {
          console.error("Supabase projects error:", projectsError.message);
          return;
        }

        // Map the data to match the expected interface
        const formattedProjects = (data || []).map((project) => ({
          id: project.project_id,
          name: project.project_title,
        }));

        setProjects(formattedProjects);
      } catch (error) {
        // Properly type and handle the error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching projects:", errorMessage);

        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Add function to handle adding to project
  const handleAddToProject = async () => {
    if (!selectedProject || !codeCheckId) return;

    try {
      setAddingToProject(true);

      const { error } = await supabase.from("project_code_checks").insert({
        project_id: selectedProject,
        code_check_id: codeCheckId,
      });

      if (error) throw error;

      // Update current project ID
      setCurrentProjectId(selectedProject);
      setSelectedProject(null);
      setSearchTerm("");

      // Show success toast or notification here
    } catch (error) {
      console.error("Error adding to project:", error);
      // Show error toast or notification here
    } finally {
      setAddingToProject(false);
    }
  };

  // Update the fetchDocuments function
  const fetchDocuments = async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log("Fetching documents for address:", address);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://api.govgoose.com";
      console.log("Using API URL:", API_URL);

      if (!API_URL) {
        throw new Error("API_URL is not configured");
      }

      const checkUrl = `${API_URL}/check_city_documents`;
      console.log("Making request to:", checkUrl);

      const checkResponse = await fetchWithRetry(checkUrl, {
        method: "POST",
        body: JSON.stringify({
          address: decodeURIComponent(address),
          zone: "",
        }),
      });

      const checkData = await checkResponse.json();
      console.log("Check city documents response:", checkData);

      if (!checkData.exists_in_s3) {
        console.log("No documents found in S3");
        setDocuments([]);
        return;
      }

      const listUrl = `${API_URL}/list_s3_documents`;
      console.log("Making request to:", listUrl);

      const listResponse = await fetchWithRetry(listUrl, {
        method: "POST",
        body: JSON.stringify({
          path: checkData.document_path,
        }),
      });

      const listData = await listResponse.json();
      console.log("S3 documents response:", listData);

      if (listData.documents) {
        const formattedDocs = listData.documents.map((doc: any) => ({
          id: doc.key,
          title: doc.key.split("/").pop(),
          file_url: doc.url,
          created_at: doc.last_modified,
        }));
        console.log("Formatted documents:", formattedDocs);
        setDocuments(formattedDocs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Detailed error:", {
        message: errorMessage,
        API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.govgoose.com",
        address: address,
        userAgent: window.navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [address]);

  useEffect(() => {
    const loadExistingAnalysis = async () => {
      if (!codeCheckId) {
        console.log("No code check ID provided");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("code_checks")
          .select("code_check_details")
          .eq("id", codeCheckId)
          .single();

        if (error) {
          console.error("Error loading analysis:", error);
          return;
        }

        if (data?.code_check_details) {
          try {
            const parsedAnalysis = JSON.parse(data.code_check_details);
            setAnalysis({ analysis: parsedAnalysis });
          } catch (parseError) {
            console.error("Error parsing analysis:", parseError);
            setAnalysis({ analysis: data.code_check_details });
          }
        }
      } catch (error) {
        console.error("Error loading existing analysis:", error);
      }
    };

    loadExistingAnalysis();
  }, [codeCheckId]);
  console.log(address);
  useEffect(() => {
    const fetchCityContact = async () => {
      if (!address) return;

      try {
        // Extract city from "Denver, Colorado, United States" format
        const cityName = address.split(",")[0]?.trim();
        console.log("Searching for city:", cityName); // Debug log

        const { data, error } = await supabase
          .from("catalog")
          .select("city_name, contact_name, contact_email")
          .eq("city_name", cityName)
          .single();

        // Only set the contact if we found a match
        if (!error && data) {
          console.log("Found city contact:", data);
          setCityContact(data);
        } else {
          // City not found - this is okay, just set contact to null
          setCityContact(null);
        }
      } catch (error) {
        // Silently handle the error and ensure contact is null
        setCityContact(null);
      }
    };

    fetchCityContact();
  }, [address]);

  // Add function to extract unknown elements from analysis
  const extractUnknownElements = (analysisText: string): UnknownElement[] => {
    const elements: UnknownElement[] = [];

    // Look for patterns indicating uncertainty in the analysis
    const sentences = analysisText.split(/[.!?]+/);

    sentences.forEach((sentence) => {
      const uncertaintyPatterns = [
        "unclear",
        "unknown",
        "not specified",
        "needs clarification",
        "to be determined",
        "tbd",
        "missing information",
        "cannot determine",
        "not clear",
        "uncertain",
        "ambiguous",
        "requires verification",
        "need more information",
      ];

      const lowercaseSentence = sentence.toLowerCase().trim();
      if (
        uncertaintyPatterns.some((pattern) =>
          lowercaseSentence.includes(pattern)
        )
      ) {
        elements.push({
          question: sentence.trim(),
          context: "From code check analysis",
        });
      }
    });

    return elements;
  };

  const handleAIAnalysis = async () => {
    const aiResponse = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "Tell me about this code check.",
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
    }

    return await aiResponse.json();
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestion.trim()) return;

    setCustomQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: newQuestion.trim(),
      },
    ]);
    setNewQuestion("");
  };

  const handleRemoveCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAnalyzeAllDocuments = async () => {
    if (!address) return;

    setAnalyzing(true);
    try {
      // Combine default questions with custom questions
      const questions = [
        "Does the code for the site regulate the maximum number of ALL signs on property? If so, what is the total amount.",
        "Is a maximum aggregate square footage for signage given in the code? If so, what is this maximum value? This value could be a square footage and/or percentage. Begin by replying with yes, no, or no information. Make sure to carefully read any data stored as a table.",
        "Does the code require a permit for a face change (also may be referred to as a sign reface, panel replacement, or non-structural sign alteration)? It is helpful to refer to sign alterations, sign maintenance, and sign replacement to uncover information about this.",
        "Is there a requirement that signs have an opaque background such that only copy can illuminate? If so, which sign types? Begin by replying with yes, no, or not enough information",
        "Does code regulate how many total wall signs are allowed? If so, clarify how many wall signs are allowed. Begin your response by saying yes or no with a period. After this, include the relevant number.",
        "Are there any restrictions on channel letter or cabinet height? Begin your response by saying yes, no, or not enough data with a period.",
        "Is there a maximum square footage allowed for signs? Begin your response by saying yes or no with a period and clarify immediately after if there exist constraints. If there is a specific maximum, include that next.",
        "Can signs project over the roofline or parapet? If so, mention the limitations. Begin your response by saying yes or no with a period and clarify immediately after if there exist constraints.",
        "Is there a maximum projection permitted for signs? Begin your response by saying yes or no with a period.",
        "How is the overall square footage allowance for wall signs determined by the code? Be sure to structure this output in a clear and formulaic way such that it can be used to calculate the amount. It is imperative you read tables carefully and appropriately output results.",
        "How is the overall square footage allowance for wall signs determined by the code? Provide an example calculation that is accurate. It is imperative you read tables carefully and appropriately output results",
        "Using the measurement limitations from the municipal code; if applicable, briefly provide examples of how sign areas can be measured.",
        "Are illuminated signs permitted? Provide the restrictions for illuminated signs. Begin your response by saying yes or no with a period.",
        "Provide a description of any additional restrictions of wall signs.",
        "Does the code place a limit on the number of pole signs permitted? Begin your response by saying yes or no with a period. Provide the number in your response.",
        "For pylon or pole signs,  does code regulate the separation distance between freestanding signs? If so, what are these regulations? Begin your response by saying yes or no with a period.",
        "For pylon or pole signs, what is the square footage allowed? Begin with a number and continue by replying with the calculations for this. Note that the result may be that it is not permitted, in which case it is 0.",
        "For pylon or pole signs, is there what is the total overall height allowed? Begin with a number and if calculations are involved provide an explanation of these calculations.",
        "For pylon or pole signs, is a pole cover required for the pole part of the sign? Begin your response by saying yes or no with a period.",
        "For pylon or pole signs, is an address required to be present on the sign? Begin your response by saying yes or no with a period.",
        "For pylon or pole signs, are there any restrictions on the letter height? Begin your response by saying yes or no with a period and include the specific restriction.",
        "For pylon or pole signs, how is the overall square footage determined? Provide exactly as the code reads.",
        "For pylon or pole signs, calculate the allowable square footage with an example. Use the information from the text about pylons and pole sign requirements to calculate.",
        "For pylon or pole signs, explain how the code measures the sign area.",
        "For pylon or pole signs, what is the required set back from the property line, ROW, or back of the curb?",
        "For pylon or pole signs, describe the visibility triangle requirements (also called a sign triangle). Make mention of relevant measures of dimension, obstruction limits, and sign placement.",
        "For pylon or pole signs, may the sign be illuminated? If it can be illuminated, what restrictions exist on the illumination? Begin your response by saying yes or no with a period.",
        "For pylon or pole signs, if there is anything unusual about the pylon sign requirements for this municipality make a note of it. Otherwise, state no notes.",
        "For pylon or pole signs, can existing freestanding sings be refaced? If refacing does occur, is a permit required? Begin your response by saying yes or no with a period.",
        "For monument signs, can existing monument signs be refaced? Begin your response by saying yes or no with a period. Make mention if this wasn't stipulated in the code",
        "For monument signs, Does code regulate the number of monument signs allowed?   Begin your response by saying yes or no with a period.  Make mention if this wasn't stipulated in the code",
        "For monument signs, Does code regulate the separation distance between freestanding signs? Begin your response by saying yes or no with a period.  Make mention if this wasn't stipulated in the code",
        "For monument signs, what is the Square footage allowed? Begin your response with a relevant value.  Make mention if this wasn't stipulated in the code",
        "For monument signs, what is the Total Overall Height Allowed? Begin your response with a relevant value.  Make mention if this wasn't stipulated in the code",
        "For monument signs, are there Any special requirements for monument base? Begin your response with a relevant value.  Make mention if this wasn't stipulated in the code",
        "For monument signs, is an Address on sign required? Begin your response by saying yes or no with a period.  Make mention if this wasn't stipulated in the code",
        "For monument signs, are there Any restrictions to letter height? Begin your response by saying yes or no with a period. If yes, mention a named value  Make mention if this wasn't stipulated in the code",
        "For monument signs, what accompanying landscape requirements exist? Make mention if this wasn't stipulated in the code.",
        "For monument signs, How is the overall square footage allowance for monument sign is determined? If no calculations or numbers are given, state this.",
        "For monument signs, use the formula of maximum monument size allowance and provide a detailed example of calculating allowable square footage.",
        "For monument signs, state how, if at all, the code dictates how to measure the sign area.",
        "For monument signs, what is the Required setback from property line / ROW/ back of Curb?",
        "For monument signs,  describe the visibility triangle requirements (also called a sign triangle). Make mention of relevant measures of dimension, obstruction limits, and sign placement.",
        "For monument signs, may the sign be illuminated? If it can be illuminated, what restrictions exist on the illumination? Begin your response by saying yes or no with a period.",
        "For monument signs, is there anything abnormal about the municipal code here?",
        "For window signage, are they permitted? If so, what stipulations, including permitting requirements, exist?",
        "For window signage, how is square footage calculated? This could be, for example, a maximum square footage allowance or a percentage of window.",
        "For window signage, may signage be illuminated? Begin your sentence with a yes or no and a period.",
        "For window signage, If vinyl has no shapes, logo, or text & is a solid color is it considered signage? For example, frosted vinyl? If unspecified or unable to confirm, state as much.",
        "For window signage, are permits required? Begin with a yes, no, or unknown and a period.",
        "For temporary signage, are banners allowed? Begin with a yes, no, or unknown and a period.",
        "For temporary signage, what is the allowable square footage? Begin with a yes, no, or unknown and a period.",
        "For temporary signage, what is the allowable height? Begin with a yes, no, or unknown and a period.",
        "For temporary signage, how long can a sign be posted for? ",
        "For building code information, what is the adopted building code and year? Begin with a yes, no, or unknown and a period.",
        "For electrical code information, what is the adopted electrical code and year? Begin with a yes, no, or unknown and a period.",
        "For building and electrical code information, are there requirements around wind speed, exposure, snow, ice load, or anything else that could be relevant? Begin with a yes, no, or unknown and a period.",
        "For building and electrical code information, is there anything particular of note?",
        "Verify if an engineer's seal or stamp is required for wall signs. Include any minimum square footage. Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for freestanding signs. Include any minimum square footage. Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for awnings or metal canopies. Include any minimum square footage. Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for blade signs or flag mounted. Include any minimum square footage. Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for sign cabinet framings? Fort he footing or pier? Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for replacing a sign cabinet with an existing support? Is this the same or less in sq footage required for existing support?",
        "Will jurisdiction take a scanned copy of the sealed engineering? Begin with a yes, no, or unknown and a period.",
        "Verify if an engineer's seal or stamp is required for does the jurisdiction require a digital or electronic stamp? Begin with a yes, no, or unknown and a period.",
        "For electrical requirements, particularly as they relate to signage, is secondary electrical hook up included w/sign permit? Begin with a yes, no, or unknown and a period.",
        "For electrical requirements, particularly as they relate to signage, Do ETL labels need to be visible? Begin with a yes, no, or unknown and a period.",
        "For electrical requirements, particularly as they relate to signage, will the jurisdiction accept ETL as a National recognized testing laboratory? Begin with a yes, no, or unknown and a period.",
        "For electrical requirements, particularly as they relate to signage, does the disconnect switch need to be visible? Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for a rough electrical inspection or anything similar. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for a final electrical inspection .Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for footing for signage projects. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for structural or building. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for a final structural or building assessment. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for fire and with the fire department. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for landscaping. Begin with a yes, no, or unknown and a period.",
        "What are the inspection requirements for zoning. Begin with a yes, no, or unknown and a period.",
        "If there is any other type of required inspection for a signage project, make note of it.",

        "As it relates to general permitting practices found in the code, Can the sign permit be issued before the bldg. permit?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, Certificate of Use, Occupancy or Appropriateness required before permit submittal?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, what is the number of drawing sets required?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, what is the expected Permit timeframe?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, is there a mention of Permit number or tag on sign required?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, is a tenant or owner business license approval required prior to sign permits being submitted?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, how can we submit the permit package? This could be in-person, online, or by mail. It isn't always explicit.  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, Link to electronic / portal submittal:  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, How long is the permit valid?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, Property owner signature required?  Begin with a yes, no, or unknown and a period.",
        "As it relates to general permitting practices found in the code, Letter of authorization ?  Begin with a yes, no, or unknown and a period.",

        "Make note of the permit fee structure. If you are unable to find a permit fee structure, make a note of this.",
        "To submit a permit, make clear mention of all paperwork required for submittal.",
        "To submit a permit, make clear mention of all artwork, sign plans, and other related details required for submittal.",

        ...customQuestions.map((q) => q.text),
      ];

      const response = await fetch(
        "https://api.govgoose.com/pinecone-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: decodeURIComponent(address),
            zone: zoningCodes.join(", "),
            questions: questions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to analyze documents: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Assistant analysis:", data);

      // Format the analysis result to match the Analysis interface
      const analysisResult: Analysis = {
        analysis: {
          structured_response: {
            propertyInfo: {
              propertyId: "",
              siteAddress: {
                street: address
                  ? decodeURIComponent(address).split(",")[0]
                  : "",
                city: "",
                state: "",
                zipCode: "",
              },
            },
            cityInformation: {
              jurisdiction: extractJurisdiction(data),
              contact: extractContactInfo(data),
              codeLink: "",
              zoning: {
                class: "",
                mspOrPud: "",
                mspDocumentProvided: "",
              },
            },
            permitProcess: {
              timeline: {
                reviewPeriod: "",
                validityPeriod: "",
              },
              application: {
                onlinePortal: "",
                permitExpiration: "",
                expeditedProcess: "",
                varianceAllowed: "",
                varianceNotes: "",
                reviewBoardRequired: "",
                landlordApprovalNeeded: "",
                notarizedDocsRequired: "",
                preliminaryReviewsOffered: "",
                otherDepartmentsNeeded: "",
                finalInspectionRequired: "",
              },
            },
            signageRestrictions: {
              buildingSignage: {
                squareFootage: {
                  formula: "",
                  isAggregate: "",
                  calculationMethod: "",
                  backerPanelsIncluded: "",
                  basedonElevation: "",
                },
                heightRestrictions: "",
                letterHeightRestrictions: "",
                lengthRestrictions: "",
                engineerDrawingsRequired: "",
              },
              groundSignage: {
                squareFootage: "",
                heightRestrictions: "",
                lengthRestrictions: "",
                setbackRequirements: "",
                siteTriangle: "",
                engineerDrawingsRequired: "",
              },
              canopyBlade: {
                squareFootage: "",
                projectionRestrictions: "",
                clearanceRestrictions: "",
                illuminationAllowed: "",
                engineerDrawingsRequired: "",
              },
              awning: {
                squareFootageRestrictions: "",
                copyAllowed: "",
                projectionRestrictions: "",
                sizeRestrictions: "",
                placementRestrictions: "",
                colorRestrictions: "",
                engineerDrawingsRequired: "",
              },
              windowDoorVinyl: {
                permitsRequired: "",
                squareFootageRestrictions: "",
                countsTowardsPrimarySF: "",
                surfaceRestrictions: "",
                transomRestrictions: "",
              },
              temporarySignage: {
                permitsRequired: "",
                squareFootageRestrictions: "",
                specialEventRestrictions: "",
                displayDuration: "",
                mountingRestrictions: "",
              },
              interiorSignage: {
                setbackRestrictions: "",
                illuminationAllowed: "",
                setbackRequirements: "",
                windowVisibilityRules: "",
              },
              brightLights: {
                allowed: "",
                permitRequired: "",
                permitType: "",
              },
              digitalDisplays: {
                allowed: "",
                permitRequired: "",
                countsTowardsSquareFootage: "",
                permitType: "",
              },
            },
            verification: {
              cityVerified: "",
              verificationMethod: "",
              verificationBy: "",
            },
          },
          raw_responses: data.answers.map((answer: any) => ({
            question: answer.question,
            answer: {
              short_answer: answer.answer,
              detailed_answer: answer.answer,
            },
            citations: answer.citations.map((citation: any) => ({
              text: citation.text,
              section: citation.file,
              page: citation.pages ? citation.pages[0].toString() : undefined,
              score: citation.score,
            })),
          })),
        },
      };

      setAnalysis(analysisResult);

      // Save the analysis to the database if needed
      if (codeCheckId) {
        const { error: updateError } = await supabase
          .from("code_checks")
          .update({
            code_check_details: JSON.stringify(analysisResult.analysis),
          })
          .eq("id", codeCheckId);

        if (updateError) {
          console.error("Error saving analysis:", updateError);
        }
      }
    } catch (error) {
      console.error("Error analyzing documents:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Update the helper functions to work with the new data structure
  const extractJurisdiction = (data: any) => {
    // data is now an object with an 'answers' array
    const jurisdictionAnswer = data.answers?.find((answer: any) =>
      answer.question.toLowerCase().includes("jurisdiction")
    );

    if (!jurisdictionAnswer) {
      return "Information not available";
    }

    try {
      return jurisdictionAnswer.answer || "Information not available";
    } catch {
      return "Information not available";
    }
  };

  const extractContactInfo = (data: any) => {
    // data is now an object with an 'answers' array
    const contactAnswer = data.answers?.find((answer: any) =>
      answer.question.toLowerCase().includes("primary contacts")
    );

    if (!contactAnswer) {
      return {
        name: "Contact information not available",
        phone: "",
        email: "",
      };
    }

    try {
      return {
        name: "Zoning Administrator",
        phone: "Contact information not provided",
        email: "Contact information not provided",
      };
    } catch {
      return {
        name: "Contact information not available",
        phone: "",
        email: "",
      };
    }
  };

  const handleSaveToPDF = () => {
    if (!analysis?.analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    const safeHeight = pageHeight - 10; // Increased from -40 to allow more space

    // Colors from the screenshot and brand
    const colors = {
      primary: [82, 146, 255],
      background: [255, 255, 255],
      foreground: [51, 51, 51],
      mutedFg: [102, 102, 102],
      border: [229, 231, 235],
      link: [82, 146, 255],
    };

    // Helper function to add a new page with header
    const addNewPage = (pageNumber: number) => {
      doc.addPage();
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, 0, pageWidth, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8); // Reduced from 10
      doc.text("Code Check Analysis", margin, 13);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, 13, {
        align: "right",
      });
      return 30;
    };

    // First page header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); // Reduced from 12
    doc.text("Code Check Analysis", margin, 13);
    doc.text("Page 1", pageWidth - margin, 13, { align: "right" });

    let cursorY = 30;
    let pageNumber = 1;

    // Property information
    if (address) {
      doc.setTextColor(
        colors.foreground[0],
        colors.foreground[1],
        colors.foreground[2]
      );
      doc.setFontSize(8); // Reduced from 10
      doc.text(`Property: ${decodeURIComponent(address)}`, margin, cursorY);
      cursorY += 6; // Reduced from 10
    }

    // Process each response
    analysis.analysis.raw_responses?.forEach((response, responseIndex) => {
      // Calculate content heights
      doc.setFontSize(9); // Reduced from 11
      const questionLines = doc.splitTextToSize(
        response.question,
        maxWidth - 8
      );
      const questionHeight = questionLines.length * 4; // Reduced from 6

      doc.setFontSize(9); // Reduced from 10
      const answerLines = doc.splitTextToSize(
        response.answer.short_answer,
        maxWidth - 8
      );
      const answerHeight = answerLines.length * 4; // Reduced from 5

      const totalHeight = questionHeight + answerHeight + 8;

      // Check if we need a new page
      if (cursorY + totalHeight > safeHeight) {
        cursorY = addNewPage(++pageNumber);
      }

      // Add separator line between items except for first one
      if (responseIndex > 0) {
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.line(margin, cursorY - 2, pageWidth - margin, cursorY - 2);
        cursorY += 3;
      }

      // Question
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFontSize(9); // Reduced from 11
      doc.setFont("helvetica", "bold");
      const questionText = response.question.includes("?")
        ? response.question.substring(0, response.question.indexOf("?") + 1)
        : response.question;
      const formattedQuestionLines = doc.splitTextToSize(
        questionText,
        maxWidth - 8
      );
      formattedQuestionLines.forEach((line: string) => {
        doc.text(line, margin, cursorY);
        cursorY += 4; // Reduced from 6
      });

      // Answer
      doc.setTextColor(
        colors.foreground[0],
        colors.foreground[1],
        colors.foreground[2]
      );
      doc.setFontSize(8); // Reduced from 10
      doc.setFont("helvetica", "normal");
      answerLines.forEach((line: string) => {
        doc.text(line, margin, cursorY);
        cursorY += 4; // Reduced from 5
      });

      // Citations
      if (response.citations?.length) {
        cursorY += 2;
        doc.setTextColor(
          colors.mutedFg[0],
          colors.mutedFg[1],
          colors.mutedFg[2]
        );
        doc.setFontSize(6); // Reduced from 8

        // Add "Citations: " text
        doc.text("Citations: ", margin, cursorY);

        // Calculate the width of "Citations: " text to position numbers
        const citationsTextWidth = doc.getTextWidth("Citations: ");
        let currentX = margin + citationsTextWidth;

        // Add each citation as a link with appropriate label
        response.citations.forEach((citation: Citation, idx: number) => {
          const citationLabel =
            idx === 0 ? "Primary" : idx === 1 ? "Secondary" : "Other";
          const citationWidth = doc.getTextWidth(citationLabel);

          // Create the citation URL
          const encodedText = safeBase64Encode(citation.text);
          const citationUrl = `app.govgoose.com/citation?text=${encodedText}`;

          // Add the linked text
          doc.setTextColor(colors.link[0], colors.link[1], colors.link[2]);
          doc.textWithLink(citationLabel, currentX, cursorY, {
            url: citationUrl,
          });

          // Add comma and space if not last citation
          if (response.citations && idx < response.citations.length - 1) {
            currentX += citationWidth;
            doc.setTextColor(
              colors.mutedFg[0],
              colors.mutedFg[1],
              colors.mutedFg[2]
            );
            doc.text(", ", currentX, cursorY);
            currentX += doc.getTextWidth(", ");
          }
        });

        cursorY += 7; // Reduced from 8
      } else {
        cursorY += 5; // Reduced from 6
      }
    });

    const date = new Date().toISOString().split("T")[0];
    const propertyId = address
      ? `-${decodeURIComponent(address)
          .replace(/[^a-zA-Z0-9]/g, "-")
          .toLowerCase()}`
      : "";
    const filename = `govgoose-code-check${propertyId}-${date}.pdf`;

    doc.save(filename);
  };

  // Add CSV export function
  const handleSaveToCSV = () => {
    if (!analysis?.analysis?.raw_responses) return;

    // Create CSV header
    const csvRows = [
      ['Question', 'Answer', 'Primary Citation', 'Secondary Citation'].join('|')
    ];

    // Add each response as a row
    analysis.analysis.raw_responses.forEach(response => {
      // No need to replace commas since we're using pipes
      const question = response.question;
      const answer = response.answer.short_answer;
      
      // Get citation links (up to 2)
      const citations = response.citations || [];
      const citationLinks = citations.slice(0, 2).map(citation => {
        const citationText = `${citation.section || 'Section'}${citation.page ? ` (Page ${citation.page})` : ''}`;
        return `=HYPERLINK("app.govgoose.com/citation?text=${safeBase64Encode(citation.text)}", "${citationText}")`;
      });

      // Ensure we have exactly 2 citation columns (fill with empty strings if needed)
      while (citationLinks.length < 2) {
        citationLinks.push('');
      }

      csvRows.push([question, answer, ...citationLinks].join('|'));
    });

    // Create and download the CSV file
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const propertyId = address ? `-${decodeURIComponent(address).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : '';
    const filename = `govgoose-code-check${propertyId}-${date}.csv`;

    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  };

  // Add new function to read individual PDF
  const handleReadPDF = async (doc: Document) => {
    setLoadingPdfs((prev) => ({ ...prev, [doc.id]: true }));

    try {
      // CHANGE TO PROD FOR WHATEVER THE BACKEND IS HOSTED ON

      // assumes the backend repo is running on backend-2-q0cu.onrender.com
      const response = await fetch(
        "https://api.govgoose.com/extract-pdf-text",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: doc.file_url,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to read PDF: ${response.statusText}`);
      }

      const result: PDFResponse = await response.json();
      setPdfResults((prev) => ({ ...prev, [doc.id]: result }));
    } catch (error) {
      console.error(`Error reading PDF ${doc.title}:`, error);
    } finally {
      setLoadingPdfs((prev) => ({ ...prev, [doc.id]: false }));
    }
  };

  // Add function to generate mailto link
  const generateEmailLink = () => {
    if (!analysis?.analysis?.raw_responses) return "";

    const subject = encodeURIComponent(
      `Code Check Questions - ${
        address ? decodeURIComponent(address) : "Property"
      }`
    );

    // Create a structured list of all questions and answers
    const questionsAndAnswers = analysis.analysis.raw_responses
      .map(
        (response) =>
          `Question: ${response.question}\n` +
          `Answer: ${response.answer.short_answer}\n`
      )
      .join("\n");

    const body = [
      `Property: ${address ? decodeURIComponent(address) : "Property"}`,
      `\nQuestions and Answers:\n`,
      questionsAndAnswers,
      `\nCould you please review and provide any necessary clarifications?`,
      `\nThank you for your assistance.`,
      `\nBest regards`,
    ].join("\n");

    const greeting = cityContact
      ? `Hello ${cityContact.contact_name},\n\n`
      : "Hello,\n\n";

    const emailBody = encodeURIComponent(greeting + body);

    const mailtoLink = cityContact
      ? `mailto:${cityContact.contact_email
          .split(",")
          .map((email) => email.trim())
          .join(";")}?subject=${subject}&body=${emailBody}`
      : `mailto:?subject=${subject}&body=${emailBody}`;

    return mailtoLink;
  };

  const CityInfoContent = () => {
    if (!address) return <p>No city information available</p>;

    return (
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold">Address</h3>
          <p>{decodeURIComponent(address)}</p>
        </div>

        {latitude && longitude && (
          <>
            <div className="border-b pb-2">
              <h3 className="font-semibold">Coordinates</h3>
              <p>Latitude: {latitude}</p>
              <p>Longitude: {longitude}</p>
            </div>

            <div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on OpenStreetMap
              </a>
            </div>
          </>
        )}
      </div>
    );
  };

  const safeBase64Encode = (str: string) => {
    try {
      // First encode any special characters to handle Unicode
      const encodedStr = encodeURIComponent(str);
      // Then do the base64 encoding
      const base64Str = btoa(encodedStr);
      // Finally URL encode the base64 string to safely include in URL
      return encodeURIComponent(base64Str);
    } catch (e) {
      console.error("Error encoding string:", e);
      return "";
    }
  };

  // Add useEffect to fetch zoning codes
  useEffect(() => {
    const fetchZoningCodes = async () => {
      if (!codeCheckId) return;

      try {
        const { data, error } = await supabase
          .from("code_checks")
          .select("zoning_codes")
          .eq("id", codeCheckId)
          .single();

        if (error) {
          console.error("Error fetching zoning codes:", error);
          return;
        }

        if (data?.zoning_codes) {
          setZoningCodes(data.zoning_codes);
        }
      } catch (error) {
        console.error("Error in fetchZoningCodes:", error);
      }
    };

    fetchZoningCodes();
  }, [codeCheckId]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6">
      <div className="w-full lg:w-[30%] lg:sticky lg:top-40 lg:h-fit max-h-[calc(100vh-6rem)]">
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">Project Assignment</h3>
              </div>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-3">
                  {currentProjectId && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          Currently in project:
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {projects.find((p) => p.id === currentProjectId)?.name}
                      </div>
                    </div>
                  )}
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      className="w-full p-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Search or select a project..."
                      value={searchTerm}
                      onChange={(e) => {
                        const newSearchTerm = e.target.value;
                        setSearchTerm(newSearchTerm);
                        setIsDropdownOpen(true);
                        if (
                          selectedProject &&
                          !projects.find(
                            (p) =>
                              p.id === selectedProject &&
                              p.name
                                .toLowerCase()
                                .includes(newSearchTerm.toLowerCase())
                          )
                        ) {
                          setSelectedProject(null);
                        }
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {projects
                          .filter(
                            (project) =>
                              project.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase().trim()) &&
                              project.id !== currentProjectId
                          )
                          .map((project) => (
                            <div
                              key={project.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                selectedProject === project.id
                                  ? "bg-gray-50"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedProject(project.id);
                                setSearchTerm(project.name);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {project.name}
                            </div>
                          ))}
                        {projects.filter(
                          (project) =>
                            project.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase().trim()) &&
                            project.id !== currentProjectId
                        ).length === 0 && (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No matching projects found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedProject || addingToProject}
                    onClick={handleAddToProject}
                  >
                    {addingToProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding to Project...
                      </>
                    ) : (
                      "Add to Project"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No projects available. Create a project first.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4 sticky top-0 bg-white z-20">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="cityInfo">City Info</TabsTrigger>
              </TabsList>
              <TabsContent
                value="documents"
                className="max-h-[calc(100vh-10rem)] overflow-auto"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : documents.length > 0 ? (
                  <>
                    <div className="space-y-4 pb-7">
                      <h3 className="font-medium">Custom Questions</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter a custom question..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddCustomQuestion();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={handleAddCustomQuestion}
                          disabled={!newQuestion.trim()}
                        >
                          Add
                        </Button>
                      </div>

                      {customQuestions.length > 0 && (
                        <div className="space-y-2">
                          {customQuestions.map((question) => (
                            <div
                              key={question.id}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                              <span className="text-sm">{question.text}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveCustomQuestion(question.id)
                                }
                              >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="mb-4 space-y-2">
                      <Button
                        className="w-full"
                        onClick={handleAnalyzeAllDocuments}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing All Documents...
                          </>
                        ) : (
                          "Analyze All Documents"
                        )}
                      </Button>

                      {analysis && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="w-full" variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export Analysis
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuItem onClick={handleSaveToPDF}>
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleSaveToCSV}>
                                Export as CSV
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            className="w-full"
                            variant="secondary"
                            asChild
                          >
                            <a href={generateEmailLink()}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email Questions
                            </a>
                          </Button>
                        </>
                      )}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      {documents.map((doc) => (
                        <AccordionItem key={doc.id} value={doc.id}>
                          <AccordionTrigger className="text-left">
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline block"
                              >
                                View Document
                              </a>
                              {pdfResults[doc.id] && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Pages: {pdfResults[doc.id].page_count}
                                  </p>
                                  <div className="mt-2 max-h-40 overflow-y-auto text-sm bg-gray-50 p-2 rounded">
                                    {pdfResults[doc.id].lines
                                      .slice(0, 5)
                                      .map((line, i) => (
                                        <p key={i} className="text-gray-700">
                                          {line}
                                        </p>
                                      ))}
                                    {pdfResults[doc.id].lines.length > 5 && (
                                      <p className="text-gray-500 italic">
                                        ... and{" "}
                                        {pdfResults[doc.id].lines.length - 5}{" "}
                                        more lines
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <p className="text-center text-gray-500">
                    No documents found for this code check
                  </p>
                )}
              </TabsContent>
              <TabsContent
                value="cityInfo"
                className="max-h-[calc(100vh-10rem)] overflow-auto"
              >
                <CityInfoContent />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[70%]">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Code Check Analysis</h2>
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-gray-600">Analyzing documents...</p>
                <p className="text-sm text-gray-500">
                  This may take a few minutes
                </p>
              </div>
            ) : analysis ? (
              <div className="space-y-8">
                {analysis.analysis?.raw_responses?.map(
                  (response: RawResponse, index) => (
                    <AnswerCard key={index} response={response} />
                  )
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>
                  No analysis available. Click "Analyze All Documents" to begin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodeCheckLayout;
