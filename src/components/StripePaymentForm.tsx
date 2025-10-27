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
      
      // Sanitize inputs to prevent injection attacks
      const sanitizedEmail = email.trim().substring(0, 255).replace(/[<>]/g, '');
      const sanitizedProjectName = projectName.trim().substring(0, 100).replace(/[<>]/g, '');
      const sanitizedAdminEmail = adminEmail.trim().substring(0, 255).replace(/[<>]/g, '');
      
      const contractTerms = `
INVESTMENT AGREEMENT

IMPORTANT LEGAL NOTICE: This is a legally binding contract. You should consult with a qualified attorney before entering into this agreement. By completing this payment, you acknowledge that you have read, understood, and agree to all terms and conditions herein.

This Investment Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by and between:

INVESTOR: ${sanitizedEmail}
ADMIN/PROJECT OWNER: ${sanitizedAdminEmail}
PROJECT: ${sanitizedProjectName}

WHEREAS, the Investor wishes to invest in the Project, and the Project Owner agrees to accept such investment under the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth, the parties agree as follows:

1. INVESTMENT AMOUNT
The Investor agrees to invest the sum of $${amount.toLocaleString()} USD (the "Investment Amount") in the Project.

2. RETURN ON INVESTMENT (ROI)
The Project Owner agrees to provide the Investor with a return of ${roiPercentage}% on the Investment Amount, resulting in a total expected return of $${expectedReturn.toLocaleString()} USD.

3. PAYMENT TERMS
The return on investment shall be paid to the Investor within 12 months from the date of this Agreement, unless otherwise agreed upon in writing by both parties.

4. PROJECT DETAILS
The Investment Amount will be used for the production, marketing, and distribution of the music project titled "${sanitizedProjectName}".

IMPORTANT: MASTERS AND MUSIC RIGHTS EXCLUSION
The Investor acknowledges and explicitly agrees that this investment does NOT include, convey, or transfer any ownership, rights, title, or interest in:
   a) The master recordings of any music produced under this Project
   b) Publishing rights, mechanical rights, or performance rights
   c) Copyright ownership or co-ownership of any musical compositions
   d) Future royalties from master recordings or publishing
   e) Any intellectual property rights related to the music or recordings

The masters and all associated music rights shall remain the sole and exclusive property of the Artist/Project Owner. This investment is solely for the purpose of funding project production, marketing, and distribution costs. The Investor's return is limited to the ROI percentage specified in Section 2, and does not entitle the Investor to any ongoing royalties, rights, or claims to the music masters or intellectual property.

5. INVESTOR BENEFITS
In addition to the financial return, the Investor shall receive:
   a) Exclusive merchandise related to the Project
   b) Complimentary concert tickets
   c) Recognition in project credits (if desired)
   d) Updates on project progress and milestones

6. RISK ACKNOWLEDGMENT
The Investor acknowledges and agrees that:
   a) All investments carry inherent risk and the Investment Amount may be lost in whole or in part
   b) The expected return is a projection only and is not guaranteed
   c) The actual return may be significantly higher or lower than projected, including total loss
   d) The Project may fail to generate any return or revenue
   e) There is no guarantee of project completion or success
   f) This investment is speculative and high-risk in nature

7. PROJECT FAILURE AND REFUNDS
In the event the Project is cancelled or fails to launch:
   a) The Project Owner will make reasonable efforts to return invested capital
   b) The Investor understands that a full refund may not be possible
   c) Any refunds will be distributed on a pro-rata basis to all investors
   d) The Project Owner is not liable for investment losses due to project failure

8. DATA PROTECTION AND PRIVACY
The parties agree to comply with all applicable data protection laws. The Investor's personal information will be used solely for the purposes of this Agreement and project communications.

9. INVESTOR ELIGIBILITY
The Investor represents and warrants that:
   a) They are of legal age to enter into this Agreement
   b) They have the financial capacity to bear the loss of the entire Investment Amount
   c) They have carefully considered the risks involved

10. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the United States and the state in which the Project Owner operates, without regard to conflict of law principles.

11. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.

12. AMENDMENTS
This Agreement may only be amended by written agreement signed by both parties. Any amendments must be mutually agreed upon and documented in writing.

13. DISPUTE RESOLUTION
Any disputes, claims, or controversies arising under this Agreement shall be resolved as follows:
   a) First, through good faith negotiation between the parties within 30 days of written notice
   b) If unresolved, through binding arbitration in accordance with the rules of the American Arbitration Association
   c) The prevailing party in any dispute shall be entitled to reasonable attorneys' fees and costs
   d) The Investor waives the right to participate in class action lawsuits related to this Agreement

14. SEVERABILITY
If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.

15. NO WAIVER
The failure of either party to enforce any provision of this Agreement shall not constitute a waiver of that or any other provision.

ACKNOWLEDGMENT AND ACCEPTANCE

By completing the payment, the Investor acknowledges that they have:
- Read and understood this entire Agreement
- Had the opportunity to seek independent legal advice
- Understood the risks involved in this investment
- Agreed to be legally bound by all terms and conditions herein
- Confirmed their eligibility to make this investment

ELECTRONIC SIGNATURE: By completing the payment transaction, both parties agree that their electronic acceptance constitutes a legally binding signature equivalent to a handwritten signature.

INVESTOR: ${sanitizedEmail}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Investment Amount: $${amount.toLocaleString()}
Expected Return: $${expectedReturn.toLocaleString()} (${roiPercentage}% ROI)

PROJECT OWNER: ${sanitizedAdminEmail}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`.trim();

      // Store the contract
      const { error: contractError } = await supabase
        .from('contracts')
        .insert({
          investment_id: investmentData.id,
          investor_email: sanitizedEmail,
          admin_email: sanitizedAdminEmail,
          project_name: sanitizedProjectName,
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
          email: sanitizedEmail,
          amount,
          projectName: sanitizedProjectName,
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
