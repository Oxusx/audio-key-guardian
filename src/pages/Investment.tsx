import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, TrendingUp, Music, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Investment = () => {
  const [investmentAmount, setInvestmentAmount] = useState<number>(10);
  const { toast } = useToast();

  // Get budget from localStorage
  const totalBudget = Number(localStorage.getItem('projectInvestmentBudget') || '0');
  const userAvailableBudget = totalBudget * 0.5;
  const maxUserInvestment = Math.min(userAvailableBudget * 0.1, userAvailableBudget);

  const handleInvestment = () => {
    if (investmentAmount < 10) {
      toast({
        title: "Minimum investment required",
        description: "Minimum investment amount is $10.",
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount > maxUserInvestment) {
      toast({
        title: "Investment limit exceeded",
        description: `Maximum investment allowed is $${maxUserInvestment.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    // Payment integration would go here
    toast({
      title: "Payment integration required",
      description: "Please connect Supabase and Stripe to process payments.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Community Investment
            </h1>
            <p className="text-muted-foreground">Be part of the project's success</p>
          </div>
        </div>

        {/* Community Purpose */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Building Together, Succeeding Together
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to our community-driven investment platform. When you invest in this project, 
              you're not just supporting an artist—you're becoming part of a collaborative community 
              where everyone's success is shared.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Music className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Merchandise Sales</h4>
                  <p className="text-sm text-muted-foreground">
                    Share in profits from exclusive merchandise and limited releases
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Live Concert Tickets</h4>
                  <p className="text-sm text-muted-foreground">
                    Benefit from ticket sales and exclusive live event opportunities
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Community Success Model</span>
              </div>
              <p className="text-sm text-muted-foreground">
                When the artist succeeds, the community succeeds. Your investment creates a 
                collaborative ecosystem where every member has a stake in the project's growth 
                and shares in its achievements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Details */}
        {totalBudget > 0 ? (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Investment Opportunity</CardTitle>
              <CardDescription>
                Join the community by investing in this project's future
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">${totalBudget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-success">${(totalBudget * 0.5).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Admin Investment (50%)</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">${userAvailableBudget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Available for Community</p>
                </div>
              </div>

              {/* Investment Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Min: $10</Badge>
                  <Badge variant="outline">Max: ${maxUserInvestment.toFixed(2)} (10% limit)</Badge>
                </div>

                <div>
                  <Label htmlFor="investment-amount">Investment Amount ($)</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    min="10"
                    max={maxUserInvestment}
                    step="1"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Between $10 and ${maxUserInvestment.toFixed(2)}
                  </p>
                </div>

                <Button 
                  onClick={handleInvestment}
                  className="w-full" 
                  variant="gradient"
                  size="lg"
                  disabled={investmentAmount < 10 || investmentAmount > maxUserInvestment}
                >
                  Invest ${investmentAmount} in Community Success
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>💰 Secure payment processing • 🤝 Community-driven returns • 🎵 Support independent artists</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-elegant">
            <CardContent className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Investment Not Available</h3>
              <p className="text-muted-foreground">
                The admin hasn't set up an investment budget yet. 
                Please check back later when the investment opportunity is available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Investment;