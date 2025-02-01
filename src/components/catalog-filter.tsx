import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface FilterOptions {
  search: string;
  state: string;
  population: string;
}

export const CatalogFilter: React.FC<{ onFilterChange: (filters: FilterOptions) => void; }> = ({ onFilterChange }) => {
  const [filters, setFilters] = React.useState<FilterOptions>({
    search: '',
    state: '',
    population: '',
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search cities..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="state">State</Label>
        <Select onValueChange={(value) => handleFilterChange('state', value)}>
          <SelectTrigger id="state">
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="CA">California</SelectItem>
            <SelectItem value="NY">New York</SelectItem>
            <SelectItem value="TX">Texas</SelectItem>
            {/* Add more states as needed */}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="population">Population</Label>
        <Select onValueChange={(value) => handleFilterChange('population', value)}>
          <SelectTrigger id="population">
            <SelectValue placeholder="Select population range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="0-50000">0 - 50,000</SelectItem>
            <SelectItem value="50001-100000">50,001 - 100,000</SelectItem>
            <SelectItem value="100001-500000">100,001 - 500,000</SelectItem>
            <SelectItem value="500001+">500,001+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}



