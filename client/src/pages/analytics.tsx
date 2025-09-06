import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: postAnalytics } = useQuery({
    queryKey: ["/api/analytics/posts"],
    enabled: isAuthenticated,
  });

  const { data: tagAnalytics = [] } = useQuery({
    queryKey: ["/api/analytics/tags"],
    enabled: isAuthenticated,
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ["/api/analytics/users"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  const getBarHeight = (count: number, maxCount: number) => {
    return Math.max(10, (count / maxCount) * 100);
  };

  const maxTagCount = Math.max(...tagAnalytics.map((tag: any) => tag.count), 1);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">Key insights into platform activity and user engagement.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Active Users */}
          <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Daily Active Users</h3>
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground" data-testid="active-users-count">
                  {userAnalytics?.activeUsers || 0}
                </p>
                <p className="text-sm font-medium text-accent flex items-center justify-end">
                  <span className="material-symbols-outlined text-base mr-1">arrow_upward</span>
                  <span data-testid="user-growth">{userAnalytics?.growth || 0}%</span>
                </p>
              </div>
            </div>
            <div className="h-64 flex items-end justify-center">
              <div className="w-full h-48 bg-gradient-to-t from-primary/20 to-primary/5 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-primary mb-2 block">trending_up</span>
                  <div className="text-sm text-muted-foreground">User Activity Chart</div>
                  <div className="text-xs text-muted-foreground mt-1">Interactive chart component would go here</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Tags */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Top Tags</h3>
                <p className="text-sm text-muted-foreground">Most Used</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground" data-testid="total-tags">
                  {tagAnalytics.length}
                </p>
                <p className="text-sm font-medium text-accent flex items-center justify-end">
                  <span className="material-symbols-outlined text-base mr-1">arrow_upward</span>
                  <span>Active</span>
                </p>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              {tagAnalytics.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-2xl text-muted-foreground mb-2 block">tag</span>
                  <p className="text-sm text-muted-foreground">No tag data available</p>
                </div>
              ) : (
                tagAnalytics.slice(0, 6).map((tag: any, index: number) => (
                  <div key={tag.tagName} className="grid grid-cols-[1fr_auto] items-center gap-3" data-testid={`tag-analytics-${index}`}>
                    <p className="text-sm font-medium text-foreground truncate" data-testid={`tag-name-${index}`}>
                      {tag.tagName}
                    </p>
                    <div className="w-24 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-300" 
                        style={{ width: `${getBarHeight(tag.count, maxTagCount)}%` }}
                        data-testid={`tag-bar-${index}`}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Post Analytics */}
          <div className="lg:col-span-3 bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Post Activity</h3>
                <p className="text-sm text-muted-foreground">Recent posting trends</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground" data-testid="total-posts">
                  {postAnalytics?.totalPosts || 0}
                </p>
                <p className="text-sm font-medium text-accent flex items-center justify-end">
                  <span className="material-symbols-outlined text-base mr-1">arrow_upward</span>
                  <span data-testid="post-growth">{postAnalytics?.growth || 0}%</span>
                </p>
              </div>
            </div>
            <div className="h-64 flex items-end gap-4">
              {/* Simulated hourly posting data */}
              {[
                { time: "12 AM", activity: 40 },
                { time: "3 AM", activity: 60 },
                { time: "6 AM", activity: 100 },
                { time: "9 AM", activity: 50 },
                { time: "12 PM", activity: 70 },
                { time: "3 PM", activity: 80 },
                { time: "6 PM", activity: 90 },
                { time: "9 PM", activity: 75 },
              ].map((hour, index) => (
                <div key={hour.time} className="flex-1 flex flex-col items-center gap-2" data-testid={`hour-${index}`}>
                  <div 
                    className="w-full bg-primary/30 hover:bg-primary/50 rounded-t-md transition-all cursor-pointer" 
                    style={{ height: `${hour.activity}%` }}
                    data-testid={`hour-bar-${index}`}
                  ></div>
                  <p className="text-xs text-muted-foreground" data-testid={`hour-label-${index}`}>
                    {hour.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-primary mb-2 block">group</span>
                <h3 className="text-2xl font-bold text-foreground" data-testid="stat-total-users">
                  {userAnalytics?.totalUsers || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-accent mb-2 block">forum</span>
                <h3 className="text-2xl font-bold text-foreground" data-testid="stat-recent-posts">
                  {postAnalytics?.recentPosts || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Recent Posts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-chart-3 mb-2 block">trending_up</span>
                <h3 className="text-2xl font-bold text-foreground" data-testid="stat-engagement">
                  {userAnalytics?.activeUsers && userAnalytics?.totalUsers 
                    ? Math.round((userAnalytics.activeUsers / userAnalytics.totalUsers) * 100)
                    : 0}%
                </h3>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
