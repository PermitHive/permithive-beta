'use client'

import React from 'react'

// UI Components Import
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Custom Components
import SearchBar from "@/components/search-bar"
import FilterSection from "@/components/filter-section"
import FileDropZone from "@/components/file-drop-zone"

// Utility functions
import { cn } from "@/lib/utils"

// Icons
import { Moon, Sun, ChevronDown, HardHat, Clipboard, Truck, Users } from 'lucide-react'

export default function DesignSystem() {
  const [darkMode, setDarkMode] = React.useState(false)

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className={`p-8 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground min-h-screen transition-colors duration-300">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-primary">GovGoose Design System</h1>
          <div className="flex items-center space-x-2">
            <Sun size={20} />
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            <Moon size={20} />
          </div>
        </div>
        
        <Tabs defaultValue="components" className="w-full">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>
          <TabsContent value="components">
            <div className="grid gap-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
                <div className="flex flex-col gap-4 max-w-sm">
                  <Input placeholder="Default input" />
                  <Input placeholder="Disabled input" disabled />
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Cards</h2>
                <Card className="max-w-sm">
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card Content</p>
                  </CardContent>
                  <CardFooter>
                    <Button>Action</Button>
                  </CardFooter>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Dropdown</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Open Dropdown <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Action 1</DropdownMenuItem>
                    <DropdownMenuItem>Action 2</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Select</h2>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Radio Group</h2>
                <RadioGroup defaultValue="option1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option1" id="option1" />
                    <Label htmlFor="option1">Option 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option2" id="option2" />
                    <Label htmlFor="option2">Option 2</Label>
                  </div>
                </RadioGroup>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Search and Filters</h2>
                <div className="max-w-2xl">
                  <SearchBar />
                  <FilterSection />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">File Drop Zone</h2>
                <div className="max-w-2xl">
                  <FileDropZone />
                </div>
              </section>
            </div>
          </TabsContent>
          <TabsContent value="typography">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Heading 1</h1>
              <h2 className="text-3xl font-semibold">Heading 2</h2>
              <h3 className="text-2xl font-medium">Heading 3</h3>
              <p className="text-base">Body Text</p>
              <p className="text-sm text-muted-foreground">Small Text</p>
              <p className="text-xs">Extra Small Text</p>
              <code className="text-sm font-mono bg-muted text-muted-foreground rounded px-2 py-1">Monospace Text</code>
            </div>
          </TabsContent>
          <TabsContent value="colors">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <div className="w-12 h-12 rounded-full mr-4 bg-primary"></div>
                <span className="font-medium">Primary</span>
              </div>
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <div className="w-12 h-12 rounded-full mr-4 bg-secondary"></div>
                <span className="font-medium">Secondary</span>
              </div>
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <div className="w-12 h-12 rounded-full mr-4 bg-accent"></div>
                <span className="font-medium">Accent</span>
              </div>
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <div className="w-12 h-12 rounded-full mr-4 bg-muted"></div>
                <span className="font-medium">Muted</span>
              </div>
              <div className="flex items-center p-4 bg-background rounded-lg border">
                <div className="w-12 h-12 rounded-full mr-4 bg-destructive"></div>
                <span className="font-medium">Destructive</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="layout">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Grid System</h2>
              <div className="grid grid-cols-12 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-primary text-primary-foreground p-2 text-center rounded">
                    {i + 1}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Icons</h2>
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <HardHat size={24} className="text-primary" />
                  <span className="text-sm mt-1">Safety</span>
                </div>
                <div className="flex flex-col items-center">
                  <Clipboard size={24} className="text-primary" />
                  <span className="text-sm mt-1">Tasks</span>
                </div>
                <div className="flex flex-col items-center">
                  <Truck size={24} className="text-primary" />
                  <span className="text-sm mt-1">Logistics</span>
                </div>
                <div className="flex flex-col items-center">
                  <Users size={24} className="text-primary" />
                  <span className="text-sm mt-1">Team</span>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

