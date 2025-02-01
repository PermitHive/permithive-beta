import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Search, X, Info } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProjectUser {
  id: string;
  name: string;
  email: string;
  role: 'collaborator' | 'viewer';
  avatarUrl?: string;
}

interface RoleChangeDialog {
  isOpen: boolean;
  userId: string;
  newRole: 'collaborator' | 'viewer';
}

export function AddUsersSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState<'collaborator' | 'viewer'>('viewer')
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'collaborator' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'viewer' },
  ])
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [userToRemove, setUserToRemove] = useState<string | null>(null)
  const [roleDialog, setRoleDialog] = useState<RoleChangeDialog>({
    isOpen: false,
    userId: '',
    newRole: 'viewer'
  })

  const handleAddUser = () => {
    if (!newUserEmail) return;
    
    // This would typically validate email and check against backend
    const newUser: ProjectUser = {
      id: Date.now().toString(), // Temporary ID generation
      name: newUserEmail.split('@')[0], // Temporary name from email
      email: newUserEmail,
      role: selectedRole
    };
    
    setProjectUsers(prev => [...prev, newUser]);
    setNewUserEmail('');
    setSelectedRole('viewer');
  }

  const handleRemoveUser = (userId: string) => {
    setUserToRemove(userId)
    setRemoveDialogOpen(true)
  }

  const confirmRemoveUser = () => {
    if (userToRemove) {
      setProjectUsers(users => users.filter(user => user.id !== userToRemove))
      setRemoveDialogOpen(false)
      setUserToRemove(null)
    }
  }

  const handleRoleChange = (userId: string, newRole: 'collaborator' | 'viewer') => {
    setRoleDialog({
      isOpen: true,
      userId,
      newRole
    })
  }

  const confirmRoleChange = () => {
    setProjectUsers(users =>
      users.map(user =>
        user.id === roleDialog.userId ? { ...user, role: roleDialog.newRole } : user
      )
    )
    setRoleDialog({ isOpen: false, userId: '', newRole: 'viewer' })
  }

  return (
    <TooltipProvider>
      <div className="border border-gray-200 bg-white rounded-lg mt-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">Project Users</h2>
          </div>
        </div>
        
        <div className="space-y-4 p-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="new-user-email" className="text-gray-700">Add User by Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter email address..."
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedRole}
                  onValueChange={(value: 'collaborator' | 'viewer') => setSelectedRole(value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaborator">Collaborator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddUser} 
                  className="bg-[#64B6AC] hover:bg-[#5BA69C] text-white"
                  disabled={!newUserEmail}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Role Info:</span>
            </div>
            <Tooltip>
              <TooltipTrigger className="underline text-gray-700">Collaborator</TooltipTrigger>
              <TooltipContent>
                <p>Team member who can run and manage code checks. This is typically your employees' view.</p>
              </TooltipContent>
            </Tooltip>
            <span>•</span>
            <Tooltip>
              <TooltipTrigger className="underline text-gray-700">Viewer</TooltipTrigger>
              <TooltipContent>
                <p>Can only view code checks. This is typically your clients' view.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200 bg-gray-50">
            <div className="p-4 space-y-2">
              {projectUsers.map(user => (
                <div
                  key={user.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          <span className="text-lg font-medium text-gray-600">
                            {user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'collaborator')}
                          className={user.role === 'collaborator' 
                            ? 'bg-[#64B6AC] hover:bg-[#5BA69C] text-white border-none' 
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}
                        >
                          Collaborator
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'viewer')}
                          className={user.role === 'viewer' 
                            ? 'bg-[#64B6AC] hover:bg-[#5BA69C] text-white border-none' 
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}
                        >
                          Viewer
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this user from the project? They will lose access to all project resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveUser} className="bg-red-500 hover:bg-red-600">
                Remove User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={roleDialog.isOpen} onOpenChange={(isOpen) => setRoleDialog(prev => ({ ...prev, isOpen }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Role</AlertDialogTitle>
              <AlertDialogDescription>
                {roleDialog.newRole === 'collaborator' ? (
                  "This will give the user full access to run and manage code checks. Are you sure you want to proceed?"
                ) : (
                  "This will restrict the user to only viewing code checks. They won't be able to create or modify checks. Are you sure?"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRoleChange} className="bg-[#64B6AC] hover:bg-[#5BA69C]">
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
} 