import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard } from 'lucide-react';

interface StripePaymentFormProps {
  email: string;
  amount: number;
  projectName: string;
  onSuccess: () => void;
}

const StripePaymentForm = ({ email, amount, projectName, onSuccess }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        throw confirmError;
      }

      // Payment successful - record investment
      const { error: insertError } = await supabase
        .from('investments')
        .insert({
          user_email: email,
          amount,
          project_name: projectName,
        });

      if (insertError) throw insertError;

      // Send confirmation email
      await supabase.functions.invoke('send-investment-confirmation', {
        body: {
          email,
          amount,
          projectName,
        },
      });

      toast({
        title: 'Payment Successful!',
        description: `Thank you for investing $${amount.toLocaleString()} in ${projectName}. Check your email for confirmation.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred while processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Payment Information</h3>
        </div>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${amount.toLocaleString()}`}
      </Button>
    </form>
  );
};

export default StripePaymentForm;
