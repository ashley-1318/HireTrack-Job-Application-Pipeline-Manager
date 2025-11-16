import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase } from "lucide-react";
import { Candidate } from "@/data/sampleData";
import { defaultPipeline } from "@/data/sampleData";

interface CandidateCardProps {
  candidate: Candidate & { ats?: any };
  onViewDetails: (candidate: Candidate) => void;
  showAts?: boolean;
}

export const CandidateCard = ({ candidate, onViewDetails, showAts }: CandidateCardProps) => {
  const stageInfo = defaultPipeline.stages.find(s => s.name === candidate.stage);
  
  return (
    <Card className="shadow-soft transition-smooth hover:shadow-hover animate-fade-in">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{candidate.name}</h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {candidate.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {candidate.phone}
              </div>
            </div>
          </div>
          <Badge className={stageInfo?.color || 'bg-secondary'}>
            {candidate.stage}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="font-medium">{candidate.jobTitle}</span>
        </div>

        {showAts && candidate.ats && (
          <div className="mb-4 border rounded-lg p-2 bg-muted/30">
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="font-semibold">ATS:</span>
              <span>Score: <span className="font-bold">{candidate.ats.totalScore ?? 'N/A'}</span></span>
              <span>Decision: <span className="font-medium">{candidate.ats.decision ?? 'N/A'}</span></span>
            </div>
            <div className="text-xs mt-1">
              <span className="font-semibold">Breakdown:</span>
              <span> S:{candidate.ats.breakdown?.skill_match ?? 'N/A'} | E:{candidate.ats.breakdown?.experience_match ?? 'N/A'} | Ed:{candidate.ats.breakdown?.education_match ?? 'N/A'} | K:{candidate.ats.breakdown?.keyword_match ?? 'N/A'}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            Applied: {new Date(candidate.appliedDate).toLocaleDateString()}
          </span>
          <Button size="sm" variant="outline" onClick={() => onViewDetails(candidate)}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
