import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { JobCard } from "@/components/JobCard";
import { ArrowRight, Target, Users, TrendingUp } from "lucide-react";
import { getJobs } from "@/lib/api";

const Home = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJobs()
      .then((data) => { if (active) { setJobs(Array.isArray(data) ? data : []); setError(null); } })
      .catch((e) => { if (active) setError(String(e?.message || e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="gradient-hero text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Dream Career Starts Here
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Join innovative companies and build your future with HireTrack
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/jobs">
                <Button size="lg" variant="secondary" className="group">
                  Explore Open Positions
                  <ArrowRight className="ml-2 h-4 w-4 transition-smooth group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Targeted Opportunities</h3>
              <p className="text-muted-foreground">
                Find roles that match your skills and career goals perfectly
              </p>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Companies</h3>
              <p className="text-muted-foreground">
                Connect with leading employers across various industries
              </p>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
              <p className="text-muted-foreground">
                Advance your career with roles that offer growth and development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section (Live) */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Opportunities</h2>
            <p className="text-lg text-muted-foreground">
              Discover exciting roles from companies looking for talent like you
            </p>
          </div>
          
          {loading && (
            <div className="text-center py-8 text-muted-foreground">Loading featured jobs…</div>
          )}
          {!loading && error && (
            <div className="text-center py-8 text-destructive">Failed to load jobs: {error}</div>
          )}
          {!loading && !error && (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {jobs.slice(0, 4).map((job, index) => (
                <div key={job.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          )}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No jobs yet. Check back soon.</div>
          )}
          
          <div className="text-center">
            <Link to="/jobs">
              <Button size="lg" variant="outline">
                View All Positions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start your application today and join thousands of successful candidates
          </p>
          <Link to="/jobs">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 HireTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
