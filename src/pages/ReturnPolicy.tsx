import LegalPageLayout from '@/components/LegalPageLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const ReturnPolicy = () => (
  <LegalPageLayout title="Return &amp;" accent="Refund Policy">
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Digital audio access (unlocked via keys) is non-refundable once activated. Merch returns are accepted as outlined below.
      </AlertDescription>
    </Alert>

    <section>
      <h2>1. Return Eligibility</h2>
      <p>Merch may be returned within <strong>30 days</strong> of delivery if:</p>
      <ul>
        <li>The item is unworn, unwashed, and in original condition with tags</li>
        <li>The item is defective or damaged upon arrival</li>
        <li>The wrong item was shipped</li>
      </ul>
    </section>

    <section>
      <h2>2. Non-Returnable</h2>
      <ul>
        <li>Digital audio access / unlocked content</li>
        <li>Worn, washed, or tagless items</li>
        <li>Sale or clearance items</li>
        <li>Returns after 30 days from delivery</li>
      </ul>
    </section>

    <section>
      <h2>3. How to Start a Return</h2>
      <ol>
        <li>Email <a href="mailto:returns@godscircle.ca">returns@godscircle.ca</a> with your order number within 30 days</li>
        <li>Include the reason and photos (if defective)</li>
        <li>We&apos;ll send a Return Authorization (RA) number and instructions</li>
        <li>Ship the item back with the RA visible on the package</li>
      </ol>
    </section>

    <section>
      <h2>4. Return Shipping</h2>
      <ul>
        <li><strong>Defective / wrong item:</strong> We cover return shipping</li>
        <li><strong>Change of mind:</strong> Customer pays return shipping</li>
        <li>Use a tracked service — we&apos;re not responsible for lost return packages</li>
      </ul>
    </section>

    <section>
      <h2>5. Refunds</h2>
      <ul>
        <li>Items inspected within 2–3 business days of receipt</li>
        <li>Refunds processed within 5–10 business days to original payment method</li>
        <li>Original shipping fees are non-refundable (except for defective items)</li>
      </ul>
    </section>

    <section>
      <h2>6. Exchanges</h2>
      <p>Size exchanges available subject to availability. Contact us with your order number and preferred size.</p>
    </section>

    <section>
      <h2>7. Contact</h2>
      <p>Email <a href="mailto:returns@godscircle.ca">returns@godscircle.ca</a>. Response within 24–48 business hours.</p>
    </section>
  </LegalPageLayout>
);

export default ReturnPolicy;
