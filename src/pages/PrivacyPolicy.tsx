import LegalPageLayout from '@/components/LegalPageLayout';

const PrivacyPolicy = () => (
  <LegalPageLayout title="Privacy" accent="Policy">
    <section>
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us when you make a purchase or unlock content:</p>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address</li>
        <li><strong>Shipping Information:</strong> Address details for merch orders</li>
        <li><strong>Payment Information:</strong> Processed securely by Stripe / Shopify — we do not store card details</li>
        <li><strong>Order &amp; Access Information:</strong> Products ordered, access keys used, session activity</li>
        <li><strong>Technical Data:</strong> IP address, browser type, device info, cookies</li>
      </ul>
    </section>

    <section>
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Process and fulfill your merch orders</li>
        <li>Send order confirmations, receipts, and shipping updates</li>
        <li>Provide access to audio content via unlock keys</li>
        <li>Improve our platform and prevent fraud</li>
        <li>Comply with legal obligations</li>
      </ul>
    </section>

    <section>
      <h2>3. Information Sharing</h2>
      <p>We do not sell your personal information. We share data only with:</p>
      <ul>
        <li><strong>Payment Processors:</strong> Stripe and Shopify for secure payments</li>
        <li><strong>Shipping Carriers:</strong> To deliver your orders</li>
        <li><strong>Email Providers:</strong> To send transactional emails</li>
        <li><strong>Legal Authorities:</strong> When required by law</li>
      </ul>
    </section>

    <section>
      <h2>4. Your Rights</h2>
      <p>Depending on your location (GDPR, CCPA), you may have the right to access, correct, delete, or export your personal data. Contact <a href="mailto:privacy@godscircle.ca">privacy@godscircle.ca</a> to make a request.</p>
    </section>

    <section>
      <h2>5. Cookies</h2>
      <p>We use cookies to remember preferences and improve performance. You can disable them in your browser, but some features may stop working.</p>
    </section>

    <section>
      <h2>6. Data Retention</h2>
      <p>We retain personal information as long as needed to fulfill orders, comply with legal obligations (typically up to 7 years), and resolve disputes.</p>
    </section>

    <section>
      <h2>7. Contact</h2>
      <p>Questions? Email <a href="mailto:privacy@godscircle.ca">privacy@godscircle.ca</a>.</p>
    </section>
  </LegalPageLayout>
);

export default PrivacyPolicy;
