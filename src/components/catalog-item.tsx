import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Phone, Mail, Globe } from 'lucide-react'

interface CatalogItemProps {
  item: {
    id: number;
    city_name: string;
    state: string;
    county: string;
    population: number;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    website_url: string;
    city_image_url: string;
  };
  onSelect: (id: number) => void;
}

export const CatalogItem: React.FC<CatalogItemProps> = ({ item, onSelect }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="relative p-0">
        <img
          src={item.city_image_url || '/placeholder-city.jpg'}
          alt={item.city_name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <CardTitle className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
          {item.city_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between p-4">
        <div className="space-y-2">
          <p className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            {item.county}, {item.state}
          </p>
          <p className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            Population: {item.population.toLocaleString()}
          </p>
          <p className="flex items-center text-sm text-gray-500">
            <Phone className="w-4 h-4 mr-2" />
            {item.contact_phone}
          </p>
          <p className="flex items-center text-sm text-gray-500">
            <Mail className="w-4 h-4 mr-2" />
            {item.contact_email}
          </p>
          <p className="flex items-center text-sm text-gray-500">
            <Globe className="w-4 h-4 mr-2" />
            <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Official Website
            </a>
          </p>
        </div>
        <Button onClick={() => onSelect(item.id)} className="mt-4 w-full">
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

