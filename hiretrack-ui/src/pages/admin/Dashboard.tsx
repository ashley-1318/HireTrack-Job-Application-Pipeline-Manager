import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, GitBranch, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboardStats()
      .then((d) => { if (active) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (active) {
          setLoading(false);
          toast({ title: 'Failed to load dashboard stats', description: String(e?.message || e), variant: 'destructive' });
        }
      });
    return () => { active = false; };
  }, [toast]);

  const stats = data ? [
    {
      title: "Total Jobs",
      value: data.totalJobs || 0,
      icon: Briefcase,
      description: `${data.openJobs || 0} active positions`,
      color: "text-primary"
    },
    {
      title: "Total Candidates",
      value: data.totalCandidates || 0,
      icon: Users,
      description: `${data.totalCandidates || 0} applications received`,
      color: "text-accent"
    },
    {
      title: "Active Pipelines",
      value: Object.keys(data.stageMap || {}).length,
      icon: GitBranch,
      description: "Hiring workflows",
      color: "text-blue-500"
    },
    {
      title: "Hired This Month",
      value: data.stageMap?.['Hired'] || 0,
      icon: TrendingUp,
      description: "Successful hires",
      color: "text-emerald-500"
    }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your recruitment.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="shadow-soft hover:shadow-hover transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft animate-slide-up">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading activity…</p>}
            {!loading && data?.recentActivity?.length === 0 && <p className="text-sm text-muted-foreground">No recent activity</p>}
            {!loading && data?.recentActivity && data.recentActivity.length > 0 && (
              <div className="space-y-4">
                {data.recentActivity.map((activity: any) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(activity.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-muted-foreground">Loading pipeline…</p>}
              {!loading && data?.stageMap && (
                <div className="space-y-3">
                  {Object.entries(data.stageMap).map(([stage, count]: [string, any]) => (
                    <div key={stage} className="flex justify-between items-center">
                      <span className="text-sm">{stage}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-muted-foreground">Loading summary…</p>}
              {!loading && data && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Jobs</span>
                    <span className="font-semibold">{data.totalJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Open Positions</span>
                    <span className="font-semibold text-primary">{data.openJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Candidates</span>
                    <span className="font-semibold">{data.totalCandidates}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Unique Stages</span>
                    <span className="font-semibold text-accent">{Object.keys(data.stageMap || {}).length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
