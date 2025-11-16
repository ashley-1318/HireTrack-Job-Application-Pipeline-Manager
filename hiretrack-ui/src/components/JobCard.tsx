import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Calendar } from "lucide-react";
interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    department?: string;
    location?: string;
    type?: string;
    skills?: string[];
    postedDate?: string;
  };
}

export const JobCard = ({ job }: JobCardProps) => {
  return (
    <Card className="shadow-soft transition-smooth hover:shadow-hover hover:scale-[1.02] animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl">{job.title}</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {job.department}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
          </Badge>
          <Badge variant="outline">{job.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {job.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {(job.skills || []).slice(0, 3).map((skill) => (
            <span 
              key={skill} 
              className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
            >
              {skill}
            </span>
          ))}
          {job.skills && job.skills.length > 3 && (
            <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {job.postedDate ? new Date(job.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        </div>
        <Link to={`/jobs/${job.id}`}>
          <Button size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
