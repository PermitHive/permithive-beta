import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Building2,
  Flag,
  Tent,
  Blinds,
  Wind,
  Clock,
  Layout,
  BrainCircuit,
  MonitorSmartphone,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";

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
          countsTowardPrimarySF: string;
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
          countsTowardSquareFootage: string;
          permitType: string;
        };
      };
      verification?: {
        cityVerified: string;
        verificationMethod: string;
        verificationBy: string;
      };
    };
  };
}

interface DocumentContent {
  title: string;
  text: string;
}

interface PDFResponse {
  lines: string[];
  page_count: number;
}

interface UnknownElement {
  question: string;
  context: string;
}

interface CodeCheckLayoutProps {
  codeCheckId: string;
}

const BooleanIndicator: React.FC<{
  value: boolean | string;
  label?: string;
}> = ({ value, label }) => {
  if (typeof value === "string") {
    if (!value || value === "") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="bg-gray-100 p-2 rounded text-sm text-gray-500">No data available</span>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Request Data
          </Button>
        </span>
      );
    }

    if (value.toLowerCase().startsWith("yes")) {
      return (
        <span className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          <span>{label || value}</span>
        </span>
      );
    }

    if (value.toLowerCase().startsWith("no")) {
      return (
        <span className="flex items-center gap-2">
          <X className="h-5 w-5 text-red-500" />
          <span>{label || value}</span>
        </span>
      );
    }

    if (value.toLowerCase().includes("not addressed")) {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="bg-gray-100 p-2 rounded text-sm text-gray-500">{value}</span>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Request Clarification
          </Button>
        </span>
      );
    }

    return <span className="text-sm text-gray-700">{value}</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      )}
      {label && <span>{label}</span>}
    </span>
  );
};

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

interface CityContact {
  city_name: string;
  contact_name: string;
  contact_email: string;
}

export const CodeCheckLayout: React.FC<CodeCheckLayoutProps> = ({ codeCheckId }) => {
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
  const [activeSection, setActiveSection] = useState("codeCheck");
  const [openAccordions, setOpenAccordions] = useState<string[]>([
    "buildingSignage",
    "groundSignage",
    "canopyBlade",
    "awning",
    "windowDoorVinyl",
    "temporarySignage",
    "interiorSignage",
    "brightLights",
    "digitalDisplays",
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const address = searchParams?.get("address") ?? null;
  const latitude = searchParams?.get("latitude") ?? null;
  const longitude = searchParams?.get("longitude") ?? null;
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [addingToProject, setAddingToProject] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const codeCheckSection = document.getElementById("codeCheckSection");
      const signageSection = document.getElementById("signageSection");

      if (codeCheckSection && signageSection) {
        const scrollPosition = window.scrollY + 150; // Adjust for header height
        const codeCheckOffset = codeCheckSection.offsetTop;
        const signageOffset = signageSection.offsetTop;

        if (scrollPosition >= signageOffset) {
          setActiveSection("signage");
        } else if (scrollPosition >= codeCheckOffset) {
          setActiveSection("codeCheck");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!codeCheckId) return;

      try {
        const { data, error } = await supabase
          .from("documents")
          .select(
            `
            *,
            code_check_documents!inner(code_check_id)
          `
          )
          .eq("code_check_documents.code_check_id", codeCheckId)
          .is("code_check_documents.deleted_at", null);

        if (error) throw error;

        setDocuments(data || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [codeCheckId]);

  useEffect(() => {
    const hardcodedAnalysis = {
      analysis: {
        structured_response: {
          propertyInfo: {
            propertyId: "244802, 00052412",
            siteAddress: {
              street: "101 E Orangethorpe Ave Ste Ne",
              city: "Fullerton",
              state: "CA",
              zipCode: "92832",
            },
          },
          cityInformation: {
            jurisdiction: "City of Fullerton",
            contact: {
              name: "Andrew Kusch - Associate Planner",
              phone: "714.738.6550",
              email: "Andrew.Kusch@cityoffullerton.com",
            },
            codeLink:
              "https://codelibrary.amlegal.com/codes/fullerton/latest/fullerton_ca/0-0-0-1",
            zoning: {
              class: "GC / General Commercial - Fullerton Town Center",
              mspOrPud: "Yes",
              mspDocumentProvided: "Yes - attached",
            },
          },
          permitProcess: {
            timeline: {
              reviewPeriod:
                "Allow 12 business days for Review; May go in & submit at counter - may be quicker (for City)",
              validityPeriod: "Must commence within 6 months",
            },
            application: {
              onlinePortal:
                "https://easydev.cityoffullerton.com/energov_prod/selfservice#/home",
              permitExpiration: "6 months",
              expeditedProcess: "No",
              varianceAllowed:
                "Yes, See attached Sign Criteria page 4 (of 11) for handwritten note",
              varianceNotes: "See attached Sign Criteria",
              reviewBoardRequired: "No",
              landlordApprovalNeeded: "Yes",
              notarizedDocsRequired: "Not addressed either way",
              preliminaryReviewsOffered: "No",
              otherDepartmentsNeeded: "No",
              finalInspectionRequired: "Yes",
            },
          },
          signageRestrictions: {
            buildingSignage: {
              squareFootage: {
                formula:
                  "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
                isAggregate: "Yes",
                calculationMethod:
                  "SIGN AREA means the entire area within a single continuous perimeter formed by no more than eight straight lines enclosing the extreme limits of writing, representations, emblem or any figure of similar character. Where a sign has two or more faces, the area of all faces shall be included in determining the area of the sign, except that where two such faces are placed back to back and are at no point more than three feet from one another, the area of the sign shall be taken as the area of one face if the two faces are of equal area, or as the area of the larger face if the two faces are of unequal area.",
                backerPanelsIncluded:
                  "Yes, Final determination to be made by City and/or Landlord",
                basedonElevation: "Yes",
              },
              heightRestrictions:
                "No projections above or below the sign panel will be permitted",
              letterHeightRestrictions:
                "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
              lengthRestrictions:
                "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
              engineerDrawingsRequired: "Upon request",
            },
            groundSignage: {
              squareFootage:
                "Existing multi-tenant sign - contact mgmt/landlord for available space",
              heightRestrictions: "Maximum height of 20 feet from grade",
              lengthRestrictions: "Maximum length of 12 feet",
              setbackRequirements: "Minimum 10 feet from property line",
              siteTriangle: "30 feet clear sight triangle required at intersections",
              engineerDrawingsRequired: "Required for signs over 6 feet in height",
            },
            canopyBlade: {
              squareFootage: "Maximum 24 square feet per blade sign",
              projectionRestrictions: "Maximum 4 feet from building face, minimum 6 inches",
              clearanceRestrictions: "Minimum 8 feet above grade, maximum 15 feet",
              illuminationAllowed: "Internal and halo illumination permitted, must be UL listed",
              engineerDrawingsRequired: "Upon request",
            },
            awning: {
              squareFootageRestrictions: "Maximum 75% of awning face",
              copyAllowed: "Text limited to business name and logo only, no phone numbers",
              projectionRestrictions: "Maximum 6 feet from building face, minimum 3 feet",
              sizeRestrictions: "Maximum width of 24 feet per awning section",
              placementRestrictions: "Must maintain 8 feet clearance from grade, centered on storefront",
              colorRestrictions: "Must match approved color palette - see design guidelines",
              engineerDrawingsRequired: "Required for awnings over 16 square feet",
            },
            windowDoorVinyl: {
              permitsRequired: "Yes, if applicable - See Sign Criteria & submit proposal for review",
              squareFootageRestrictions: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
              countsTowardPrimarySF: 'FOR PURPOSE OF STORE IDENTIFICATION, TENANT WILL BE PERMITTED TO PLACE UPON EACH ENTRANCE OF ITS DEMISED PREMISES NOT MORE THAN 144 SQ. IN. OF GOLD LEAF OR SILK SCREEN STATION LETTERING NOT TO EXCEED 2" IN HEIGHT, INDICATING HOURS OF BUSINESS, EMERGENCY TELEPHONE, ETC. TYPESTYLE SHALL BE HELVETICA MEDIUM UNLESS OTHERWISE APPROVED IN WRITING BY DICKER-WARMINGTON OR SIGNARTS, INC.',
              surfaceRestrictions: "First surface application only",
              transomRestrictions: "No vinyl permitted on transom windows",
            },
            temporarySignage: {
              permitsRequired: "Yes, if applicable",
              squareFootageRestrictions: "Maximum 32 square feet total",
              specialEventRestrictions: "Limited to 30 days per calendar year",
              displayDuration: "Maximum 14 consecutive days",
              mountingRestrictions: "Must be securely mounted, no banners",
            },
            interiorSignage: {
              setbackRestrictions: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
              illuminationAllowed: "LED and neon permitted with dimming controls",
              setbackRequirements: "Minimum 24 inches from window surface, maximum 48 inches",
              windowVisibilityRules: "Maximum 25% window coverage, minimum 75% transparency",
            },
            brightLights: {
              allowed: "Not specifically addressed - submit proposal for review",
              permitRequired: "",
              permitType: "",
            },
            digitalDisplays: {
              allowed: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
              permitRequired: "Yes, if applicable",
              countsTowardSquareFootage: "",
              permitType: "Electronic Display Permit required",
            },
          },
          verification: {
            cityVerified: "Yes",
            verificationMethod: "Email",
            verificationBy: "Andrew",
          },
        },
      },
    };

    setAnalysis(hardcodedAnalysis);
  }, []);

  useEffect(() => {
    const fetchCityContact = async () => {
      if (!address) return;

      try {
        const cityName = address.split(",")[0]?.trim();
        console.log("Searching for city:", cityName);

        const { data, error } = await supabase
          .from("catalog")
          .select("city_name, contact_name, contact_email")
          .eq("city_name", cityName)
          .single();

        if (!error && data) {
          console.log("Found city contact:", data);
          setCityContact(data);
        } else {
          setCityContact(null);
        }
      } catch (error) {
        setCityContact(null);
      }
    };

    fetchCityContact();
  }, [address]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          console.log("No user found");
          return;
        }
        console.log("Fetching projects for user:", userData.user.id);

        const { data, error } = await supabase
          .from("projects")
          .select("project_id, project_title")
          .eq("owner_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("Fetched projects:", data);
        setProjects(
          data.map((p) => ({
            id: p.project_id.toString(),
            name: p.project_title,
          }))
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleAddToProject = async () => {
    if (!selectedProject || !codeCheckId) return;

    try {
      setAddingToProject(true);
      const { error } = await supabase.from("project_code_checks").insert({
        project_id: parseInt(selectedProject, 10),
        code_check_id: codeCheckId,
      });

      if (error) throw error;

      // Update current project
      setCurrentProjectId(selectedProject);

      // Show success message
      toast({
        title: "Success",
        description: `Added to ${
          projects.find((p) => p.id === selectedProject)?.name
        }`,
        variant: "default",
        duration: 3000,
      });

      // Clear selection
      setSelectedProject(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding to project:", error);
      toast({
        title: "Error",
        description: "Could not add to project. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setAddingToProject(false);
    }
  };

  // Add effect to check if this code check is already in a project
  useEffect(() => {
    const checkCurrentProject = async () => {
      if (!codeCheckId) return;

      try {
        const { data, error } = await supabase
          .from("project_code_checks")
          .select("project_id")
          .eq("code_check_id", codeCheckId)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            // No rows returned
            console.error("Error checking current project:", error);
          }
          return;
        }

        if (data) {
          setCurrentProjectId(data.project_id.toString());
        }
      } catch (error) {
        console.error("Error checking current project:", error);
      }
    };

    checkCurrentProject();
  }, [codeCheckId]);

  const handleAnalyzeAllDocuments = async () => {
    if (documents.length === 0) return;

    setAnalyzing(true);
    try {
      const hardcodedAnalysis = {
        analysis: {
          structured_response: {
            propertyInfo: {
              propertyId: "244802, 00052412",
              siteAddress: {
                street: "101 E Orangethorpe Ave Ste Ne",
                city: "Fullerton",
                state: "CA",
                zipCode: "92832",
              },
            },
            cityInformation: {
              jurisdiction: "City of Fullerton",
              contact: {
                name: "Andrew Kusch - Associate Planner",
                phone: "714.738.6550",
                email: "Andrew.Kusch@cityoffullerton.com",
              },
              codeLink:
                "https://codelibrary.amlegal.com/codes/fullerton/latest/fullerton_ca/0-0-0-1",
              zoning: {
                class: "GC / General Commercial - Fullerton Town Center",
                mspOrPud: "Yes",
                mspDocumentProvided: "Yes - attached",
              },
            },
            permitProcess: {
              timeline: {
                reviewPeriod:
                  "Allow 12 business days for Review; May go in & submit at counter - may be quicker (for City)",
                validityPeriod: "Must commence within 6 months",
              },
              application: {
                onlinePortal:
                  "https://easydev.cityoffullerton.com/energov_prod/selfservice#/home",
                permitExpiration: "6 months",
                expeditedProcess: "No",
                varianceAllowed:
                  "Yes, See attached Sign Criteria page 4 (of 11) for handwritten note",
                varianceNotes: "See attached Sign Criteria",
                reviewBoardRequired: "No",
                landlordApprovalNeeded: "Yes",
                notarizedDocsRequired: "Not addressed either way",
                preliminaryReviewsOffered: "No",
                otherDepartmentsNeeded: "No",
                finalInspectionRequired: "Yes",
              },
            },
            signageRestrictions: {
              buildingSignage: {
                squareFootage: {
                  formula:
                    "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
                  isAggregate: "Yes",
                  calculationMethod:
                    "SIGN AREA means the entire area within a single continuous perimeter formed by no more than eight straight lines enclosing the extreme limits of writing, representations, emblem or any figure of similar character. Where a sign has two or more faces, the area of all faces shall be included in determining the area of the sign, except that where two such faces are placed back to back and are at no point more than three feet from one another, the area of the sign shall be taken as the area of one face if the two faces are of equal area, or as the area of the larger face if the two faces are of unequal area.",
                  backerPanelsIncluded:
                    "Yes, Final determination to be made by City and/or Landlord",
                  basedonElevation: "Yes",
                },
                heightRestrictions:
                  "No projections above or below the sign panel will be permitted",
                letterHeightRestrictions:
                  "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
                lengthRestrictions:
                  "Based on tenancy & building type; See Sign Criteria for regulations & restrictions",
                engineerDrawingsRequired: "Upon request",
              },
              groundSignage: {
                squareFootage:
                  "Existing multi-tenant sign - contact mgmt/landlord for available space",
                heightRestrictions: "Maximum height of 20 feet from grade",
                lengthRestrictions: "Maximum length of 12 feet",
                setbackRequirements: "Minimum 10 feet from property line",
                siteTriangle: "30 feet clear sight triangle required at intersections",
                engineerDrawingsRequired: "Required for signs over 6 feet in height",
              },
              canopyBlade: {
                squareFootage: "Maximum 24 square feet per blade sign",
                projectionRestrictions: "Maximum 4 feet from building face, minimum 6 inches",
                clearanceRestrictions: "Minimum 8 feet above grade, maximum 15 feet",
                illuminationAllowed: "Internal and halo illumination permitted, must be UL listed",
                engineerDrawingsRequired: "Upon request",
              },
              awning: {
                squareFootageRestrictions: "Maximum 75% of awning face",
                copyAllowed: "Text limited to business name and logo only, no phone numbers",
                projectionRestrictions: "Maximum 6 feet from building face, minimum 3 feet",
                sizeRestrictions: "Maximum width of 24 feet per awning section",
                placementRestrictions: "Must maintain 8 feet clearance from grade, centered on storefront",
                colorRestrictions: "Must match approved color palette - see design guidelines",
                engineerDrawingsRequired: "Required for awnings over 16 square feet",
              },
              windowDoorVinyl: {
                permitsRequired: "Yes, if applicable - See Sign Criteria & submit proposal for review",
                squareFootageRestrictions: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
                countsTowardPrimarySF: 'FOR PURPOSE OF STORE IDENTIFICATION, TENANT WILL BE PERMITTED TO PLACE UPON EACH ENTRANCE OF ITS DEMISED PREMISES NOT MORE THAN 144 SQ. IN. OF GOLD LEAF OR SILK SCREEN STATION LETTERING NOT TO EXCEED 2" IN HEIGHT, INDICATING HOURS OF BUSINESS, EMERGENCY TELEPHONE, ETC. TYPESTYLE SHALL BE HELVETICA MEDIUM UNLESS OTHERWISE APPROVED IN WRITING BY DICKER-WARMINGTON OR SIGNARTS, INC.',
                surfaceRestrictions: "First surface application only",
                transomRestrictions: "No vinyl permitted on transom windows",
              },
              temporarySignage: {
                permitsRequired: "Yes, if applicable",
                squareFootageRestrictions: "Maximum 32 square feet total",
                specialEventRestrictions: "Limited to 30 days per calendar year",
                displayDuration: "Maximum 14 consecutive days",
                mountingRestrictions: "Must be securely mounted, no banners",
              },
              interiorSignage: {
                setbackRestrictions: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
                illuminationAllowed: "LED and neon permitted with dimming controls",
                setbackRequirements: "Minimum 24 inches from window surface, maximum 48 inches",
                windowVisibilityRules: "Maximum 25% window coverage, minimum 75% transparency",
              },
              brightLights: {
                allowed: "Not specifically addressed - submit proposal for review",
                permitRequired: "",
                permitType: "",
              },
              digitalDisplays: {
                allowed: "NO WINDOW SIGNS WILL BE PERMITTED EXCEPT AS NOTED HEREIN.",
                permitRequired: "Yes, if applicable",
                countsTowardSquareFootage: "",
                permitType: "Electronic Display Permit required",
              },
            },
          },
        },
      };

      setAnalysis(hardcodedAnalysis);

      const { error: updateError } = await supabase
        .from("code_checks")
        .update({
          code_check_details: JSON.stringify(hardcodedAnalysis.analysis),
        })
        .eq("id", codeCheckId);

      if (updateError) {
        console.error("Error saving analysis:", updateError);
      }
    } catch (error) {
      console.error("Error analyzing documents:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToPDF = () => {
    if (!analysis?.analysis) return;

    const text =
      typeof analysis.analysis === "string"
        ? analysis.analysis
        : JSON.stringify(analysis.analysis, null, 2);

    const doc = new jsPDF();
    doc.setFontSize(12);
    const lineHeight = doc.getTextDimensions("test").h * 1.5;
    const splitText = doc.splitTextToSize(text, 180);
    const pageHeight = doc.internal.pageSize.height;

    doc.text("Code Check Analysis", 15, 15);
    let cursorY = 25;

    for (let i = 0; i < splitText.length; i++) {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(splitText[i], 15, cursorY);
      cursorY += lineHeight;
    }
    doc.save("code-check-analysis.pdf");
  };

  const handleReadPDF = async (doc: Document) => {
    setLoadingPdfs((prev) => ({ ...prev, [doc.id]: true }));

    try {
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

  const generateEmailLink = () => {
    if (!analysis?.analysis?.structured_response) return "";

    const subject = encodeURIComponent(
      `Code Check Questions - ${
        address ? decodeURIComponent(address) : "Property"
      }`
    );

    const body = [
      `Property: ${analysis.analysis.structured_response.propertyInfo.siteAddress.street}, ${analysis.analysis.structured_response.propertyInfo.siteAddress.city}`,
      `\nPermit Process:`,
      `- Review Period: ${analysis.analysis.structured_response.permitProcess.timeline.reviewPeriod}`,
      `- Validity Period: ${analysis.analysis.structured_response.permitProcess.timeline.validityPeriod}`,
      `\nApplication Requirements:`,
      `- Landlord Approval: ${analysis.analysis.structured_response.permitProcess.application.landlordApprovalNeeded}`,
      `- Notarized Documents: ${analysis.analysis.structured_response.permitProcess.application.notarizedDocsRequired}`,
      `- Final Inspection: ${analysis.analysis.structured_response.permitProcess.application.finalInspectionRequired}`,
    ].join("\n");

    const greeting = cityContact
      ? `Hello ${cityContact.contact_name},`
      : "Hello,";

    const emailBody = encodeURIComponent(
      `${greeting}\n\n` +
        `I have some questions regarding the code check for ${
          address ? decodeURIComponent(address) : "our property"
        }. ` +
        `Below is the analysis summary for reference:\n\n` +
        `${body}\n\n` +
        `Could you please review and provide any necessary clarifications?\n\n` +
        `Thank you for your assistance.\n\n` +
        `Best regards`
    );

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div className="sticky top-[136px] z-20 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 w-full border-b">
            <button
              className={`py-4 ${
                activeSection === "codeCheck"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => {
                setActiveSection("codeCheck");
                scrollToSection("codeCheckSection");
              }}
            >
              Site Details
            </button>
            <button
              className={`py-4 ${
                activeSection === "signage"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => {
                setActiveSection("signage");
                scrollToSection("signageSection");
              }}
            >
              Signage Restrictions
            </button>
          </div>
        </div>
      </div>

      {/* Main content area with two columns */}
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row-reverse gap-6 mt-6 px-8">
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-[200px] h-[calc(100vh-200px)]">
              <ScrollArea className="h-full p-6">
                {/* Add to Project Section - Moved to top */}
                <div className="mb-6 p-4 border rounded-lg bg-gradient-to-br from-green-700 to-green-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-white">
                      Project Assignment
                    </h3>
                  </div>
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-green-300" />
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-3">
                      {currentProjectId && (
                        <div className="p-3 bg-white/90 backdrop-blur-sm border border-green-600/20 rounded-md shadow-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-900">
                              Currently in project:
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-green-700 font-medium">
                            {
                              projects.find((p) => p.id === currentProjectId)
                                ?.name
                            }
                          </div>
                        </div>
                      )}
                      <div className="relative" ref={dropdownRef}>
                        <input
                          type="text"
                          className="w-full p-2 pr-8 border rounded-md bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                            className="h-4 w-4 text-green-300"
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
                          <div className="absolute z-10 w-full mt-1 bg-white border border-green-100 rounded-md shadow-lg max-h-60 overflow-auto">
                            {projects
                              .filter(
                                (project) =>
                                  project.name
                                    .toLowerCase()
                                    .includes(
                                      searchTerm.toLowerCase().trim()
                                    ) && project.id !== currentProjectId
                              )
                              .map((project) => (
                                <div
                                  key={project.id}
                                  className={`px-3 py-2 cursor-pointer hover:bg-green-50 ${
                                    selectedProject === project.id
                                      ? "bg-green-50 text-green-700"
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
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
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
                    <div className="text-sm text-green-100">
                      No projects available. Create a project first.
                    </div>
                  )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="cityInfo">City Information</TabsTrigger>
                  </TabsList>
                  <TabsContent value="documents">
                    {loading ? (
                      <p>Loading documents...</p>
                    ) : documents.length > 0 ? (
                      <>
                        <div className="mb-4 space-y-2">
                          {analysis && (
                            <Button
                              className="w-full"
                              variant="outline"
                              onClick={handleSaveToPDF}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Save Analysis to PDF
                            </Button>
                          )}
                        </div>

                        {/* Questions preview section */}
                        {unknownElements.length > 0 && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-2">
                              Questions Identified:
                            </h3>
                            <ul className="text-sm space-y-1">
                              {unknownElements
                                .slice(0, 3)
                                .map((element, index) => (
                                  <li key={index} className="text-gray-600">
                                    • {element.question}
                                  </li>
                                ))}
                              {unknownElements.length > 3 && (
                                <li className="text-gray-500 italic">
                                  ... and {unknownElements.length - 3} more
                                  questions
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Documents List */}
                        <ul className="space-y-4 mb-4">
                          {documents.map((doc) => (
                            <li key={doc.id} className="border rounded p-3">
                              <div className="flex flex-col gap-2">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {doc.title}
                                </a>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    doc.created_at
                                  ).toLocaleDateString()}
                                </p>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReadPDF(doc)}
                                  disabled={loadingPdfs[doc.id]}
                                >
                                  {loadingPdfs[doc.id] ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Reading PDF...
                                    </>
                                  ) : (
                                    "Read PDF"
                                  )}
                                </Button>

                                {pdfResults[doc.id] && (
                                  <div className="mt-2">
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
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p>No documents found for this code check</p>
                    )}
                  </TabsContent>
                  <TabsContent value="cityInfo">
                    <CityInfoContent />
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>
          </div>

          <div className="w-full lg:w-[65%] pt-[64px]">
            <div className="p-6">
              {address && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <p>{decodeURIComponent(address)}</p>
                </div>
              )}

              <section id="codeCheckSection">
                <h2 className="text-xl font-bold mb-4">Site Details</h2>
                {analysis ? (
                  <div className="space-y-8">
                    {/* Verification Header */}
                    {analysis.analysis.structured_response?.verification && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="font-medium">
                            Verified by{" "}
                            {
                              analysis.analysis.structured_response.verification
                                .verificationBy
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Verification Method:{" "}
                          {
                            analysis.analysis.structured_response.verification
                              .verificationMethod
                          }
                        </p>
                      </div>
                    )}

                    {/* Property, City, and Permit Information */}
                    <section className="prose max-w-none">
                      <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4">
                          Property & Permit Details
                        </h3>
                        <div className="space-y-4">
                          {/* Property Info */}
                          <div>
                            <p>
                              <strong>Property ID:</strong>{" "}
                              {
                                analysis.analysis.structured_response
                                  ?.propertyInfo?.propertyId
                              }
                              <br />
                              <strong>Address:</strong>{" "}
                              {
                                analysis.analysis.structured_response
                                  ?.propertyInfo?.siteAddress?.street
                              }
                              ,&nbsp;
                              {
                                analysis.analysis.structured_response
                                  ?.propertyInfo?.siteAddress?.city
                              }
                              ,&nbsp;
                              {
                                analysis.analysis.structured_response
                                  ?.propertyInfo?.siteAddress?.state
                              }
                              &nbsp;
                              {
                                analysis.analysis.structured_response
                                  ?.propertyInfo?.siteAddress?.zipCode
                              }
                            </p>
                          </div>

                          {/* City Info */}
                          <div>
                            <p>
                              <strong>Jurisdiction:</strong>{" "}
                              {
                                analysis.analysis.structured_response
                                  ?.cityInformation?.jurisdiction
                              }
                              <br />
                              <strong>Contact:</strong>{" "}
                              {
                                analysis.analysis.structured_response
                                  ?.cityInformation?.contact?.name
                              }{" "}
                              (
                              {
                                analysis.analysis.structured_response
                                  ?.cityInformation?.contact?.phone
                              }
                              )<br />
                              <strong>Zoning:</strong>{" "}
                              {
                                analysis.analysis.structured_response
                                  ?.cityInformation?.zoning?.class
                              }
                            </p>
                          </div>

                          {/* Permit Process Summary */}
                          <div>
                            <p>
                              The permit review process takes{" "}
                              {analysis.analysis.structured_response.permitProcess.timeline.reviewPeriod.toLowerCase()}{" "}
                              and must{" "}
                              {analysis.analysis.structured_response.permitProcess.timeline.validityPeriod.toLowerCase()}
                              . Applications can be submitted through the online
                              portal at{" "}
                              {
                                analysis.analysis.structured_response
                                  .permitProcess.application.onlinePortal
                              }
                              .
                              {analysis.analysis.structured_response
                                .permitProcess.application
                                .landlordApprovalNeeded === "yes" &&
                                " Landlord approval is required. "}
                              {analysis.analysis.structured_response
                                .permitProcess.application
                                .notarizedDocsRequired === "yes" &&
                                " Notarized documents must be provided. "}
                              {analysis.analysis.structured_response
                                .permitProcess.application
                                .finalInspectionRequired === "yes" &&
                                " A final inspection will be required. "}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Application Requirements Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(
                        analysis.analysis.structured_response.permitProcess
                          .application
                      )
                        .filter(([key]) => key !== "onlinePortal")
                        .map(([key, value]) => (
                          <Card key={key} className="bg-white">
                            <CardContent className="pt-6">
                              <h4 className="font-medium mb-2 capitalize">
                                {key.replace(/([A-Z])/g, " $1")}
                              </h4>
                              <BooleanIndicator
                                value={value}
                                label={
                                  value === "yes"
                                    ? "Required"
                                    : value === "no"
                                    ? "Not Required"
                                    : value
                                }
                              />
                            </CardContent>
                          </Card>
                        ))}
                    </section>

                    <Separator className="my-8" />

                    {/* Signage Restrictions */}
                    <section id="signageSection">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">
                          Signage Restrictions
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (openAccordions.length > 0) {
                              setOpenAccordions([]);
                            } else {
                              setOpenAccordions([
                                "buildingSignage",
                                "groundSignage",
                                "canopyBlade",
                                "awning",
                                "windowDoorVinyl",
                                "temporarySignage",
                                "interiorSignage",
                                "brightLights",
                                "digitalDisplays",
                              ]);
                            }
                          }}
                        >
                          {openAccordions.length > 0 ? "Close All" : "Open All"}
                        </Button>
                      </div>

                      <Accordion
                        type="multiple"
                        value={openAccordions}
                        onValueChange={setOpenAccordions}
                        className="w-full space-y-4"
                      >
                        <AccordionItem
                          value="buildingSignage"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-gray-500" />
                              <span>Building Signage</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card>
                                <CardContent className="pt-6">
                                  <h5 className="font-medium mb-2">Square Footage Requirements</h5>
                                  <div className="space-y-2">
                                    <span className="text-sm block">
                                      {analysis.analysis.structured_response.signageRestrictions.buildingSignage.squareFootage.formula}
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <BooleanIndicator
                                        value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.squareFootage.isAggregate}
                                        label="Aggregate"
                                      />
                                      <BooleanIndicator
                                        value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.squareFootage.backerPanelsIncluded}
                                        label="Backer Panels"
                                      />
                                      <BooleanIndicator
                                        value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.squareFootage.basedonElevation}
                                        label="Based on Elevation"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <h5 className="font-medium mb-2">Other Restrictions</h5>
                                  <div className="space-y-2">
                                    <div className="text-sm flex items-start">
                                      <strong className="mr-1">Height:</strong>
                                      <span className="inline-flex">
                                        <BooleanIndicator 
                                          value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.heightRestrictions} 
                                        />
                                      </span>
                                    </div>
                                    <div className="text-sm flex items-start">
                                      <strong className="mr-1">Length:</strong>
                                      <span className="inline-flex">
                                        <BooleanIndicator 
                                          value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.lengthRestrictions} 
                                        />
                                      </span>
                                    </div>
                                    <div className="text-sm flex items-start">
                                      <strong className="mr-1">Letter Height:</strong>
                                      <span className="inline-flex">
                                        <BooleanIndicator 
                                          value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.letterHeightRestrictions} 
                                        />
                                      </span>
                                    </div>
                                    <div className="text-sm flex items-start">
                                      <strong className="mr-1">Engineer Drawings:</strong>
                                      <span className="inline-flex">
                                        <BooleanIndicator 
                                          value={analysis.analysis.structured_response.signageRestrictions.buildingSignage.engineerDrawingsRequired} 
                                        />
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="groundSignage"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Flag className="h-5 w-5 text-gray-500" />
                              <span>Ground Signage</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              {Object.entries(
                                analysis.analysis.structured_response
                                  .signageRestrictions.groundSignage
                              ).map(([key, value]) => (
                                <div key={key} className="text-sm flex items-start">
                                  <strong className="capitalize mr-1">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                  </strong>
                                  <span className="inline-flex">
                                    <BooleanIndicator value={value} />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="canopyBlade"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Tent className="h-5 w-5 text-gray-500" />
                              <span>Canopy/Blade Signage</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Square Footage:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.canopyBlade.squareFootage} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Projection:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.canopyBlade.projectionRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Clearance:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.canopyBlade.clearanceRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Illumination:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.canopyBlade.illuminationAllowed} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Engineer Drawings:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.canopyBlade.engineerDrawingsRequired} />
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="awning"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Blinds className="h-5 w-5 text-gray-500" />
                              <span>Awning</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Square Footage:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.squareFootageRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Copy Allowed:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.copyAllowed} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Projection:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.projectionRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Size:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.sizeRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Placement:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.placementRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Color:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.colorRestrictions} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Engineer Drawings:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.awning.engineerDrawingsRequired} />
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="windowDoorVinyl"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Wind className="h-5 w-5 text-gray-500" />
                              <span>Window/Door Vinyl</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              {Object.entries(
                                analysis.analysis.structured_response
                                  .signageRestrictions.windowDoorVinyl
                              ).map(([key, value]) => (
                                <div key={key} className="text-sm flex items-start">
                                  <strong className="capitalize mr-1">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                  </strong>
                                  <span className="inline-flex">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="temporarySignage"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-gray-500" />
                              <span>Temporary Signage</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              {Object.entries(
                                analysis.analysis.structured_response
                                  .signageRestrictions.temporarySignage
                              ).map(([key, value]) => (
                                <div key={key} className="text-sm flex items-start">
                                  <strong className="capitalize mr-1">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                  </strong>
                                  <span className="inline-flex">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="interiorSignage"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Layout className="h-5 w-5 text-gray-500" />
                              <span>Interior Signage</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              {Object.entries(
                                analysis.analysis.structured_response
                                  .signageRestrictions.interiorSignage
                              ).map(([key, value]) => (
                                <div key={key} className="text-sm flex items-start">
                                  <strong className="capitalize mr-1">
                                    {key.replace(/([A-Z])/g, " $1")}:
                                  </strong>
                                  <span className="inline-flex">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="brightLights"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <BrainCircuit className="h-5 w-5 text-gray-500" />
                              <span>Bright Lights</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Allowed:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.brightLights.allowed} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Permit Required:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.brightLights.permitRequired} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Permit Type:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.brightLights.permitType} />
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem
                          value="digitalDisplays"
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <MonitorSmartphone className="h-5 w-5 text-gray-500" />
                              <span>Digital Displays</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2">
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Allowed:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.digitalDisplays.allowed} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Permit Required:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.digitalDisplays.permitRequired} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Counts Toward SF:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.digitalDisplays.countsTowardSquareFootage} />
                                </span>
                              </div>
                              <div className="text-sm flex items-start">
                                <strong className="mr-1 min-w-[120px]">Permit Type:</strong>
                                <span className="inline-flex">
                                  <BooleanIndicator value={analysis.analysis.structured_response.signageRestrictions.digitalDisplays.permitType} />
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </section>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Click "Analyze All Documents" to generate an analysis.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeCheckLayout;
