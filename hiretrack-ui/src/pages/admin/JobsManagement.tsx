import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getJobs, createJob, updateJob, deleteJob } from "@/lib/api";
import { Plus, Pencil, Trash2, MapPin, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const JobsManagement = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    getJobs()
      .then((data) => { if (active) setJobs(Array.isArray(data) ? data : []); })
      .catch((e) => toast({ title: "Failed to load jobs", description: String(e?.message || e), variant: "destructive" }));
    return () => { active = false; };
  }, [toast]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const payload: any = {
      title: String(form.get('title') || ''),
      department: String(form.get('department') || ''),
      location: String(form.get('location') || ''),
      type: String(form.get('type') || ''),
      description: String(form.get('description') || ''),
      requirements: String(form.get('requirements') || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      skills: String(form.get('skills') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      status: 'open',
      pipelineStages: ['Screening','Interview','Offer'],
    };
    if (!payload.title || !payload.description) {
      toast({ title: 'Missing fields', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    try {
      setCreating(true);
      const created = await createJob(payload);
      setJobs((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      toast({ title: 'Job Created', description: 'New job position has been posted successfully.' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast({ title: 'Create failed', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    const form = new FormData(e.target as HTMLFormElement);
    const payload: any = {
      title: String(form.get('title') || ''),
      department: String(form.get('department') || ''),
      location: String(form.get('location') || ''),
      type: String(form.get('type') || ''),
      description: String(form.get('description') || ''),
      requirements: String(form.get('requirements') || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      skills: String(form.get('skills') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      status: String(form.get('status') || 'open'),
    };
    if (!payload.title || !payload.description) {
      toast({ title: 'Missing fields', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    try {
      setUpdating(true);
      const updated = await updateJob(editingJob.id, payload);
      setJobs((prev) => prev.map(j => j.id === updated.id ? updated : j));
      setIsEditOpen(false);
      setEditingJob(null);
      toast({ title: 'Job Updated', description: 'Job has been updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;
    try {
      setDeleting(true);
      await deleteJob(deleteJobId);
      setJobs((prev) => prev.filter(j => j.id !== deleteJobId));
      setDeleteJobId(null);
      toast({ title: 'Job Deleted', description: 'Job has been removed successfully.' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Jobs Management</h2>
            <p className="text-muted-foreground">
              Create and manage job postings
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input id="title" name="title" placeholder="e.g. Senior Frontend Developer" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input id="department" name="department" placeholder="e.g. Engineering" required />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" name="location" placeholder="e.g. Remote" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type *</Label>
                    <Input id="type" name="type" placeholder="e.g. Full-time" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea 
                    id="description" 
                    name="description"
                    placeholder="Describe the role and responsibilities..." 
                    rows={4}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (one per line)</Label>
                  <Textarea 
                    id="requirements" 
                    name="requirements"
                    placeholder="5+ years of experience&#10;Expert in React&#10;Strong communication skills" 
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Required Skills (comma separated)</Label>
                  <Input id="skills" name="skills" placeholder="React, TypeScript, TailwindCSS" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={creating}>{creating ? 'Creating…' : 'Create Job'}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingJob(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditJob} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Job Title *</Label>
                    <Input id="edit-title" name="title" defaultValue={editingJob?.title} placeholder="e.g. Senior Frontend Developer" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department *</Label>
                    <Input id="edit-department" name="department" defaultValue={editingJob?.department} placeholder="e.g. Engineering" required />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location *</Label>
                    <Input id="edit-location" name="location" defaultValue={editingJob?.location} placeholder="e.g. Remote" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Job Type *</Label>
                    <Input id="edit-type" name="type" defaultValue={editingJob?.type} placeholder="e.g. Full-time" required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <select id="edit-status" name="status" defaultValue={editingJob?.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Job Description *</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description"
                    defaultValue={editingJob?.description}
                    placeholder="Describe the role and responsibilities..." 
                    rows={4}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-requirements">Requirements (one per line)</Label>
                  <Textarea 
                    id="edit-requirements" 
                    name="requirements"
                    defaultValue={editingJob?.requirements?.join('\n')}
                    placeholder="5+ years of experience&#10;Expert in React&#10;Strong communication skills" 
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-skills">Required Skills (comma separated)</Label>
                  <Input id="edit-skills" name="skills" defaultValue={editingJob?.skills?.join(', ')} placeholder="React, TypeScript, TailwindCSS" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={updating}>{updating ? 'Updating…' : 'Update Job'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditingJob(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this job posting. All associated candidates will remain in the system but won't be linked to this job.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteJob} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? 'Deleting…' : 'Delete Job'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4">
          {jobs.map((job, index) => (
            <Card 
              key={job.id} 
              className="shadow-soft hover:shadow-hover transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                          <Badge variant="outline">{job.type}</Badge>
                          <Badge className={job.status === 'open' ? 'bg-accent' : 'bg-muted'}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 5).map((skill) => (
                        <span 
                          key={skill} 
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => {
                        setEditingJob(job);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteJobId(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobsManagement;
