import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, DollarSign, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Investment {
  id: string;
  user_email: string;
  amount: number;
  project_name: string;
  created_at: string;
}

interface Contract {
  id: string;
  investor_email: string;
  investment_amount: number;
  project_name: string;
  investor_signed_at: string | null;
  admin_signed_at: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin && user) {
      loadDashboardData();
    }
  }, [isAdmin, user]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      // Load investments
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;

      if (investmentsData) {
        setInvestments(investmentsData);
        const total = investmentsData.reduce((sum, inv) => sum + Number(inv.amount), 0);
        setTotalRaised(total);
      }

      // Load contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      if (contractsData) {
        setContracts(contractsData);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Amount', 'Project', 'Date', 'Contract Status'];
    const rows = investments.map(inv => {
      const contract = contracts.find(c => c.investor_email === inv.user_email && c.investment_amount === Number(inv.amount));
      const status = contract
        ? contract.investor_signed_at && contract.admin_signed_at
          ? 'Fully Signed'
          : contract.investor_signed_at
          ? 'Investor Signed'
          : contract.admin_signed_at
          ? 'Admin Signed'
          : 'Pending'
        : 'No Contract';

      return [
        inv.user_email,
        inv.amount,
        inv.project_name,
        new Date(inv.created_at).toLocaleDateString(),
        status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Investments data exported to CSV',
    });
  };

  const uniqueInvestors = new Set(investments.map(inv => inv.user_email)).size;
  const signedContracts = contracts.filter(c => c.investor_signed_at && c.admin_signed_at).length;

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Investment Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Track and manage all investments</p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ${totalRaised.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {investments.length} investments
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{uniqueInvestors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique investor emails
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Signed Contracts</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{signedContracts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {contracts.length} total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${investments.length > 0 ? Math.round(totalRaised / investments.length).toLocaleString() : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per investor
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Investments */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Investments</CardTitle>
            <CardDescription>
              All investment transactions and their contract status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {investments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No investments yet</p>
                <p className="text-sm text-muted-foreground">
                  Investments will appear here when users start investing
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {investments.map((investment) => {
                  const contract = contracts.find(
                    c => c.investor_email === investment.user_email && 
                         c.investment_amount === Number(investment.amount)
                  );

                  return (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{investment.user_email}</p>
                          {contract && (
                            <Badge variant={
                              contract.investor_signed_at && contract.admin_signed_at
                                ? "default"
                                : contract.investor_signed_at || contract.admin_signed_at
                                ? "secondary"
                                : "outline"
                            }>
                              {contract.investor_signed_at && contract.admin_signed_at
                                ? "✓ Fully Signed"
                                : contract.investor_signed_at
                                ? "Investor Signed"
                                : contract.admin_signed_at
                                ? "Admin Signed"
                                : "Pending Signatures"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{investment.project_name}</span>
                          <span>•</span>
                          <span>{new Date(investment.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(investment.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">
                          ${Number(investment.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
