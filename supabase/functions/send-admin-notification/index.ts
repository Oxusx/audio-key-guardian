import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  adminEmail: string;
  investorEmail: string;
  amount: number;
  projectName: string;
  totalRaised: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If no API key, return success but don't send email
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - admin notification skipped");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email service not configured yet" 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const { adminEmail, investorEmail, amount, projectName, totalRaised }: AdminNotificationRequest = await req.json();

    console.log("Sending admin notification to:", adminEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .notification { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .detail-row { padding: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; font-size: 18px; }
            .amount { font-size: 36px; font-weight: bold; color: #10b981; margin: 20px 0; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 20px; background: white; border-radius: 8px; flex: 1; margin: 0 10px; }
            .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 New Investment Received!</h1>
            </div>
            <div class="content">
              <div class="notification">
                <p style="font-size: 20px; margin-bottom: 20px;">🎉 You just received a new investment!</p>
                
                <div class="detail-row">
                  <span class="label">Project:</span><br/>
                  <span class="value">${projectName}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Investor Email:</span><br/>
                  <span class="value">${investorEmail}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Investment Amount:</span><br/>
                  <div class="amount">$${amount.toLocaleString()}</div>
                </div>
                
                <div class="detail-row">
                  <span class="label">Date:</span><br/>
                  <span class="value">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <div class="stats">
                <div class="stat-box">
                  <div class="stat-value">$${totalRaised.toLocaleString()}</div>
                  <div class="stat-label">Total Raised</div>
                </div>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the investment in your admin dashboard</li>
                <li>Generate and send the investment contract</li>
                <li>Sign the contract once the investor has signed</li>
                <li>Keep the investor updated on project milestones</li>
              </ul>

              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL') || 'https://lovable.app'}/admin" class="button">View Admin Dashboard</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Audio Key Guardian <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🎉 New Investment: $${amount.toLocaleString()} from ${investorEmail}`,
      html: emailHtml,
    });

    console.log("Admin notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
