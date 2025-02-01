"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Edit2, Calendar, User, MapPin, FileText, ChevronDown, ArrowUpDown, ArrowUpFromLine, File, Table, FileSearch, FolderUp, Plus, Users, X, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import AuthError from '@/components/auth-error'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@radix-ui/react-toast"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { AddUsersSection } from "@/components/add-users-section"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import type { Result } from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import type { Map as MapboxMap } from 'mapbox-gl';
import * as XLSX from 'xlsx';
import { CodeCheckPreview } from "@/components/code-check-preview"
import { jsPDF } from "jspdf";

interface Project {
  project_id: number;
  project_title: string;
  project_description: string;
  start_date: string;
  end_date: string;
  client_name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseCodeCheck {
  id: string;
  address: string;
  document_type: string;
  status: string;
  zoning_codes: string | string[];
  created_at: string;
  latitude: number;
  longitude: number;
}

interface Site {
  id: string;
  address: string;
  document_type: string;
  status: string;
  zoning_codes: string | string[];
  created_at: string;
  latitude: number;
  longitude: number;
}

interface CodeCheckJoinResult {
  code_check_id: string;
  code_checks: DatabaseCodeCheck | null;
}

interface CodeCheckResponse {
  code_checks: DatabaseCodeCheck;
}

interface CodeCheckResult {
  code_check_id: string;
  code_checks: {
    id: string;
    address: string;
    document_type: string;
    status: string;
    zoning_codes: string | string[];
    created_at: string;
  };
}

interface Analysis {
  analysis: {
    structured_response: any;
    raw_responses: Array<{
      question: string;
      answer: {
        short_answer: string;
        detailed_answer: string;
      };
      citations?: Array<{
        text: string;
        section?: string;
        page?: string;
        score?: number;
      }>;
    }>;
  };
}

const ProjectMap: React.FC<{
  codeChecks: DatabaseCodeCheck[];
  selectedCheckId: string | null;
  onSelectCheck: (id: string) => void;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  mapCenter?: { lat: number; lng: number } | null;
}> = ({ codeChecks, selectedCheckId, onSelectCheck, defaultCenter, defaultZoom, mapCenter }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('satellite');
  const markersRef = React.useRef<{ marker: mapboxgl.Marker; popup: mapboxgl.Popup }[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 3
    });

    map.on('error', () => {}); // Empty error handler to prevent uncaught error

    mapRef.current = map;

    // Clear existing markers
    markersRef.current.forEach(({ marker, popup }) => {
      popup.remove();
      marker.remove();
    });
    markersRef.current = [];

    // Add markers for each code check
    codeChecks.forEach(check => {
      // Create marker
      const marker = new mapboxgl.Marker({
        color: check.id === selectedCheckId ? '#5BA69C' : '#64B6AC',
        scale: 1
      })
        .setLngLat([check.longitude, check.latitude])
        .addTo(map);

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px',
        offset: 25,
        className: 'mapbox-custom-popup'
      })
      .setHTML(`
        <div class="p-4 bg-white rounded-lg shadow-lg">
          <div class="mb-3">
            <h3 class="text-lg font-semibold text-gray-900">${check.address}</h3>
          </div>
          <a href="/code-check?address=${encodeURIComponent(check.address)}&latitude=${check.latitude}&longitude=${check.longitude}&codeCheckId=${check.id}"
             class="block w-full px-4 py-2 text-center bg-[#64B6AC] hover:bg-[#5BA69C] text-white font-medium rounded-lg transition-colors">
            View Details
          </a>
        </div>
      `);

      // Show popup on hover
      const markerElement = marker.getElement();
      markerElement.addEventListener('mouseenter', () => {
        popup.addTo(map);
      });

      markerElement.addEventListener('mouseleave', () => {
        popup.remove();
      });

      // Handle click
      markerElement.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        onSelectCheck(check.id);
        map.flyTo({
          center: [check.longitude, check.latitude],
          zoom: 14,
          duration: 1000
        });
      });

      markersRef.current.push({ marker, popup });
    });

    // Add map style toggle control
    const toggleButton = document.createElement('button');
    toggleButton.className = 'absolute top-2 right-2 bg-white px-3 py-1.5 rounded-md shadow-md text-sm font-medium hover:bg-gray-50 transition-colors z-10';
    toggleButton.textContent = mapStyle === 'streets' ? 'Satellite View' : 'Map View';
    toggleButton.onclick = () => {
      const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
      setMapStyle(newStyle);
      map.setStyle(newStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12');
      toggleButton.textContent = newStyle === 'streets' ? 'Satellite View' : 'Map View';
    };
    mapContainerRef.current.appendChild(toggleButton);

    return () => {
      markersRef.current.forEach(({ marker, popup }) => {
        popup.remove();
        marker.remove();
      });
      toggleButton.remove();
      map.remove();
    };
  }, [codeChecks, selectedCheckId, mapStyle]);

  // Only update map center when mapCenter prop changes
  useEffect(() => {
    if (mapCenter && mapRef.current) {
      mapRef.current.flyTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 14,
        duration: 1000
      });
    }
  }, [mapCenter]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
};

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [codeChecks, setCodeChecks] = useState<DatabaseCodeCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedProject, setEditedProject] = useState<Project | null>(null)
  const [address, setAddress] = useState("")
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)
  const [isCodeChecksOpen, setIsCodeChecksOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'address' | 'date' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [importMode, setImportMode] = useState<'existing' | 'batch' | 'single'>('single')
  const [newCodeCheckAddress, setNewCodeCheckAddress] = useState('')
  const [newCodeCheckZoning, setNewCodeCheckZoning] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sitesInOtherProjects, setSitesInOtherProjects] = useState<string[]>([])
  const [isNewProject, setIsNewProject] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    latitude: number
    longitude: number
  } | null>(null)
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number} | null>(null)
  const [batchAddresses, setBatchAddresses] = useState<string[]>([])
  const [batchFileInput, setBatchFileInput] = useState<File | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)
  const [authError, setAuthError] = useState(false)
  const [showAddCodeCheck, setShowAddCodeCheck] = useState(false)
  const [previewCheckId, setPreviewCheckId] = useState<string | null>(null);
  const [selectedCodeChecks, setSelectedCodeChecks] = useState<string[]>([]);

  // Remove unused refs and states
  const geocoderContainerRef = useRef<HTMLDivElement>(null)
  const geocoderRef = useRef<MapboxGeocoder | null>(null)

  // Simplify address search function
  const searchAddress = async (query: string) => {
    if (!query || query.length < 6) {
      setAddressSuggestions([]);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=address`
        );
        const data = await response.json();
        setAddressSuggestions(data.features || []);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  // Aaddress selection handler
  const handleAddressSelect = (feature: any) => {
    const newLocation = {
      address: feature.place_name,
      longitude: feature.center[0],
      latitude: feature.center[1]
    };
    setSelectedLocation(newLocation);
    setNewCodeCheckAddress(feature.place_name);
    setMapCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchCodeChecks();

    const isNew = sessionStorage.getItem('newProject') === 'true';
    if (isNew) {
      setIsNewProject(true);
      sessionStorage.removeItem('newProject');
      const timeout = 10000 + Math.random() * 2000;
      setTimeout(() => setIsNewProject(false), timeout);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('code_checks')
        .select('id, address, document_type, status, zoning_codes, created_at, latitude, longitude')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
      
      if (error) throw error
      
      setSites(data)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getSortedSites = (sites: Site[]) => {
    return sites.sort((a, b) => {
      const aAttached = codeChecks.some(check => check.id === a.id);
      const bAttached = codeChecks.some(check => check.id === b.id);
      const aInOther = sitesInOtherProjects.includes(a.id);
      const bInOther = sitesInOtherProjects.includes(b.id);

      // First sort by status (added, unadded, in other project)
      if (aAttached !== bAttached) {
        return aAttached ? -1 : 1;
      }
      if (aInOther !== bInOther) {
        return aInOther ? 1 : -1;
      }

      // Then apply the user's sort preference within each group
      if (sortBy === 'address') {
        return sortDirection === 'asc' 
          ? a.address.localeCompare(b.address)
          : b.address.localeCompare(a.address);
      } else if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
  };

  const filteredSites = getSortedSites(
    sites.filter(site => !address || site.address.toLowerCase().includes(address.toLowerCase()))
  );

  const toggleSite = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    )
  }

  const fetchProjectDetails = async () => {
    try {
      console.log('Fetching project details for ID:', params.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const projectId = parseInt(params.id as string, 10);
      if (isNaN(projectId)) {
        throw new Error('Invalid project ID format');
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_id', projectId)
        .single();

      console.log('Project data:', data);
      console.log('Project error:', error);

      if (error) throw error;
      
      // Check if the project was created in the last 5 seconds
      const createdAt = new Date(data.created_at);
      const now = new Date();
      const isJustCreated = now.getTime() - createdAt.getTime() < 5000;
      
      setProject(data);
      setIsNewProject(isJustCreated);

      // If it's a new project, set a timeout to remove the loading screen
      if (isJustCreated) {
        setTimeout(() => {
          setIsNewProject(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    setError(null)

    try {
      if (!editedProject) return

      // Create a new object without project_id
      const { project_id, ...updateData } = editedProject

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('project_id', params.id)
        .select()

      if (error) throw error

      setProject(data[0])
      setIsEditModalOpen(false)
      toast({
        title: "Success",
        description: "Project details updated successfully",
        className: "bg-green-50 border-green-200",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: "Failed to update project details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCodeCheck = async (codeCheckId: string) => {
    try {
      const { error } = await supabase
        .from('project_code_checks')
        .delete()
        .eq('project_id', params.id)
        .eq('code_check_id', codeCheckId)

      if (error) throw error

      setCodeChecks(codeChecks.filter(check => check.id !== codeCheckId))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAddSitesToProject = async () => {
    try {
      // Find the full site objects for selected sites
      const sitesToAdd = sites.filter(site => 
        selectedSites.includes(site.id) && 
        !codeChecks.some(check => check.id === site.id)
      )
      
      if (sitesToAdd.length === 0) {
        toast({
          title: "Info",
          description: "These code checks are already added to the project.",
          variant: "default",
        })
        setSelectedSites([])
        return
      }

      // Insert into bridge table with project_id and code_check_id
      const insertData = sitesToAdd.map(site => ({
        project_id: Number(params.id),
        code_check_id: site.id
      }))

      const { error } = await supabase
        .from('project_code_checks')
        .insert(insertData)

      if (error) throw error

      // Add the new sites to the codeChecks state
      setCodeChecks(prevChecks => [...prevChecks, ...sitesToAdd])
      
      setSelectedSites([])
      
      toast({
        title: "Success!",
        description: `Added ${sitesToAdd.length} code check${sitesToAdd.length > 1 ? 's' : ''} to the project.`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add code checks. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Try again" onClick={handleAddSitesToProject}>Try again</ToastAction>,
      })
      setError(error.message)
    }
  }

  const fetchCodeChecks = async () => {
    try {
      // First get the code check IDs from the bridge table
      console.log('Fetching code checks for project ID:', params.id);
      const { data: bridgeData, error: bridgeError } = await supabase
        .from('project_code_checks')
        .select('code_check_id')
        .eq('project_id', params.id);

      if (bridgeError) throw bridgeError;

      console.log('Bridge data:', bridgeData);
      if (!bridgeData || bridgeData.length === 0) {
        setCodeChecks([]);
        return;
      }

      const codeCheckIds = bridgeData.map(row => row.code_check_id);
      console.log('Code check IDs:', codeCheckIds);

      // Then get the actual code checks with their details
      const { data: checksData, error: checksError } = await supabase
        .from('code_checks')
        .select('*')
        .in('id', codeCheckIds)
        .neq('status', 'deleted');

      if (checksError) throw checksError;

      console.log('Fetched code checks:', checksData);
      setCodeChecks(checksData || []);
    } catch (error: any) {
      
      console.error('Error fetching code checks:', error);
      setError(error.message);
    }
  };

  const handleSelectCheck = (id: string) => {
    setSelectedCheckId(id);
  };

  const scrollToAddCodeChecks = () => {
    setIsCodeChecksOpen(true)
    setTimeout(() => {
      const element = document.getElementById('addCodeCheckSection')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  useEffect(() => {
    fetchSitesInOtherProjects()
  }, [params.id])

  const fetchSitesInOtherProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('project_code_checks')
        .select('code_check_id')
        .neq('project_id', params.id)

      if (error) throw error
      
      setSitesInOtherProjects(data.map(item => item.code_check_id))
    } catch (error: any) {
      console.error('Error fetching sites in other projects:', error)
    }
  }

  const handleRemoveFromProject = async (codeCheckId: string) => {
    try {
      const { error } = await supabase
        .from('project_code_checks')
        .delete()
        .eq('project_id', params.id)
        .eq('code_check_id', codeCheckId);

      if (error) throw error;

      // Remove from local state
      setCodeChecks(prevChecks => prevChecks.filter(check => check.id !== codeCheckId));
      
      toast({
        title: "Success!",
        description: "Code check removed from project.",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error: any) {
      console.error('Error removing code check:', error);
      toast({
        title: "Error",
        description: "Failed to remove code check. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSiteClick = async (site: Site) => {
    if (codeChecks.some(check => check.id === site.id)) {
      // Remove from project
      try {
        const { error } = await supabase
          .from('project_code_checks')
          .delete()
          .eq('project_id', params.id)
          .eq('code_check_id', site.id);

        if (error) throw error;

        // Remove from local state
        setCodeChecks(prevChecks => prevChecks.filter(check => check.id !== site.id));
        
        toast({
          title: "Removed",
          description: "Code check removed from project",
          variant: "default",
          className: "bg-green-50 border-green-200",
        });
      } catch (error: any) {
        console.error('Error removing code check:', error);
        toast({
          title: "Error",
          description: "Failed to remove code check",
          variant: "destructive",
        });
      }
    } else {
      // Add to project
      try {
        const { error } = await supabase
          .from('project_code_checks')
          .insert({
            project_id: Number(params.id),
            code_check_id: site.id
          });

        if (error) throw error;

        // Add to local state
        setCodeChecks(prevChecks => [...prevChecks, site]);
        
        toast({
          title: "Added",
          description: "Code check added to project",
          variant: "default",
          className: "bg-green-50 border-green-200",
        });
      } catch (error: any) {
        console.error('Error adding code check:', error);
        toast({
          title: "Error",
          description: "Failed to add code check",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateCodeCheck = async () => {
    if (!selectedLocation) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "User authentication required",
          variant: "destructive",
        });
        return;
      }

      // Create the code check
      const { data: codeCheckData, error: codeCheckError } = await supabase
        .from("code_checks")
        .insert([
          {
            user_id: user.id,
            original_content: { content: "Original content" },
            edited_content: { content: "Edited content" },
            document_type: "city",
            address: selectedLocation.address,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            zoning_codes: newCodeCheckZoning ? newCodeCheckZoning.split(',').map(code => code.trim()) : [],
            status: "pending",
          },
        ])
        .select()
        .single();

      if (codeCheckError) throw codeCheckError;

      // Add to project
      const { error: projectError } = await supabase
        .from('project_code_checks')
        .insert({
          project_id: Number(params.id),
          code_check_id: codeCheckData.id
        });

      if (projectError) throw projectError;

      // Add to local state
      setCodeChecks(prev => [...prev, codeCheckData]);
      
      // Reset form but keep the box open
      setNewCodeCheckAddress('');
      setNewCodeCheckZoning('');
      setSelectedLocation(null);
      
      toast({
        title: "Success!",
        description: "Code check created and added to project",
        className: "bg-green-50 border-green-200",
      });
    } catch (error: any) {
      console.error('Error creating code check:', error);
      toast({
        title: "Error",
        description: "Failed to create code check. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!geocoderContainerRef.current || geocoderRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      countries: 'US',
      types: 'address',
      placeholder: 'Enter address...',
      marker: false,
      // @ts-ignore -- mapboxgl type mismatch but works at runtime
      mapboxgl,
      minLength: 1,
      clearOnBlur: false,
      limit: 5,
      collapsed: false,
      clearAndBlurOnEsc: false,
      flyTo: false,
      render: function(item) {
        return `<div class='geocoder-dropdown-item'>
          <span class='geocoder-dropdown-text'>
            ${item.place_name}
          </span>
        </div>`;
      }
    });

    geocoderRef.current = geocoder;
    const container = geocoderContainerRef.current;
    container.innerHTML = ''; 
    geocoder.addTo(container);

    geocoder.on('result', (e: { result: Result }) => {
      const { result } = e;
      setSelectedLocation({
        address: result.place_name,
        longitude: result.center[0],
        latitude: result.center[1]
      });
      setNewCodeCheckAddress(result.place_name);
    });

    geocoder.on('clear', () => {
      setSelectedLocation(null);
      setNewCodeCheckAddress('');
    });

    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
        geocoderRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .geocoder-container {
        width: 100%;
        position: relative;
      }
      .mapboxgl-ctrl-geocoder {
        width: 100% !important;
        max-width: none !important;
        font-size: 14px !important;
        line-height: 20px !important;
        font-family: inherit !important;
        background-color: white !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 6px !important;
        box-shadow: none !important;
        position: relative;
      }
      .mapboxgl-ctrl-geocoder--input {
        width: 100% !important;
        height: 36px !important;
        padding: 6px 35px !important;
        border-radius: 6px !important;
        color: rgb(17 24 39) !important;
        border: none !important;
      }
      .mapboxgl-ctrl-geocoder--input:focus {
        outline: none !important;
      }
      .mapboxgl-ctrl-geocoder--icon {
        top: 8px !important;
      }
      .mapboxgl-ctrl-geocoder--icon-search {
        left: 10px !important;
      }
      .mapboxgl-ctrl-geocoder--icon-close {
        right: 10px !important;
      }
      .mapboxgl-ctrl-geocoder--pin-right > * {
        right: 8px !important;
        top: 7px !important;
      }
      .mapboxgl-ctrl-geocoder .suggestions {
        position: absolute !important;
        width: 100% !important;
        left: 0 !important;
        top: calc(100% + 4px) !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 6px !important;
        background: white !important;
        z-index: 50 !important;
      }
      .mapboxgl-ctrl-geocoder .suggestions > * {
        padding: 8px 12px !important;
        font-size: 14px !important;
        cursor: pointer !important;
      }
      .mapboxgl-ctrl-geocoder .suggestions > *:hover {
        background-color: #f3f4f6 !important;
      }
      .geocoder-dropdown-item {
        padding: 8px 12px;
      }
      .geocoder-dropdown-text {
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchFileInput(file);
    setIsBatchProcessing(true);

    try {
      let addresses: string[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV
        const text = await file.text();
        const lines = text.split('\n');
        addresses = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .slice(1); // Skip header row
      } else if (file.name.endsWith('.xlsx')) {
        // Handle Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        

        addresses = data
          .slice(1)
          .map(row => row[0]?.toString().trim())
          .filter(address => address && address.length > 0);
      }

      setBatchAddresses(addresses);
      
      if (addresses.length === 0) {
        toast({
          title: "No Addresses Found",
          description: "Please make sure your file has addresses in the first column and includes a header row.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please ensure it's a valid CSV or Excel file.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Add function to handle batch code check creation
  const handleBatchCreateCodeChecks = async () => {
    setIsSubmitting(true);
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User authentication required",
          variant: "destructive",
        });
        return;
      }

      for (const address of batchAddresses) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=address`
          );
          const data = await response.json();
          
          if (data.features && data.features[0]) {
            const [longitude, latitude] = data.features[0].center;
            
            const { data: codeCheckData, error: codeCheckError } = await supabase
              .from("code_checks")
              .insert([{
                user_id: user.id,
                original_content: { content: "Original content" },
                edited_content: { content: "Edited content" },
                document_type: "city",
                address: data.features[0].place_name,
                latitude,
                longitude,
                status: "pending",
              }])
              .select()
              .single();

            if (codeCheckError) throw codeCheckError;

            // Add to project
            await supabase
              .from('project_code_checks')
              .insert({
                project_id: Number(params.id),
                code_check_id: codeCheckData.id
              });

            // Add to local state
            setCodeChecks(prev => [...prev, codeCheckData]);
            results.success.push(address);
          } else {
            results.failed.push(address);
          }
        } catch (error) {
          console.error('Error processing address:', address, error);
          results.failed.push(address);
        }
      }

      toast({
        title: "Batch Processing Complete",
        description: `Successfully added ${results.success.length} code checks. ${results.failed.length > 0 ? `Failed to process ${results.failed.length} addresses.` : ''}`,
        className: results.failed.length === 0 ? "bg-green-50 border-green-200" : undefined,
      });

      setBatchAddresses([]);
      setBatchFileInput(null);
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast({
        title: "Error",
        description: "Failed to process batch upload",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    if (selectedCodeChecks.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    let cursorY = 30;
    let pageNumber = 1;

    // Helper function to add a new page with header
    const addNewPage = (pageNumber: number) => {
      doc.addPage();
      doc.setFillColor(82, 146, 255);
      doc.rect(0, 0, pageWidth, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("Code Check Analysis", margin, 13);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, 13, { align: "right" });
      return 30;
    };

    // First page header
    doc.setFillColor(82, 146, 255);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Code Check Analysis", margin, 13);
    doc.text("Page 1", pageWidth - margin, 13, { align: "right" });

    for (const checkId of selectedCodeChecks) {
      const check = codeChecks.find(c => c.id === checkId);
      if (!check) continue;

      // Get analysis data for this code check
      const { data, error } = await supabase
        .from("code_checks")
        .select("code_check_details")
        .eq("id", checkId)
        .single();

      if (error || !data?.code_check_details) continue;

      let analysis: Analysis;
      try {
        analysis = { analysis: JSON.parse(data.code_check_details) };
      } catch {
        continue;
      }

      // Add address header
      if (cursorY > pageHeight - 40) {
        cursorY = addNewPage(++pageNumber);
      }

      doc.setTextColor(51, 51, 51);
      doc.setFontSize(12);
      doc.text(`Property: ${check.address}`, margin, cursorY);
      cursorY += 10;

      // Add responses
      analysis.analysis.raw_responses?.forEach((response) => {
        const questionLines = doc.splitTextToSize(response.question, maxWidth - 8);
        const answerLines = doc.splitTextToSize(response.answer.short_answer, maxWidth - 8);
        const totalHeight = (questionLines.length + answerLines.length) * 5 + 8;

        if (cursorY + totalHeight > pageHeight - 20) {
          cursorY = addNewPage(++pageNumber);
        }

        doc.setTextColor(82, 146, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        questionLines.forEach((line: string) => {
          doc.text(line, margin, cursorY);
          cursorY += 5;
        });

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        answerLines.forEach((line: string) => {
          doc.text(line, margin, cursorY);
          cursorY += 5;
        });

        cursorY += 5;
      });

      cursorY += 10;
    }

    const date = new Date().toISOString().split("T")[0];
    const filename = `govgoose-code-checks-${date}.pdf`;
    doc.save(filename);
  };

  const handleExportCSV = async () => {
    if (selectedCodeChecks.length === 0) return;

    const allRows: string[][] = [
      ['Address', 'Question', 'Answer', 'Primary Citation', 'Secondary Citation']
    ];

    for (const checkId of selectedCodeChecks) {
      const check = codeChecks.find(c => c.id === checkId);
      if (!check) continue;

      const { data, error } = await supabase
        .from("code_checks")
        .select("code_check_details")
        .eq("id", checkId)
        .single();

      if (error || !data?.code_check_details) continue;

      let analysis: Analysis;
      try {
        analysis = { analysis: JSON.parse(data.code_check_details) };
      } catch {
        continue;
      }

      analysis.analysis.raw_responses?.forEach(response => {
        const citations = response.citations || [];
        const citationLinks = citations.slice(0, 2).map(citation => {
          const citationText = `${citation.section || 'Section'}${citation.page ? ` (Page ${citation.page})` : ''}`;
          return `=HYPERLINK("app.govgoose.com/citation?text=${encodeURIComponent(citation.text)}", "${citationText}")`;
        });

        while (citationLinks.length < 2) {
          citationLinks.push('');
        }

        allRows.push([
          check.address,
          response.question,
          response.answer.short_answer,
          ...citationLinks
        ]);
      });
    }

    const csvContent = '\uFEFF' + allRows.map(row => row.join('|')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const filename = `govgoose-code-checks-${date}.csv`;

    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authError) {
    return <AuthError />
  }

  if (isNewProject) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow relative flex items-center justify-center py-24">
          <div className="gradient-background absolute inset-0 opacity-40" />
          <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
            <div className="mb-16">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Setting up your project
              </h1>
              <div className="mt-6 flex justify-center">
                <div className="w-1.5 h-1.5 bg-[#64B6AC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#64B6AC] rounded-full animate-bounce mx-1.5" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 bg-[#64B6AC] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
            
            <div className="space-y-10 text-left">
              <div className="animate-reveal animation-delay-1000">
                <p className="text-lg text-gray-600 font-normal">
                  Preparing your workspace with everything you need to manage your project efficiently
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg space-y-8">
                <div className="animate-buildIn animation-delay-2000">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#64B6AC]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#64B6AC]" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">Location Management</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">Track and analyze multiple properties in one place</p>
                    </div>
                  </div>
                </div>

                <div className="animate-buildIn animation-delay-3000">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#64B6AC]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-[#64B6AC]" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">Team Collaboration</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">Work together seamlessly with your team</p>
                    </div>
                  </div>
                </div>

                <div className="animate-buildIn animation-delay-4000">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#64B6AC]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#64B6AC]" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">Document Organization</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">Keep all your code checks and documents organized</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{isEditModalOpen ? (
              <Input
                value={editedProject?.project_title || ''}
                onChange={(e) => setEditedProject({...editedProject!, project_title: e.target.value})}
                className="text-3xl font-bold"
              />
            ) : project.project_title}</h1>
            <div className="flex items-center gap-2">
              <Button 
                className="flex items-center gap-2" 
                onClick={() => setIsCodeChecksOpen(!isCodeChecksOpen)}
              >
                <Plus className="h-4 w-4" />
                Add Code Checks
              </Button>
              {isEditModalOpen ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditedProject(project);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white border-none"
                  >
                    Cancel Edit
                  </Button>
                  <Button 
                    onClick={handleUpdateProject}
                    className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  className="flex items-center gap-2" 
                  onClick={() => {
                    setIsEditModalOpen(!isEditModalOpen);
                    if (!isEditModalOpen) {
                      setEditedProject({...project});
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Project
                </Button>
              )}
            </div>
          </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                <span className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <strong>Error:</strong> {error}
                </span>
              </div>
            )}

          <div className="space-y-8">
            {isCodeChecksOpen && (
              <div className="bg-gray-100 rounded-lg border border-gray-200 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-gray-500" />
                    <h2 className="text-base font-semibold">Add Code Checks</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setIsCodeChecksOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-3">
                  <div className="flex gap-1 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 flex items-center gap-1.5 ${
                        importMode === 'single' ? 'border-[#64B6AC] bg-[#64B6AC] bg-opacity-20 text-[#2C5753]' : ''
                      }`}
                      onClick={() => setImportMode('single')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Single
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 flex items-center gap-1.5 ${
                        importMode === 'existing' ? 'border-[#64B6AC] bg-[#64B6AC] bg-opacity-20 text-[#2C5753]' : ''
                      }`}
                      onClick={() => setImportMode('existing')}
                    >
                      <FileSearch className="h-3.5 w-3.5" />
                      Existing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 flex items-center gap-1.5 ${
                        importMode === 'batch' ? 'border-[#64B6AC] bg-[#64B6AC] bg-opacity-20 text-[#2C5753]' : ''
                      }`}
                      onClick={() => setImportMode('batch')}
                    >
                      <FolderUp className="h-3.5 w-3.5" />
                      Batch
                    </Button>
                  </div>

                  <div className="overflow-y-auto">
                    {importMode === 'single' && (
                      <div className="bg-gray-50 rounded-lg p-3 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <div>
                            <Popover 
                              open={!!newCodeCheckAddress}
                            >
                              <PopoverTrigger asChild>
                                <div className="relative w-[600px]">
                                  <Input
                                    value={newCodeCheckAddress}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setNewCodeCheckAddress(value);
                                      searchAddress(value);
                                      setSelectedLocation(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="Enter address..."
                                    className="h-10 text-sm bg-white border-2 border-gray-300 focus:border-[#64B6AC] shadow-sm text-gray-900 w-full"
                                    autoComplete="off"
                                  />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-[600px] p-0" 
                                align="start" 
                                sideOffset={5}
                                style={{ position: 'absolute', zIndex: 50 }}
                              >
                                <div className="overflow-hidden rounded-lg border shadow-md bg-white">
                                  {!newCodeCheckAddress ? (
                                    <div className="py-6 text-center text-sm text-gray-500">
                                      Start typing to search for an address
                                    </div>
                                  ) : newCodeCheckAddress.length < 6 ? (
                                    <div className="py-6 text-center text-sm text-gray-500">
                                      Please enter more of your address
                                    </div>
                                  ) : addressSuggestions.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-gray-500">
                                      No address found
                                    </div>
                                  ) : (
                                    <div className="max-h-[200px] overflow-auto py-1">
                                      {addressSuggestions.map((feature) => (
                                        <div
                                          key={feature.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleAddressSelect(feature);
                                          }}
                                          className="flex items-center px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-100"
                                        >
                                          <MapPin className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                                          <span className="text-gray-900">{feature.place_name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="w-48">
                            <Input
                              value={newCodeCheckZoning}
                              onChange={(e) => {
                                const codes = e.target.value.split(',').map(code => code.trim());
                                setNewCodeCheckZoning(codes.join(', '));
                              }}
                              placeholder="Zoning codes (R1, C2...)"
                              className="h-10 text-sm bg-white border-2 border-gray-300 focus:border-[#64B6AC] shadow-sm"
                            />
                          </div>

                          <Button 
                            className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white h-10 px-4"
                            onClick={handleCreateCodeCheck}
                            disabled={isSubmitting || !selectedLocation}
                          >
                            {isSubmitting ? 'Creating...' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {importMode === 'existing' && (
                      <div className="bg-gray-50 rounded-lg p-4 animate-in fade-in duration-300">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor="address">Search Address</Label>
                            <Input
                              id="address"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Enter address..."
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Select
                              value={sortBy || ''}
                              onValueChange={(value: string) => {
                                setSortBy(value as 'address' | 'date' | null);
                                if (value) {
                                  setSites(prev => [...prev]); // Trigger re-sort
                                }
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="address">Address</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                setSites(prev => [...prev]); // Trigger re-sort
                              }}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-[250px] w-full rounded-md border">
                          <div className="space-y-2 p-4">
                            {filteredSites.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-[300px] space-y-4 text-center">
                                <p className="text-gray-600">No code check has been run for this address.</p>
                                <Button 
                                  onClick={() => router.push('/')}
                                  className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white"
                                >
                                  Add Code Check
                                </Button>
                              </div>
                            ) : (
                              filteredSites.map(site => {
                                const isAttached = codeChecks.some(check => check.id === site.id)
                                const isInOtherProject = sitesInOtherProjects.includes(site.id)
                                
                                return (
                                  <div 
                                    key={site.id} 
                                    onClick={() => handleSiteClick(site)}
                                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                                      isAttached ? 'border-green-600 bg-green-100' :
                                      isInOtherProject ? 'border-yellow-600 bg-yellow-50' :
                                      'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500" />
                                          <span className={`font-medium ${
                                            isAttached ? 'text-green-900' :
                                            isInOtherProject ? 'text-yellow-900' :
                                            'text-gray-900'
                                          }`}>
                                            {site.address}
              </span>
            </div>
                                        {isAttached && (
                                          <span className="text-sm text-green-700">Click to remove from project</span>
                                        )}
                                        {!isAttached && isInOtherProject && (
                                          <span className="text-sm text-yellow-600">Added to another project</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created {new Date(site.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <span className={`px-2 py-1 rounded-full text-sm ${
                                          site.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-300' :
                                          site.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                          'bg-gray-50 text-gray-700 border border-gray-200'
                                        }`}>
                                          {site.status}
                                        </span>
                                        {site.zoning_codes && typeof site.zoning_codes === 'string' ? 
                                          JSON.parse(site.zoning_codes)?.map((code: string, index: number) => (
                                            <span key={index} className="px-2 py-1 rounded-full text-sm bg-gray-50 text-gray-600 border border-gray-200">
                                              {code}
                                            </span>
                                          )) : 
                                          Array.isArray(site.zoning_codes) && site.zoning_codes.map((code, index) => (
                                            <span key={index} className="px-2 py-1 rounded-full text-sm bg-gray-50 text-gray-600 border border-gray-200">
                                              {code}
                                            </span>
                                          ))
                                        }
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </ScrollArea>

                        <Button 
                          onClick={handleAddSitesToProject}
                          disabled={selectedSites.length === 0}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Add Selected Sites
                        </Button>
                      </div>
                    )}

                    {importMode === 'batch' && (
                      <div className="bg-gray-50 rounded-lg p-6 animate-in fade-in duration-300">
                        <div className="text-center">
                          <FolderUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Batch Import Code Checks</h3>
                          <div className="text-gray-500 mb-6 space-y-2">
                            <p>Upload a file containing addresses to create multiple code checks at once.</p>
                            <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="font-medium text-blue-800 mb-1">File Requirements:</p>
                              <ul className="list-disc list-inside text-blue-700 space-y-1">
                                <li>Accepts CSV or Excel (.xlsx) files</li>
                                <li>First row should be a header</li>
                                <li>Addresses should be in the first column</li>
                                <li>One address per row</li>
                              </ul>
                            </div>
                          </div>
                          <div className={`p-6 border-2 border-dashed rounded-lg ${
                            batchFileInput ? "border-green-500/50 bg-green-50" : "border-gray-200"
                          }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.add('bg-gray-50');
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!batchFileInput) {
                                e.currentTarget.classList.remove('bg-gray-50');
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files[0];
                              if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
                                const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                                handleBatchFileChange(event);
                              } else {
                                toast({
                                  title: "Invalid File Type",
                                  description: "Please upload a CSV or Excel (.xlsx) file.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Input
                              type="file"
                              accept=".csv,.xlsx"
                              onChange={handleBatchFileChange}
                              className="hidden"
                              ref={batchFileInputRef}
                            />
                            <div className="flex flex-col items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => batchFileInputRef.current?.click()}
                                className="border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Choose File
                              </Button>
                              <p className="text-sm text-gray-500">or drag and drop your file here</p>
                            </div>
                            
                            {isBatchProcessing && (
                              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Processing file...
                              </div>
                            )}
                            
                            {batchFileInput && !isBatchProcessing && (
                              <div className="mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                  <FileText className="h-4 w-4" />
                                  <span>{batchFileInput.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                    onClick={() => {
                                      setBatchFileInput(null);
                                      setBatchAddresses([]);
                                      if (batchFileInputRef.current) {
                                        batchFileInputRef.current.value = '';
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {batchAddresses.length > 0 && (
                                  <div className="text-left">
                                    <h4 className="font-medium mb-2">Found {batchAddresses.length} addresses:</h4>
                                    <div className="max-h-[200px] overflow-auto border rounded-md bg-white">
                                      {batchAddresses.map((address, index) => (
                                        <div key={index} className="px-3 py-2 border-b last:border-b-0 text-sm text-gray-600">
                                          {address}
                                        </div>
                                      ))}
                                    </div>
                                    <Button
                                      onClick={handleBatchCreateCodeChecks}
                                      disabled={isSubmitting}
                                      className="w-full mt-4 bg-[#64B6AC] hover:bg-[#5BA69C] text-white"
                                    >
                                      {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Processing...
                                        </div>
                                      ) : (
                                        `Create ${batchAddresses.length} Code Checks`
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          <Card className="mb-8" style={{ backgroundColor: '#f3f4f6' }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  {isEditModalOpen ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project_description">Description</Label>
                        <Input
                          id="project_description"
                          value={editedProject?.project_description || ''}
                          onChange={(e) => setEditedProject({...editedProject!, project_description: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <Label htmlFor="client_name">Client</Label>
                          <Input
                            id="client_name"
                            value={editedProject?.client_name || ''}
                            onChange={(e) => setEditedProject({...editedProject!, client_name: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div className="flex gap-4 flex-1">
                          <div className="flex-1">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                              id="start_date"
                              type="date"
                              value={editedProject?.start_date || ''}
                              onChange={(e) => setEditedProject({...editedProject!, start_date: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                              id="end_date"
                              type="date"
                              value={editedProject?.end_date || ''}
                              onChange={(e) => setEditedProject({...editedProject!, end_date: e.target.value})}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-6 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>Client:</strong> {project.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span><strong>Duration:</strong> {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p><strong>Description:</strong> {project.project_description}</p>
                    </>
                  )}
                </div>
                
                {codeChecks.length > 0 ? (
                  <div>
                    <div className="flex flex-col lg:flex-row rounded-lg overflow-hidden border border-gray-200">
                      <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px] relative">
                        <div className="absolute inset-0">
                          <ProjectMap 
                            codeChecks={codeChecks} 
                            selectedCheckId={selectedCheckId}
                            onSelectCheck={handleSelectCheck}
                            defaultCenter={codeChecks.length > 0 ? 
                              { lat: codeChecks[0].latitude, lng: codeChecks[0].longitude } : 
                              { lat: 39.8283, lng: -98.5795 }}
                            defaultZoom={codeChecks.length > 0 ? 10 : 4}
                            mapCenter={mapCenter}
                          />
                        </div>
                      </div>
                      <div className="w-full lg:w-1/2 h-[600px] bg-gray-900 flex flex-col">
                        <div className="p-3 border-b border-gray-800 bg-gray-900">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-white">Code Check Locations</h3>
                              <p className="text-sm text-gray-400">{codeChecks.length} locations</p>
                            </div>
                            <Select>
                              <SelectTrigger className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white border-none w-[160px]" disabled={selectedCodeChecks.length === 0}>
                                <div className="flex items-center gap-2">
                                  <ArrowUpFromLine className="h-4 w-4" />
                                  <span>Export ({selectedCodeChecks.length})</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf" onSelect={handleExportPDF}>
                                  <div className="flex items-center gap-2 w-full">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span>Export as PDF</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="csv" onSelect={handleExportCSV}>
                                  <div className="flex items-center gap-2 w-full">
                                    <Table className="h-4 w-4 shrink-0" />
                                    <span>Export as CSV</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-3">
                            <div className="relative">
                              <Input
                                placeholder="Search code checks..."
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#64B6AC]"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <FileSearch className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto border-l border-gray-800">
                          {codeChecks
                            .filter(check => !address || check.address.toLowerCase().includes(address.toLowerCase()))
                            .map(check => (
                            <div
                              key={check.id}
                              className={`p-4 border-b border-gray-800 cursor-pointer transition-colors hover:bg-gray-800 ${
                                selectedCheckId === check.id ? 'bg-gray-800 border-l-4 border-l-[#64B6AC]' : ''
                              }`}
                              onClick={() => setSelectedCheckId(check.id)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={selectedCodeChecks.includes(check.id)}
                                      onCheckedChange={(checked) => {
                                        setSelectedCodeChecks(prev => 
                                          checked 
                                            ? [...prev, check.id]
                                            : prev.filter(id => id !== check.id)
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="border-gray-600 data-[state=checked]:bg-[#64B6AC] data-[state=checked]:border-[#64B6AC]"
                                    />
                                    <p className="font-medium text-white">{check.address}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    check.status === 'completed' ? 'bg-green-900 text-green-100' :
                                    check.status === 'in_progress' ? 'bg-blue-900 text-blue-100' :
                                    'bg-gray-800 text-gray-100'
                                  }`}>
                                    {check.status}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <a
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPreviewCheckId(check.id);
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 bg-[#64B6AC] hover:bg-[#5BA69C] text-white text-sm font-medium rounded-md transition-colors cursor-pointer"
                                    >
                                      View Details
                                    </a>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-100/50 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Remove Code Check",
                                          description: "Are you sure you want to remove this code check from the project?",
                                          action: (
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveFromProject(check.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white border-none"
                                              >
                                                Remove
                                              </Button>
                                            </div>
                                          ),
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col lg:flex-row rounded-lg overflow-hidden border border-gray-200">
                      <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px] relative">
                        <div className="absolute inset-0">
                          <ProjectMap 
                            codeChecks={[]} 
                            selectedCheckId={null}
                            onSelectCheck={() => {}}
                            defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
                            defaultZoom={4}
                            mapCenter={mapCenter}
                          />
                        </div>
                      </div>
                      <div className="w-full lg:w-1/2 h-[600px] bg-gray-900 flex flex-col">
                        <div className="p-3 border-b border-gray-800 bg-gray-900">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-white">Code Check Locations</h3>
                              <p className="text-sm text-gray-400">0 locations</p>
                            </div>
                            <Select>
                              <SelectTrigger className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white border-none w-[160px]" disabled={selectedCodeChecks.length === 0}>
                                <div className="flex items-center gap-2">
                                  <ArrowUpFromLine className="h-4 w-4" />
                                  <span>Export ({selectedCodeChecks.length})</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf" onSelect={handleExportPDF}>
                                  <div className="flex items-center gap-2 w-full">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span>Export as PDF</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="csv" onSelect={handleExportCSV}>
                                  <div className="flex items-center gap-2 w-full">
                                    <Table className="h-4 w-4 shrink-0" />
                                    <span>Export as CSV</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-3">
                            <div className="relative">
                              <Input
                                placeholder="Search code checks..."
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#64B6AC]"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <FileSearch className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto border-l border-gray-800">
                          <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <MapPin className="h-12 w-12 text-gray-500 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No Code Checks Yet</h3>
                            <p className="text-gray-400 mb-6">Add your first code check to start analyzing locations</p>
                            <Button 
                              onClick={() => {
                                setIsCodeChecksOpen(true);
                                window.scrollTo({ 
                                  top: 0,
                                  behavior: 'smooth'
                                });
                              }}
                              className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white"
                            >
                              Add Code Checks
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div id="addCodeCheckSection" className="mb-8 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {codeChecks.filter(check => check.status === 'completed').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'completed').length / codeChecks.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {codeChecks.filter(check => check.status === 'in_progress').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'in_progress').length / codeChecks.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {codeChecks.filter(check => check.status === 'pending').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'pending').length / codeChecks.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Code Checks</p>
                  <p className="text-2xl font-semibold text-gray-900">{codeChecks.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="mt-4 flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'completed').length / codeChecks.length) * 100}%` 
                  }}
                />
                <div 
                  className="bg-blue-500 h-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'in_progress').length / codeChecks.length) * 100}%` 
                  }}
                />
                <div 
                  className="bg-yellow-500 h-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => check.status === 'pending').length / codeChecks.length) * 100}%` 
                  }}
                />
                <div 
                  className="bg-gray-200 h-full"
                  style={{ 
                    width: `${(codeChecks.filter(check => !['completed', 'in_progress', 'pending'].includes(check.status)).length / codeChecks.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <AddUsersSection />
        </div>
        </div>
      </main>
      
      {/* Add the preview component at the end */}
      <CodeCheckPreview 
        id={previewCheckId || ''} 
        isOpen={!!previewCheckId} 
        onClose={() => setPreviewCheckId(null)} 
      />
    </div>
  )
}

