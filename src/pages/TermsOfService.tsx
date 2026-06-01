import LegalPageLayout from '@/components/LegalPageLayout';

const TermsOfService = () => (
  <LegalPageLayout title="Terms of" accent="Service">
    <section>
      <h2>1. Agreement</h2>
      <p>By using GODSCIRCLE, you agree to these terms. If you do not agree, please do not use the platform.</p>
    </section>

    <section>
      <h2>2. Access Keys &amp; Content</h2>
      <ul>
        <li>Access keys unlock audio content for a specific time window (24h, 48h, or indefinite)</li>
        <li>Keys are non-transferable and may not be shared or resold</li>
        <li>Audio is for personal listening only; downloading, ripping, or redistribution is prohibited</li>
        <li>We reserve the right to revoke access for misuse</li>
      </ul>
    </section>

    <section>
      <h2>3. Merch Orders &amp; Payment</h2>
      <ul>
        <li>All merch is sold via Shopify checkout</li>
        <li>Payment is processed securely by Shopify / Stripe</li>
        <li>You will receive an order confirmation and receipt by email</li>
        <li>We reserve the right to refuse or cancel any order</li>
      </ul>
    </section>

    <section>
      <h2>4. Shipping</h2>
      <p>See our <a href="/shipping-policy">Shipping Policy</a> for details.</p>
    </section>

    <section>
      <h2>5. Returns &amp; Refunds</h2>
      <p>See our <a href="/return-policy">Return &amp; Refund Policy</a>.</p>
    </section>

    <section>
      <h2>6. Intellectual Property</h2>
      <p>All music, artwork, designs, and content remain the exclusive property of the artist and GODSCIRCLE. Purchasing merch or unlocking audio does not transfer any ownership of master recordings, publishing, or copyrights.</p>
    </section>

    <section>
      <h2>7. User Conduct</h2>
      <ul>
        <li>Do not use the platform for illegal purposes</li>
        <li>Do not attempt to bypass access controls or compromise our systems</li>
        <li>Do not resell, redistribute, or rip audio content</li>
      </ul>
    </section>

    <section>
      <h2>8. Limitation of Liability</h2>
      <p>GODSCIRCLE is not liable for indirect or consequential damages. Total liability is limited to the amount you paid for the relevant order.</p>
    </section>

    <section>
      <h2>9. Privacy</h2>
      <p>See our <a href="/privacy-policy">Privacy Policy</a>.</p>
    </section>

    <section>
      <h2>10. Changes</h2>
      <p>We may update these terms at any time. Continued use after changes means you accept the updated terms.</p>
    </section>

    <section>
      <h2>11. Contact</h2>
      <p>Questions? Email <a href="mailto:hello@godscircle.ca">hello@godscircle.ca</a>.</p>
    </section>
  </LegalPageLayout>
);

export default TermsOfService;
