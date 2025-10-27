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
      const { data: investmentData, error: insertError } = await supabase
        .from('investments')
        .insert({
          user_email: email,
          amount,
          project_name: projectName,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate contract terms
      const roiPercentage = 20; // Should match the Investment page
      const expectedReturn = amount * (1 + roiPercentage / 100);
      const adminEmail = 'admin@musicproject.com'; // You can configure this
      
      const contractTerms = `
INVESTMENT AGREEMENT

This Investment Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by and between:

INVESTOR: ${email}
ADMIN/PROJECT OWNER: ${adminEmail}
PROJECT: ${projectName}

WHEREAS, the Investor wishes to invest in the Project, and the Project Owner agrees to accept such investment under the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth, the parties agree as follows:

1. INVESTMENT AMOUNT
The Investor agrees to invest the sum of $${amount.toLocaleString()} USD (the "Investment Amount") in the Project.

2. RETURN ON INVESTMENT (ROI)
The Project Owner agrees to provide the Investor with a return of ${roiPercentage}% on the Investment Amount, resulting in a total expected return of $${expectedReturn.toLocaleString()} USD.

3. PAYMENT TERMS
The return on investment shall be paid to the Investor within 12 months from the date of this Agreement, unless otherwise agreed upon in writing by both parties.

4. PROJECT DETAILS
The Investment Amount will be used for the production, marketing, and distribution of the music project titled "${projectName}".

5. INVESTOR BENEFITS
In addition to the financial return, the Investor shall receive:
   a) Exclusive merchandise related to the Project
   b) Complimentary concert tickets
   c) Recognition in project credits (if desired)
   d) Updates on project progress and milestones

6. RISK ACKNOWLEDGMENT
The Investor acknowledges that all investments carry risk and that the expected return is not guaranteed. The actual return may be higher or lower than projected.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Project Owner operates.

8. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior agreements and understandings.

9. AMENDMENTS
This Agreement may only be amended by written agreement signed by both parties.

10. DISPUTE RESOLUTION
Any disputes arising under this Agreement shall be resolved through good faith negotiation, and if necessary, through binding arbitration.

By completing the payment, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this Agreement.

INVESTOR: ${email}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Investment Amount: $${amount.toLocaleString()}
Expected Return: $${expectedReturn.toLocaleString()} (${roiPercentage}% ROI)

PROJECT OWNER: ${adminEmail}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`.trim();

      // Store the contract
      const { error: contractError } = await supabase
        .from('contracts')
        .insert({
          investment_id: investmentData.id,
          investor_email: email,
          admin_email: adminEmail,
          project_name: projectName,
          investment_amount: amount,
          roi_percentage: roiPercentage,
          expected_return: expectedReturn,
          contract_terms: contractTerms,
          investor_signed_at: new Date().toISOString(),
        });

      if (contractError) {
        console.error('Contract creation error:', contractError);
        // Don't fail the whole operation if contract creation fails
      }

      // Send confirmation email with contract
      await supabase.functions.invoke('send-investment-confirmation', {
        body: {
          email,
          amount,
          projectName,
          contractTerms,
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
