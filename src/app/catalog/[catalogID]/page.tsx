// Page for a specific catalog item.

'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileIcon, ExternalLinkIcon } from 'lucide-react'
import { LoadingScreen } from "@/components/loading-spinner"

interface CatalogItem {
  id: number
  city_name: string
  state: string
  county: string
  population: number
  permitting_info: string
  zoning_info: string
  permit_fees: string
  permit_duration: string
  special_requirements: string
  contact_name: string
  contact_email: string
  contact_phone: string
  office_address: string
  office_hours: string
  city_image_url: string
  website_url: string
  latitude: number
  longitude: number
  notes: string
}

interface Document {
  name: string
  url: string
}

export default function CatalogItemPage({
  params,
}: {
  params: Promise<{ catalogID: string }>
}) {
  const resolvedParams = use(params)
  const [item, setItem] = useState<CatalogItem | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Effect triggered with ID:', resolvedParams.catalogID);
    Promise.all([fetchCatalogItem(), fetchDocuments()])
      .finally(() => {
        console.log('Finished loading data');
        setLoading(false)
      });
  }, [resolvedParams.catalogID])

  async function fetchCatalogItem() {
    try {
      console.log('Fetching catalog item with ID:', resolvedParams.catalogID)
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('id', parseInt(resolvedParams.catalogID))
        .single()

      if (error) throw error
      if (!data) throw new Error('Item not found')
      setItem(data)
    } catch (error) {
      console.error('Error fetching catalog item:', error)
      setError('Failed to fetch catalog item')
    }
  }

  async function fetchDocuments() {
    try {
      console.log('Starting fetchDocuments function');
      
      // Fetch from both folders
      const [denverDocs, chicagoDocs] = await Promise.all([
        supabase.storage.from('verified-muni-docs').list('denver-co'),
        supabase.storage.from('verified-muni-docs').list('chicago-il')
      ]);

      if (denverDocs.error) throw denverDocs.error;
      if (chicagoDocs.error) throw chicagoDocs.error;

      const allDocs = [];

      // Process Denver docs
      if (denverDocs.data && denverDocs.data.length > 0) {
        const denverUrls = await Promise.all(
          denverDocs.data.map(async (file) => {
            const { data: signedData, error: signedError } = await supabase
              .storage
              .from('verified-muni-docs')
              .createSignedUrl(`denver-co/${file.name}`, 60 * 60);

            if (signedError) {
              console.error('Error creating signed URL for Denver doc:', signedError);
              return null;
            }

            return {
              name: file.name.replace(/\.[^/.]+$/, ''),
              url: signedData.signedUrl
            };
          })
        );
        allDocs.push(...denverUrls.filter(doc => doc !== null));
      }

      // Process Chicago docs
      if (chicagoDocs.data && chicagoDocs.data.length > 0) {
        const chicagoUrls = await Promise.all(
          chicagoDocs.data.map(async (file) => {
            const { data: signedData, error: signedError } = await supabase
              .storage
              .from('verified-muni-docs')
              .createSignedUrl(`chicago-il/${file.name}`, 60 * 60);

            if (signedError) {
              console.error('Error creating signed URL for Chicago doc:', signedError);
              return null;
            }

            return {
              name: file.name.replace(/\.[^/.]+$/, ''),
              url: signedData.signedUrl
            };
          })
        );
        allDocs.push(...chicagoUrls.filter(doc => doc !== null));
      }

      console.log('Setting documents:', allDocs);
      setDocuments(allDocs);

    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      setDocuments([]);
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return <div className="flex items-center justify-center min-h-screen text-destructive">Error: {error}</div>
  if (!item) return <div className="flex items-center justify-center min-h-screen">Item not found</div>

  return (
    <div className="min-h-screen bg-background">

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* City Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{item.city_name}, {item.state}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{item.notes}</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Key Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">County</label>
                    <p className="mt-1 text-foreground">{item.county}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Population</label>
                    <p className="mt-1 text-foreground">{item.population.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Permitting Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Permitting Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Process</label>
                    <p className="mt-1 text-foreground">{item.permitting_info}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Zoning</label>
                    <p className="mt-1 text-foreground">{item.zoning_info}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fees</label>
                    <p className="mt-1 text-foreground">{item.permit_fees}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p className="mt-1 text-foreground">{item.permit_duration}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact & Documents */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground">{item.contact_name}</p>
                    <p className="text-primary">{item.contact_email}</p>
                    <p className="text-muted-foreground">{item.contact_phone}</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">Office Location</h3>
                    <p className="mt-2 text-foreground">{item.office_address}</p>
                    <p className="mt-1 text-muted-foreground">{item.office_hours}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Related Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.filter(doc => {
                    // Create city-state string like "denver-co" or "chicago-il - THIS IS A SUPER CHEAP FIX FOR A DEMO. We need to fix cataloging later."
                    const cityState = `${item?.city_name?.toLowerCase()}-${item?.state?.toLowerCase()?.substring(0,2)}`
                    return doc.name.toLowerCase().includes(cityState)
                  }).length > 0 ? (
                    <ul className="divide-y divide-border">
                      {documents.filter(doc => {
                        const cityState = `${item?.city_name?.toLowerCase()}-${item?.state?.toLowerCase()?.substring(0,2)}`
                        return doc.name.toLowerCase().includes(cityState)
                      }).map((doc) => (
                        <li key={doc.name} className="py-4">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 hover:bg-accent rounded-md p-2 transition-colors"
                          >
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            </div>
                            <span className="text-sm text-primary hover:text-primary/90">
                              Download
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No documents available</p>
                  )}
                </CardContent>
              </Card>

              {/* Website Link */}
              <Button
                asChild
                className="w-full"
              >
                <a
                  href={item.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Official Website
                  <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
