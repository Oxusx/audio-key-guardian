# Investment System Setup Guide

This project includes a complete investment management system with payment processing, legal contracts, and email notifications.

## Required Setup

### 1. Stripe Payment Processing
To enable payment processing, you need to provide:
- **STRIPE_SECRET_KEY**: Your Stripe secret key
- **VITE_STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key

Get these from: https://dashboard.stripe.com/apikeys

### 2. Email Notifications (Resend)
To send confirmation emails and contracts:
- **RESEND_API_KEY**: Your Resend API key

Get this from: https://resend.com/api-keys

**Important**: You must verify your email domain at https://resend.com/domains before emails will be sent.

### 3. Admin Email Configuration
Update the admin email in `src/components/StripePaymentForm.tsx`:
```typescript
const adminEmail = 'admin@musicproject.com'; // Change this to your email
```

## Features Included

### Legal Protections
✅ Comprehensive investment contract with:
- Risk acknowledgment and disclosure
- Project failure and refund terms
- Data protection compliance
- Dispute resolution procedures
- Investor eligibility requirements
- Severability and no-waiver clauses

### Security Features
✅ Database security:
- Row Level Security (RLS) policies on all tables
- Positive amount validation (no negative investments)
- Performance indexes for fast queries
- Contract term protection (cannot be modified after creation)

### User Experience
✅ Investment flow:
1. Enter email and investment amount
2. View potential ROI calculation
3. Legal warning before payment
4. Secure Stripe payment form
5. Automatic contract generation
6. Email confirmation with contract
7. Contract viewing and download

### Admin Features
✅ Contract management:
- View all investment contracts at `/contracts`
- Download contracts as text files
- Track signing status
- Monitor investment amounts and ROI

## Testing

### Before Going Live
1. Use Stripe test mode keys for testing
2. Test with various investment amounts
3. Verify email delivery with test email addresses
4. Review generated contracts for accuracy
5. Test the contracts viewing page

### Legal Compliance
⚠️ **IMPORTANT**: This system includes legally binding contracts. You should:
1. Have a qualified attorney review all contract terms
2. Ensure compliance with securities laws in your jurisdiction
3. Consider investor accreditation requirements
4. Review risk disclosures with legal counsel
5. Understand your obligations as a project owner

## Configuration Checklist

- [ ] Stripe keys configured
- [ ] Resend API key configured
- [ ] Email domain verified in Resend
- [ ] Admin email updated in code
- [ ] Contract terms reviewed by attorney
- [ ] Test payments completed successfully
- [ ] Email notifications working
- [ ] Contracts viewable and downloadable
- [ ] Legal compliance verified

## API Endpoints

### Edge Functions
- `process-investment-payment`: Creates Stripe payment intent
- `send-investment-confirmation`: Sends email with contract

### Database Tables
- `investments`: Stores investment records
- `contracts`: Stores legal contracts with signing status

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Lovable Cloud logs for backend errors
3. Verify all API keys are correctly configured
4. Ensure domain is verified in Resend

## Disclaimer

This investment system is provided as-is. The contract templates are for general use and should be reviewed and customized by qualified legal professionals before use. The creators assume no liability for legal compliance or financial outcomes.
