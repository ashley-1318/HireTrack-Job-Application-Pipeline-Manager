import { useEffect, useMemo, useState } from "react";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface JobItem {
  id: string;
  title: string;
  description: string;
  department?: string;
  location?: string;
  type?: string;
  skills?: string[];
  postedDate?: string;
  status?: string;
}

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/jobs")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        setJobs(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e?.message || e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return jobs.filter((job) =>
      (job.title || "").toLowerCase().includes(q) ||
      (job.department || "").toLowerCase().includes(q) ||
      (job.location || "").toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Open Positions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore career opportunities and find the perfect role for your skills and ambitions
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-lg text-muted-foreground">Loading jobs…</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-lg text-destructive">Failed to load jobs: {error}</p>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {filteredJobs.map((job, index) => (
              <div key={job.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <JobCard job={job as any} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-lg text-muted-foreground">
              No jobs found matching your search. Try different keywords.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
