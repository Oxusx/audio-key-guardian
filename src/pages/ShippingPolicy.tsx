import LegalPageLayout from '@/components/LegalPageLayout';

const ShippingPolicy = () => (
  <LegalPageLayout title="Shipping" accent="Policy">
    <section>
      <h2>Processing Time</h2>
      <ul>
        <li>Standard items ship within 1–2 business days</li>
        <li>Custom or made-to-order items ship within 2–5 business days</li>
      </ul>
      <p>Orders placed on weekends or holidays are processed the next business day.</p>
    </section>

    <section>
      <h2>Shipping Methods &amp; Costs</h2>
      <p>Shipping rates are calculated at checkout based on destination and weight. Rates and delivery times are shown by Shopify before you pay.</p>
      <ul>
        <li><strong>Canada:</strong> 5–10 business days (standard)</li>
        <li><strong>United States:</strong> 7–14 business days (standard)</li>
        <li><strong>International:</strong> 10–21 business days (standard)</li>
      </ul>
    </section>

    <section>
      <h2>Order Tracking</h2>
      <p>Once your order ships, you&apos;ll receive an email with the carrier and tracking number. Allow 24–48 hours for tracking to update.</p>
    </section>

    <section>
      <h2>Customs &amp; Duties</h2>
      <p>International customers are responsible for any customs fees, import duties, or taxes imposed by their country. These are not included in shipping costs.</p>
    </section>

    <section>
      <h2>Delays</h2>
      <p>We&apos;re not responsible for delays caused by carriers, customs, weather, or incorrect addresses. Please double-check your shipping address at checkout.</p>
    </section>

    <section>
      <h2>Lost or Stolen Packages</h2>
      <p>If your tracking shows delivered but you didn&apos;t receive it, check with neighbours and contact the carrier first. If unresolved, email us within 7 days and we&apos;ll help file a claim.</p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>Email <a href="mailto:shipping@godscircle.ca">shipping@godscircle.ca</a>. Response within 24–48 business hours.</p>
    </section>
  </LegalPageLayout>
);

export default ShippingPolicy;
