'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, User } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import AuthError from '@/components/auth-error'
import { LoadingScreen } from "@/components/loading-spinner"
import { useDebounce } from '@/lib/hooks/use-debounce'

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
  code_checks_count: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('created_at')
  const [filterBy, setFilterBy] = useState('')
  const [newProject, setNewProject] = useState({
    project_title: '',
    project_description: '',
    start_date: '',
    end_date: '',
    client_name: '',
  })
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false)
  const [authError, setAuthError] = useState(false)
  const router = useRouter()
  const debouncedFilterBy = useDebounce(filterBy, 300)

  // Initial load of projects
  useEffect(() => {
    fetchProjects()
  }, [])

  // Handle sorting and filtering
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...allProjects]
    
    if (debouncedFilterBy) {
      const searchTerm = debouncedFilterBy.toLowerCase()
      filtered = filtered.filter(project => 
        project.client_name.toLowerCase().includes(searchTerm) ||
        project.project_title.toLowerCase().includes(searchTerm) ||
        project.project_description.toLowerCase().includes(searchTerm)
      )
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'start_date') {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      }
      if (sortBy === 'client_name') {
        return b.client_name.localeCompare(a.client_name)
      }
      return 0
    })
  }, [allProjects, debouncedFilterBy, sortBy])

  // Update displayed projects when filtered results change
  useEffect(() => {
    setProjects(filteredAndSortedProjects)
  }, [filteredAndSortedProjects])

  async function fetchProjects() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthError(true)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          code_checks_count:project_code_checks(count)
        `)
        .eq('owner_id', user.id)

      if (error) throw error

      // Transform the data to match the Project interface
      const transformedProjects = data.map((project: any) => ({
        ...project,
        code_checks_count: project.code_checks_count[0]?.count || 0
      }))

      setAllProjects(transformedProjects as Project[])
      setProjects(transformedProjects as Project[])
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('auth')) {
        setAuthError(true)
      } else {
        setError(error.message || 'Failed to fetch projects')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No authenticated user')

      if (!newProject.project_title.trim() || !newProject.project_description.trim() || !newProject.client_name.trim()) {
        setError('All fields are required')
        return
      }

      if (newProject.start_date && newProject.end_date) {
        const startDate = new Date(newProject.start_date)
        const endDate = new Date(newProject.end_date)
        if (endDate < startDate) {
          setError('End date cannot be before start date')
          return
        }
      }

      const { error: insertError, data } = await supabase
        .from('projects')
        .insert({
          project_title: newProject.project_title.trim(),
          project_description: newProject.project_description.trim(),
          start_date: newProject.start_date ? new Date(newProject.start_date).toISOString() : null,
          end_date: newProject.end_date ? new Date(newProject.end_date).toISOString() : null,
          client_name: newProject.client_name.trim(),
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) throw insertError

      if (!data || data.length === 0) {
        throw new Error('No data returned after project creation')
      }

      setProjects(prevProjects => [...prevProjects, { ...data[0], code_checks_count: 0 }])
      setNewProject({
        project_title: '',
        project_description: '',
        start_date: '',
        end_date: '',
        client_name: '',
      })
      setShowCreateProjectForm(false)

    } catch (error: any) {
      setError(error.message || 'Failed to create project')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authError) return <AuthError />
  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <Button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowCreateProjectForm(!showCreateProjectForm)}
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>

          {showCreateProjectForm && (
            <form onSubmit={handleCreateProject} className="mb-6 space-y-4">
              <div>
                <Label htmlFor="project_title">Project Title</Label>
                <Input
                  id="project_title"
                  value={newProject.project_title}
                  onChange={(e) => setNewProject({ ...newProject, project_title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="project_description">Project Description</Label>
                <Input
                  id="project_description"
                  value={newProject.project_description}
                  onChange={(e) => setNewProject({ ...newProject, project_description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Create Project</Button>
            </form>
          )}

          <div className="mb-6 flex justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="sortBy">Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="start_date">Start Date</SelectItem>
                  <SelectItem value="client_name">Client Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="filterBy">Filter by client:</Label>
              <Input
                id="filterBy"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.project_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/${project.project_id}`)}
              >
                <CardHeader>
                  <CardTitle>{project.project_title}</CardTitle>
                  <CardDescription>{project.project_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{project.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{project.code_checks_count} code checks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
