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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, projectName }: InvestmentConfirmationRequest = await req.json();

    console.log(`Sending investment confirmation to ${email} for $${amount} in ${projectName}`);

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [email],
      subject: `Investment Confirmation - ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thank You for Your Investment!</h1>
          <p>We're excited to confirm your investment in <strong>${projectName}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Investment Details</h2>
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Investment Amount:</strong> $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>

          <p>Your investment will help bring this project to life. You'll receive updates on the project's progress and your expected returns.</p>
          
          <p>As a valued investor, you can expect:</p>
          <ul>
            <li>Exclusive merchandise</li>
            <li>Priority access to concert tickets</li>
            <li>Share in the project's success</li>
            <li>Regular progress updates</li>
          </ul>

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