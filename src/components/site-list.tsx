'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, ChevronLeft, ChevronRight, ExternalLink, Trash2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Link from 'next/link'
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import LoadingSpinner from "@/components/loading-spinner"

interface CodeCheck {
  id: string
  address: string
  zoning_codes?: string
  created_at: string
  latitude: number
  longitude: number
  status?: string
  city?: string
}

interface SiteListProps {
  filter?: string;
}

export const SiteList: React.FC<SiteListProps> = ({ filter = 'all' }) => {
  const [codeChecks, setCodeChecks] = useState<CodeCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)
  const [verificationInput, setVerificationInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const sitesPerPage = 10
  const router = useRouter()

  console.log('SiteList rendering with:', { filter, searchQuery, currentPage })

  useEffect(() => {
    fetchCodeChecks()
  }, [filter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [filter, searchQuery])

  async function fetchCodeChecks() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      console.log('Fetching code checks for user:', user.id, { filter })

      let query = supabase
        .from('code_checks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')

      if (filter && filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      console.log('Fetched code checks:', data)
      setCodeChecks(data || [])
    } catch (error) {
      console.error('Error fetching code checks:', error)
      setError('Failed to fetch code checks')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (verificationInput.toLowerCase() !== 'delete') {
      return
    }
    
    try {
      const { error } = await supabase
        .from('code_checks')
        .update({ status: 'deleted' })
        .eq('id', id)

      if (error) throw error

      setCodeChecks(prevChecks => prevChecks.filter(check => check.id !== id))
      setDeleteDialogOpen(false)
      setSelectedCheckId(null)
      setVerificationInput('')
    } catch (error) {
      console.error('Error deleting code check:', error)
    }
  }

  const filteredCodeChecks = codeChecks
    .filter((check) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      const address = check.address?.toLowerCase() || '';
      const zoningCodes = (typeof check.zoning_codes === 'string' ? check.zoning_codes.toLowerCase() : '') || '';
      
      return (
        address.includes(searchLower) ||
        zoningCodes.includes(searchLower)
      );
    });

  const pageCount = Math.ceil(filteredCodeChecks.length / sitesPerPage)
  const currentSites = filteredCodeChecks.slice(
    currentPage * sitesPerPage,
    (currentPage + 1) * sitesPerPage
  )

  const getCodeCheckUrl = (check: CodeCheck) => {
    const params = new URLSearchParams({
      address: encodeURIComponent(check.address || ''),
      latitude: check.latitude.toString(),
      longitude: check.longitude.toString(),
      codeCheckId: check.id
    }).toString()
    return `/code-check?${params}`
  }

  if (loading) return <LoadingSpinner />

  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by address, city, or zoning code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500">
          Showing {currentSites.length} of {filteredCodeChecks.length} sites
        </div>
      </div>

      {/* Sites List */}
      <div className="space-y-4">
        {currentSites.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No sites found</div>
        ) : (
          currentSites.map((check) => (
            <Card 
              key={check.id}
              className="hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('.delete-button')) {
                  router.push(getCodeCheckUrl(check))
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex h-[200px]">
                  <div className="w-1/3 h-full rounded-lg overflow-hidden">
                    <MapComponent 
                      latitude={check.latitude} 
                      longitude={check.longitude} 
                    />
                  </div>
                  <div className="w-2/3 pl-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{check.address}</h3>
                        <Badge 
                          variant={check.status === 'completed' ? 'default' : 'secondary'}
                          className={cn(
                            check.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                            check.status === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 
                            'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          )}
                        >
                          {check.status === 'completed' ? 'Done' : 
                           check.status === 'in_progress' ? 'Active' : 
                           'Not Started'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                            {check.zoning_codes || 'Zoning not specified'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{new Date(check.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(getCodeCheckUrl(check))
                        }}
                      >
                        Open Site <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      <AlertDialog
                        open={selectedCheckId === check.id && deleteDialogOpen}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen(open)
                          if (!open) {
                            setSelectedCheckId(null)
                            setVerificationInput('')
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedCheckId(check.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="flex items-center justify-center delete-button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this code check.
                              <div className="mt-4">
                                <p className="mb-2">Type DELETE to confirm:</p>
                                <input
                                  type="text"
                                  value={verificationInput}
                                  onChange={(e) => setVerificationInput(e.target.value)}
                                  className="w-full p-2 border rounded"
                                  placeholder="Type DELETE"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setSelectedCheckId(null)
                              setDeleteDialogOpen(false)
                              setVerificationInput('')
                            }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => selectedCheckId && handleDelete(selectedCheckId)}
                              disabled={verificationInput.toLowerCase() !== 'delete'}
                              className={verificationInput.toLowerCase() !== 'delete' ? 'bg-gray-400 cursor-not-allowed' : ''}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="py-2">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage === pageCount - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface MapComponentProps {
  latitude: number
  longitude: number
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude }) => {
  const mapContainer = React.useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate coordinates
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-sm text-gray-500">Invalid coordinates</span>
      </div>
    )
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-sm text-gray-500">Mapbox token is missing</span>
      </div>
    )
  }

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 12,
      interactive: false,
      collectResourceTiming: false
    })

    map.on('load', () => {
      new mapboxgl.Marker({ color: '#64B6AC' })
        .setLngLat([longitude, latitude])
        .addTo(map)
      setIsLoading(false)
    })

    map.on('error', (e) => {
      console.error('Map error:', e)
      setMapError('Failed to load map')
      setIsLoading(false)
    })

    return () => {
      map.remove()
    }
  }, [latitude, longitude])

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <span className="text-sm text-gray-500">Loading map...</span>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-500">{mapError}</span>
        </div>
      )}
    </div>
  )
}

export default SiteList;
