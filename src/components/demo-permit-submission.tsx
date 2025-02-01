"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const PermitSubmission: React.FC = () => {
  const [formData, setFormData] = useState({
    // Applicant Information - Pre-filled
    applicantName: 'John Smith',
    applicantEmail: 'john.smith@email.com',
    applicantPhone: '(714) 555-0123',
    applicantAddress: '123 Business Ave, Suite 100, Fullerton, CA 92832',
    isPropertyOwner: false,
    ownerPermission: null as File | null,

    // Project Information
    projectName: '',
    projectAddress: '',
    zoningClassification: '',
    signType: '',
    
    // Sign Details
    signDescription: '',
    signDimensions: {
      width: '',
      height: '',
      depth: '',
    },
    signMaterials: '',
    illuminationType: '',
    
    // Location Details
    mountingHeight: '',
    setbackDistance: '',
    
    // Required Documents
    constructionPlans: null as File | null,
    sitePlan: null as File | null,
    elevationDrawings: null as File | null,
    structuralCalculations: null as File | null,

    // Compliance Checklist
    checklist: {
      zoningCompliance: false,
      buildingCodes: false,
      safetyStandards: false,
      designStandards: false,
      ownerApproval: false,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [field]: checked
      }
    }));
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      signDimensions: {
        ...prev.signDimensions,
        [dimension]: value
      }
    }));
  };

  const permitStages = [
    {
      title: "Submit Application",
      status: "in-progress",
      description: "Complete and submit the permit application form with all required documents",
      dueDate: "Required",
      substeps: [
        { label: "Contact Information", status: "complete" },
        { label: "Project Details", status: "pending" },
        { label: "Sign Specifications", status: "pending" },
        { label: "Required Documents", status: "pending" },
        { label: "Compliance Verification", status: "pending" },
      ]
    },
    {
      title: "Initial Review",
      status: "upcoming",
      description: "City staff reviews application for completeness",
      dueDate: "5-7 business days",
      substeps: [
        { label: "Document Verification", status: "pending" },
        { label: "Zoning Check", status: "pending" },
        { label: "Fee Assessment", status: "pending" }
      ]
    },
    {
      title: "Technical Review",
      status: "upcoming",
      description: "Detailed review by building and planning departments",
      dueDate: "10-12 business days",
      substeps: [
        { label: "Building Code Review", status: "pending" },
        { label: "Planning Review", status: "pending" },
        { label: "Safety Evaluation", status: "pending" }
      ]
    },
    {
      title: "Feedback & Revisions",
      status: "upcoming",
      description: "Address any comments or required changes",
      dueDate: "If needed",
      substeps: [
        { label: "Receive Comments", status: "pending" },
        { label: "Submit Revisions", status: "pending" },
        { label: "Final Review", status: "pending" }
      ]
    },
    {
      title: "Permit Issuance",
      status: "upcoming",
      description: "Pay fees and receive approved permit",
      dueDate: "1-2 business days",
      substeps: [
        { label: "Fee Payment", status: "pending" },
        { label: "Permit Issuance", status: "pending" },
        { label: "Schedule Inspection", status: "pending" }
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Requirements Overview */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Application Requirements</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-4 text-sm text-blue-700">
            <div>
              <strong className="font-medium">Application Process:</strong>
              <ol className="list-decimal ml-4 mt-1 space-y-1">
                <li>Obtain and complete the sign permit application form</li>
                <li>Gather all required documentation</li>
                <li>Submit at least 30 days before planned installation</li>
                <li>Pay required fees upon submission</li>
              </ol>
            </div>
            
            <div>
              <strong className="font-medium">Required Documents:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Detailed construction plans showing compliance with building codes</li>
                <li>Site plan indicating exact sign location</li>
                <li>Elevations and sections of the sign structure</li>
                <li>Structural calculations (for signs over 6 feet)</li>
                <li>Property owner authorization (if applicant is not the owner)</li>
              </ul>
            </div>

            <div>
              <strong className="font-medium">Design Standards:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Must comply with zoning classification requirements</li>
                <li>Must meet size and height restrictions for specific sign type</li>
                <li>Must follow Chapter 15.49 of Fullerton Municipal Code</li>
                <li>Special requirements apply for electronic displays</li>
              </ul>
            </div>

            <div>
              <strong className="font-medium">Review Process:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Zoning compliance check</li>
                <li>Building code review</li>
                <li>Public safety evaluation</li>
                <li>Additional reviews for special sign types</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Application Status - Updated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-600 animate-pulse" />
            Permit Application Progress
          </CardTitle>
          <CardDescription>
            Estimated timeline: 15-20 business days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {permitStages.map((stage, index) => (
              <div key={index} className="relative">
                {/* Connection line */}
                {index < permitStages.length - 1 && (
                  <div className="absolute left-[15px] top-[30px] bottom-[-20px] w-[2px] bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  {/* Status indicator */}
                  <div className="relative z-10">
                    {stage.status === 'complete' ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : stage.status === 'in-progress' ? (
                      <Circle className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Circle className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Stage content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{stage.title}</h4>
                        <p className="text-sm text-gray-600">{stage.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stage.dueDate}
                      </div>
                    </div>
                    
                    {/* Substeps */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {stage.substeps.map((substep, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-2 text-sm">
                          {substep.status === 'complete' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : substep.status === 'in-progress' ? (
                            <Circle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={substep.status === 'complete' ? 'text-green-700' : 'text-gray-600'}>
                            {substep.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign Permit Application - City of Fullerton</CardTitle>
          <CardDescription>
            Please complete all sections of this form. Applications must be submitted at least 30 days before planned installation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Applicant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Applicant Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicantName">Full Name</Label>
                  <Input
                    id="applicantName"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantEmail">Email</Label>
                  <Input
                    id="applicantEmail"
                    name="applicantEmail"
                    type="email"
                    value={formData.applicantEmail}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantPhone">Phone</Label>
                  <Input
                    id="applicantPhone"
                    name="applicantPhone"
                    type="tel"
                    value={formData.applicantPhone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantAddress">Address</Label>
                  <Input
                    id="applicantAddress"
                    name="applicantAddress"
                    value={formData.applicantAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPropertyOwner"
                  checked={formData.isPropertyOwner}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPropertyOwner: checked as boolean }))
                  }
                />
                <Label htmlFor="isPropertyOwner">I am the property owner</Label>
              </div>
              {!formData.isPropertyOwner && (
                <div>
                  <Label htmlFor="ownerPermission">Property Owner Authorization Letter</Label>
                  <Input
                    id="ownerPermission"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'ownerPermission')}
                    accept=".pdf,.doc,.docx"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload signed authorization from property owner (PDF or DOC)</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Project Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectAddress">Project Address</Label>
                  <Input
                    id="projectAddress"
                    name="projectAddress"
                    value={formData.projectAddress}
                    onChange={handleInputChange}
                    placeholder="Enter project address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zoningClassification">Zoning Classification</Label>
                  <Select
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, zoningClassification: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zoning classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed-use">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="signType">Sign Type</Label>
                  <Select
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, signType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wall">Wall Sign</SelectItem>
                      <SelectItem value="monument">Monument Sign</SelectItem>
                      <SelectItem value="pole">Pole Sign</SelectItem>
                      <SelectItem value="projecting">Projecting Sign</SelectItem>
                      <SelectItem value="window">Window Sign</SelectItem>
                      <SelectItem value="electronic">Electronic Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sign Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sign Details</h3>
              <div>
                <Label htmlFor="signDescription">Sign Description</Label>
                <Textarea
                  id="signDescription"
                  name="signDescription"
                  value={formData.signDescription}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of the proposed sign"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.signDimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    placeholder="Enter width"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (ft)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.signDimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    placeholder="Enter height"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Depth (ft)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={formData.signDimensions.depth}
                    onChange={(e) => handleDimensionChange('depth', e.target.value)}
                    placeholder="Enter depth"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signMaterials">Materials</Label>
                  <Input
                    id="signMaterials"
                    name="signMaterials"
                    value={formData.signMaterials}
                    onChange={handleInputChange}
                    placeholder="List all materials to be used"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="illuminationType">Illumination Type</Label>
                  <Select
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, illuminationType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select illumination type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                      <SelectItem value="halo">Halo Lit</SelectItem>
                      <SelectItem value="neon">Neon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Required Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="constructionPlans">Construction Plans</Label>
                  <Input
                    id="constructionPlans"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'constructionPlans')}
                    accept=".pdf"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sitePlan">Site Plan</Label>
                  <Input
                    id="sitePlan"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'sitePlan')}
                    accept=".pdf"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="elevationDrawings">Elevation Drawings</Label>
                  <Input
                    id="elevationDrawings"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'elevationDrawings')}
                    accept=".pdf"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="structuralCalculations">Structural Calculations</Label>
                  <Input
                    id="structuralCalculations"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'structuralCalculations')}
                    accept=".pdf"
                  />
                  <p className="text-sm text-gray-500 mt-1">Required for signs over 6 feet in height</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Compliance Checklist */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Compliance Checklist</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="zoningCompliance"
                    checked={formData.checklist.zoningCompliance}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('zoningCompliance', checked as boolean)
                    }
                  />
                  <Label htmlFor="zoningCompliance">
                    I confirm that the proposed sign complies with zoning requirements
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="buildingCodes"
                    checked={formData.checklist.buildingCodes}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('buildingCodes', checked as boolean)
                    }
                  />
                  <Label htmlFor="buildingCodes">
                    I confirm that the proposed sign meets all applicable building codes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="safetyStandards"
                    checked={formData.checklist.safetyStandards}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('safetyStandards', checked as boolean)
                    }
                  />
                  <Label htmlFor="safetyStandards">
                    I confirm that the proposed sign meets all safety standards
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="designStandards"
                    checked={formData.checklist.designStandards}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('designStandards', checked as boolean)
                    }
                  />
                  <Label htmlFor="designStandards">
                    I confirm that the proposed sign complies with Chapter 15.49 design standards
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ownerApproval"
                    checked={formData.checklist.ownerApproval}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('ownerApproval', checked as boolean)
                    }
                  />
                  <Label htmlFor="ownerApproval">
                    I confirm that I have obtained property owner approval (if applicable)
                  </Label>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            onClick={handleSubmit}
            disabled={!Object.values(formData.checklist).every(Boolean)}
          >
            Submit Application
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermitSubmission;
