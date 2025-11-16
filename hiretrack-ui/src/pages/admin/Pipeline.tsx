import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { defaultPipeline } from "@/data/sampleData";
import { Plus, GripVertical, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getJobs, updateJob } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Pipeline = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [stages, setStages] = useState(defaultPipeline.stages);
  const { toast } = useToast();
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  useEffect(() => {
    let active = true;
    getJobs()
      .then((data) => { if (active) setJobs(data || []); })
      .catch((e) => toast({ title: 'Failed to load jobs', description: String(e?.message || e), variant: 'destructive' }));
    return () => { active = false; };
  }, [toast]);

  useEffect(() => {
    if (selectedJob) {
      const ps: string[] = Array.isArray(selectedJob.pipelineStages) ? selectedJob.pipelineStages : ['Screening','Interview','Offer'];
      // Map to UI with order and color
      setStages(ps.map((name, idx) => ({ id: String(idx+1), name, order: idx+1, color: defaultPipeline.stages[idx % defaultPipeline.stages.length].color })));
    }
  }, [selectedJob]);

  const handleAddStage = async () => {
    if (!selectedJobId) return;
    const next = [...stages, { id: String(stages.length + 1), name: 'New Stage', order: stages.length + 1, color: 'bg-purple-100 text-purple-800' }];
    setStages(next);
    try {
      await updateJob(selectedJobId, { pipelineStages: next.map(s => s.name) });
      toast({ title: 'Stage Added', description: 'Pipeline stage has been created.' });
    } catch (e: any) {
      toast({ title: 'Failed to update pipeline', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedJobId) return;
    const next = stages.filter(s => s.id !== stageId).map((s, i) => ({ ...s, order: i + 1 }));
    setStages(next);
    try {
      await updateJob(selectedJobId, { pipelineStages: next.map(s => s.name) });
      toast({ title: 'Stage Deleted', description: 'Pipeline stage has been removed.' });
    } catch (e: any) {
      toast({ title: 'Failed to update pipeline', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">Pipeline Builder</h2>
            <p className="text-muted-foreground">Create and customize your hiring pipeline stages</p>
          </div>
          <div className="min-w-[240px]">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddStage} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Stage
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Hiring Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {stage.order}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{stage.name}</h4>
                  </div>
                  <Badge className={stage.color}>
                    {stage.name}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteStage(stage.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Add New Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input placeholder="Stage name (e.g., Phone Screen)" className="flex-1" />
              <Button onClick={handleAddStage}>Add Stage</Button>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Visualization */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Pipeline Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-center">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <Badge className={`${stage.color} px-4 py-2 text-sm`}>
                    {stage.name}
                  </Badge>
                  {index < stages.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pipeline;
