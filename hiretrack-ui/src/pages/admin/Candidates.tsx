import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Phone, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface ATSData {
  evaluatedAt?: string;
  totalScore?: number;
  decision?: string;
  breakdown?: {
    skill_match?: number;
    experience_match?: number;
    education_match?: number;
    keyword_match?: number;
  };
  explanation?: string;
}

interface Candidate {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  resumeUrl?: string;
  stage: string;
  ats?: ATSData;
  job?: {
    id: string;
    title: string;
  };
}

const statusColor: Record<string, string> = {
  Screening: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Applied: "bg-gray-100 text-gray-700",
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingATS, setPendingATS] = useState(false);

  useEffect(() => {
    fetchCandidates(false);
    // Auto-refresh every 8 seconds if there are pending ATS evaluations
    const interval = setInterval(() => {
      if (pendingATS) {
        fetchCandidates(true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [pendingATS]);

  const fetchCandidates = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get<Candidate[]>("/api/admin/candidates");
      // Check if any candidates are missing ATS scores
      const hasPending = res.data.some(c => !c.ats || !c.ats.totalScore);
      setPendingATS(hasPending);
      setCandidates(prev => {
        // If modal is open, keep the selected candidate stable by merging updates
        if (selectedCandidate) {
          const selId = selectedCandidate.id || selectedCandidate._id;
          const updatedSel = res.data.find(c => (c.id || c._id) === selId);
          if (updatedSel) {
            // Update selected candidate fields without closing the dialog
            setSelectedCandidate({ ...selectedCandidate, ...updatedSel });
          }
        }
        return res.data || [];
      });
    } catch (err: any) {
      toast({
        title: "Failed to load candidates",
        description: err?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const openModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const closeModal = () => {
    setSelectedCandidate(null);
  };

  const overrideDecision = async (id: string, decision: string) => {
    try {
      await axios.patch(`/api/admin/candidates/${id}/override`, {
        decision,
        reason: "Manual override",
      });
      await fetchCandidates();
      toast({
        title: "Success",
        description: "Candidate decision updated!",
      });
      closeModal();
    } catch (err: any) {
      toast({
        title: "Failed to update",
        description: err?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const moveToNextStage = async (candidate: Candidate) => {
    try {
      const id = candidate.id || candidate._id || "";
      // Get job's pipeline to determine next stage
      const jobRes = await axios.get(`/api/jobs/${candidate.jobId}`);
      const job = jobRes.data as any;
      const pipeline = job?.pipelineStages || ['Screening', 'Interview', 'Offer'];
      const fullPipeline = ['Applied', ...pipeline];
      const currentIdx = fullPipeline.indexOf(candidate.stage);
      
      if (currentIdx === -1 || currentIdx >= fullPipeline.length - 1) {
        toast({
          title: "Cannot advance",
          description: "Candidate is already at the final stage",
          variant: "destructive",
        });
        return;
      }
      
      const nextStage = fullPipeline[currentIdx + 1];
      const token = localStorage.getItem('ht_token');
      await axios.patch(`/api/movestage/${id}`, { to: nextStage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCandidates();
      toast({
        title: "Approved",
        description: `Candidate moved to ${nextStage}`,
      });
      closeModal();
    } catch (err: any) {
      toast({
        title: "Failed to approve",
        description: err?.response?.data?.error || err?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const rejectCandidate = async (id: string) => {
    try {
      const token = localStorage.getItem('ht_token');
      await axios.patch(`/api/movestage/${id}`, { to: 'Rejected' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCandidates();
      toast({
        title: "Rejected",
        description: "Candidate has been rejected",
      });
      closeModal();
    } catch (err: any) {
      toast({
        title: "Failed to reject",
        description: err?.response?.data?.error || err?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getDecisionBadgeVariant = (decision?: string) => {
    if (decision === "Screening") return "default";
    if (decision === "Rejected") return "destructive";
    return "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Candidate Screening Overview</h2>
          <p className="text-muted-foreground">
            View all candidates with ATS scores and override decisions
          </p>
        </div>

        {loading && (
          <div className="py-12 text-center text-muted-foreground">
            Loading candidates…
          </div>
        )}

        {!loading && candidates.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No candidates found
          </div>
        )}

        {!loading && candidates.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>ATS Score</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => {
                  const candidateId = candidate.id || candidate._id || "";
                  return (
                    <TableRow key={candidateId}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{candidate.job?.title || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        {candidate.ats?.totalScore ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDecisionBadgeVariant(candidate.ats?.decision)}>
                          {candidate.ats?.decision || "Not Evaluated"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openModal(candidate)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal */}
        <Dialog open={!!selectedCandidate} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {selectedCandidate.name}'s ATS Result
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCandidate.job?.title || "N/A"}</span>
                    </div>
                    {selectedCandidate.resumeUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <a
                          href={selectedCandidate.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Resume
                        </a>
                      </div>
                    )}
                  </div>

                  {/* ATS Score */}
                  <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div>
                        <span className="text-sm text-muted-foreground">ATS Score</span>
                        <div className="text-2xl font-bold">
                          {selectedCandidate.ats?.totalScore ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Decision</span>
                        <div className="mt-1">
                          <Badge variant={getDecisionBadgeVariant(selectedCandidate.ats?.decision)}>
                            {selectedCandidate.ats?.decision || "Not Evaluated"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {selectedCandidate.ats?.explanation && (
                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-1">AI Explanation</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCandidate.ats.explanation}
                        </div>
                      </div>
                    )}

                    {/* Breakdown */}
                    {selectedCandidate.ats?.breakdown && (
                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-2">Score Breakdown</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Skill Match:</span>{" "}
                            <span className="font-medium">
                              {selectedCandidate.ats.breakdown.skill_match ?? "N/A"}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Experience Match:</span>{" "}
                            <span className="font-medium">
                              {selectedCandidate.ats.breakdown.experience_match ?? "N/A"}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Education Match:</span>{" "}
                            <span className="font-medium">
                              {selectedCandidate.ats.breakdown.education_match ?? "N/A"}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Keyword Match:</span>{" "}
                            <span className="font-medium">
                              {selectedCandidate.ats.breakdown.keyword_match ?? "N/A"}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Current Stage */}
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-2">Current Stage</div>
                    <Badge className="text-base px-3 py-1">
                      {selectedCandidate.stage || "Applied"}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    {selectedCandidate.stage !== 'Rejected' && (
                      <Button
                        className="flex-1"
                        variant="default"
                        onClick={() => moveToNextStage(selectedCandidate)}
                      >
                        Approve & Move to Next Stage
                      </Button>
                    )}
                    {selectedCandidate.stage !== 'Rejected' && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() =>
                          rejectCandidate(
                            selectedCandidate.id || selectedCandidate._id || ""
                          )
                        }
                      >
                        Reject
                      </Button>
                    )}
                    {selectedCandidate.stage === 'Rejected' && (
                      <div className="text-sm text-muted-foreground italic">This candidate has been rejected</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Candidates;
