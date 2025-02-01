import React from 'react'
import { Button } from "./ui/button"
import { Upload } from 'lucide-react'

const FileDropZone: React.FC = () => {
  return (
    <div className="border-2 border-dashed border-input rounded-lg p-8 text-center transition-all duration-300 hover:border-primary">
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Drag and drop project files here, or click to select files</p>
      <input type="file" className="hidden" multiple />
      <Button variant="outline" className="mt-4">Select Files</Button>
    </div>
  )
}

export default FileDropZone

// Note: No longer needed, but keeping it for reference. 
// This was used to handle file uploads in the hero component.
