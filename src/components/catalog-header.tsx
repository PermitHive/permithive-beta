import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const CatalogHeader: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Municipality Catalog</CardTitle>
        <CardDescription>
          Explore detailed information about various municipalities, including permitting processes, zoning regulations, and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          This catalog provides comprehensive data on cities and towns, helping you navigate local regulations and requirements for construction and development projects.
        </p>
      </CardContent>
    </Card>
  )
}

