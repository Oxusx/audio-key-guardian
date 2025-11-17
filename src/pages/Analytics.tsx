import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, TrendingUp } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const { isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    totalAmount: 0,
    totalPageViews: 0,
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [investmentTrends, setInvestmentTrends] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    // Fetch total stats
    const { data: investments } = await supabase.from('investments').select('*');
    const { data: activities } = await supabase.from('activity_logs').select('*');
    const { data: events } = await supabase.from('analytics_events').select('*');

    const uniqueUsers = new Set(activities?.map(a => a.user_email).filter(Boolean));
    const totalAmount = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
    const pageViews = activities?.filter(a => a.action_type === 'page_view').length || 0;

    setStats({
      totalUsers: uniqueUsers.size,
      totalInvestments: investments?.length || 0,
      totalAmount,
      totalPageViews: pageViews,
    });

    // Activity trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const activityByDay = last7Days.map(date => {
      const count = activities?.filter(a => 
        a.created_at.startsWith(date)
      ).length || 0;
      return { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), activities: count };
    });
    setActivityData(activityByDay);

    // Investment trends
    const investmentsByDay = last7Days.map(date => {
      const dayInvestments = investments?.filter(inv => 
        inv.created_at.startsWith(date)
      ) || [];
      const amount = dayInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
      return { 
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        amount,
        count: dayInvestments.length 
      };
    });
    setInvestmentTrends(investmentsByDay);

    // Event type distribution
    const eventTypeCounts: Record<string, number> = {};
    events?.forEach(e => {
      eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1;
    });
    const eventTypeData = Object.entries(eventTypeCounts).map(([name, value]) => ({ name, value }));
    setEventTypes(eventTypeData);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track engagement, investments, and user behavior</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Active unique users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvestments}</div>
              <p className="text-xs text-muted-foreground">Investment transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total invested</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPageViews}</div>
              <p className="text-xs text-muted-foreground">Total page views</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
            <TabsTrigger value="investments">Investment Trends</TabsTrigger>
            <TabsTrigger value="events">Event Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Over Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="activities" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Investment Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={investmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {eventTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
