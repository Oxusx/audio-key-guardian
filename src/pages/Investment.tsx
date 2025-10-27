import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CreditCard, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const Investment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalInvested, setTotalInvested] = useState(0);
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Get project details from localStorage
  const projectName = localStorage.getItem('projectName') || 'Music Project';
  const totalBudget = parseFloat(localStorage.getItem('totalBudget') || '10000');
  const maxInvestment = totalBudget * 0.5; // 50% of budget

  // Calculate progress percentage
  const progressPercentage = (totalInvested / totalBudget) * 100;

  // ROI calculation (example: 20% return)
  const roiPercentage = 20;
  const potentialReturn = (parseFloat(amount) || 0) * (1 + roiPercentage / 100);

  useEffect(() => {
    fetchTotalInvestments();
  }, []);

  const fetchTotalInvestments = async () => {
    try {
      const { data, error } = await supabase.rpc('get_total_investments');
      if (error) throw error;
      setTotalInvested(Number(data) || 0);
    } catch (error) {
      console.error('Error fetching total investments:', error);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const investmentAmount = parseFloat(amount);

    // Validation
    if (!email || !amount) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and investment amount.',
        variant: 'destructive',
      });
      return;
    }

    if (investmentAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Investment amount must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (investmentAmount > maxInvestment) {
      toast({
        title: 'Amount Too High',
        description: `Maximum investment is $${maxInvestment.toLocaleString()} (50% of budget).`,
        variant: 'destructive',
      });
      return;
    }

    if (totalInvested + investmentAmount > totalBudget) {
      toast({
        title: 'Budget Exceeded',
        description: `Only $${(totalBudget - totalInvested).toLocaleString()} remaining in budget.`,
        variant: 'destructive',
      });
      return;
    }

    // Show legal warning before proceeding
    setShowWarningModal(true);
  };

  const confirmProceedToPayment = async () => {
    setShowWarningModal(false);
    setIsSubmitting(true);

    try {
      const investmentAmount = parseFloat(amount);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Sanitize inputs to prevent injection
      const sanitizedEmail = email.trim().substring(0, 255);
      const sanitizedProjectName = projectName.trim().substring(0, 100);

      // Create payment intent
      const { data, error } = await supabase.functions.invoke('process-investment-payment', {
        body: {
          amount: investmentAmount,
          email: sanitizedEmail,
          projectName: sanitizedProjectName,
        },
      });

      if (error) throw error;

      if (!data?.clientSecret) {
        throw new Error('Payment system is not configured. Please contact support.');
      }

      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    } catch (error: any) {
      console.error('Payment setup error:', error);
      toast({
        title: 'Payment Setup Failed',
        description: error.message || 'Unable to initialize payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Invest in {projectName}</h1>
        </div>

        {/* Project Info Card */}
        <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">About This Project</h2>
          <p className="text-muted-foreground mb-4">
            Join us in bringing this music project to life! Your investment will help fund production,
            marketing, and distribution. As an investor, you'll receive exclusive merchandise, concert
            tickets, and share in the project's success.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Budget:</span>
              <span className="font-semibold">${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected ROI:</span>
              <span className="font-semibold text-success">{roiPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Investment:</span>
              <span className="font-semibold">${maxInvestment.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Budget Progress */}
        <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Funding Progress</h2>
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-6" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                ${totalInvested.toLocaleString()} raised
              </span>
              <span className="text-muted-foreground">
                ${totalBudget.toLocaleString()} goal
              </span>
            </div>
            <p className="text-center font-semibold text-lg">
              {progressPercentage.toFixed(1)}% Funded
            </p>
          </div>
        </Card>

        {/* Investment Form or Payment Form */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          {!showPaymentForm ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Make Your Investment</h2>
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-2">
                    Investment Amount ($)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    max={maxInvestment}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum: ${maxInvestment.toLocaleString()}
                  </p>
                </div>

                {amount && parseFloat(amount) > 0 && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm font-medium">Potential Return</p>
                    <p className="text-2xl font-bold text-success">
                      ${potentialReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on {roiPercentage}% ROI
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Details
                </Button>
                <h2 className="text-xl font-semibold">Complete Your Investment</h2>
                <p className="text-muted-foreground mt-2">
                  Investing ${parseFloat(amount).toLocaleString()} in {projectName}
                </p>
              </div>

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    email={email}
                    amount={parseFloat(amount)}
                    projectName={projectName}
                    onSuccess={async () => {
                      await fetchTotalInvestments();
                      setEmail('');
                      setAmount('');
                      setShowPaymentForm(false);
                      setClientSecret('');
                    }}
                  />
                </Elements>
              )}
            </>
          )}
        </Card>

        {/* View Contracts Link */}
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate('/contracts')}
            className="text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Your Investment Contracts
          </Button>
        </div>

        {/* Legal Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-destructive">⚠️ Important Legal Notice</h2>
              <div className="space-y-4 text-sm">
                <p className="font-semibold">
                  By proceeding with this investment, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>This is a <strong>legally binding contract</strong> that will be generated upon payment completion</li>
                  <li>All investments carry <strong>inherent risk</strong> and you may lose some or all of your investment</li>
                  <li>The projected return is <strong>not guaranteed</strong> and actual returns may differ significantly</li>
                  <li>You have the <strong>financial capacity</strong> to bear the loss of this entire investment amount</li>
                  <li>You are <strong>legally eligible</strong> to make this investment in your jurisdiction</li>
                  <li>You have had the <strong>opportunity to seek independent legal and financial advice</strong></li>
                  <li>The project may fail and <strong>refunds are not guaranteed</strong></li>
                </ul>
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mt-4">
                  <p className="font-semibold text-destructive">Recommendation:</p>
                  <p className="text-muted-foreground">
                    We strongly recommend consulting with a qualified attorney and financial advisor before making this investment.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={confirmProceedToPayment}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Processing...' : 'I Understand, Proceed'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Investment;