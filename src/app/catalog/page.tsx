// Homepage for the catalog.

'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CatalogHeader } from '@/components/catalog-header'
import { CatalogFilter, FilterOptions } from '@/components/catalog-filter'
import { CatalogList } from '@/components/catalog-list'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from "@/components/loading-spinner";


export default function CatalogPage() {
  const [catalogItems, setCatalogItems] = useState([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCatalogItems()
  }, [])

  async function fetchCatalogItems(filters?: FilterOptions) {
    try {
      let query = supabase.from('catalog').select('*')

      if (filters) {
        if (filters.search) {
          query = query.ilike('city_name', `%${filters.search}%`)
        }
        if (filters.state && filters.state !== 'all_states') {
          query = query.eq('state', filters.state)
        }
        if (filters.population && filters.population !== 'all_populations') {
          const [min, max] = filters.population.split('-').map(Number)
          query = query.gte('population', min).lte('population', max || 9999999999)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setCatalogItems(data as typeof catalogItems)
    } catch (error) {
      console.error('Error fetching catalog items:', error)
      setError('Failed to fetch catalog items')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filters: FilterOptions) => {
    fetchCatalogItems(filters)
  }

  const handleSelectItem = (id: number) => {
    router.push(`/catalog/${id}`)
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

  if (error) return <div>Error: {error}</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CatalogHeader />
          <CatalogFilter onFilterChange={handleFilterChange} />
          <CatalogList items={catalogItems} onSelectItem={handleSelectItem} />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          © 2025 GovGoose Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
