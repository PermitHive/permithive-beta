import React from 'react'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Search, Filter } from 'lucide-react'

const SearchBar: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-grow">
        <Input type="text" placeholder="Search projects..." className="pl-10 pr-4 py-2" />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
      </div>
      <Button variant="outline" className="flex items-center">
        <Filter size={18} className="mr-2" />
        Filters
      </Button>
    </div>
  )
}

export default SearchBar

