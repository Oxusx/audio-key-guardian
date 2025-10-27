import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvestmentConfirmationRequest {
  email: string;
  amount: number;
  projectName: string;
  contractTerms?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, projectName, contractTerms }: InvestmentConfirmationRequest = await req.json();

    console.log(`Sending investment confirmation to ${email} for $${amount} in ${projectName}`);

    const contractSection = contractTerms ? `
      <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Investment Contract</h2>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6;">${contractTerms}</pre>
      </div>
    ` : '';

    const emailResponse = await resend.emails.send({
      from: "Music Project <onboarding@resend.dev>",
      to: [email],
      subject: `Investment Confirmation - ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Investment Confirmed!</h1>
          <p>Thank you for investing in <strong>${projectName}</strong>!</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Investment Amount:</strong> $${amount.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Your payment has been processed successfully. ${contractTerms ? 'Below is your legally binding investment contract.' : 'You will receive your contract details shortly.'}</p>
          
          ${contractSection}
          
          <p style="margin-top: 30px;">We will keep you updated on the project's progress. You will receive exclusive merchandise, concert tickets, and your expected return on investment as outlined in the contract.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>${projectName} Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">
            This is an automated confirmation email. Please keep this for your records.
          </p>
        </div>
      `,
    });

    console.log("Investment confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-investment-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);