import { Mail, Clock } from 'lucide-react';
import LegalPageLayout from '@/components/LegalPageLayout';

const Contact = () => (
  <LegalPageLayout title="Get in" accent="Touch">
    <section>
      <p>Questions about an order, an access key, or partnerships? Reach out — we usually reply within 24–48 business hours.</p>
    </section>

    <section>
      <h2>General</h2>
      <p className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <a href="mailto:hello@godscircle.ca">hello@godscircle.ca</a>
      </p>
    </section>

    <section>
      <h2>Orders &amp; Shipping</h2>
      <p className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <a href="mailto:shipping@godscircle.ca">shipping@godscircle.ca</a>
      </p>
    </section>

    <section>
      <h2>Returns</h2>
      <p className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <a href="mailto:returns@godscircle.ca">returns@godscircle.ca</a>
      </p>
    </section>

    <section>
      <h2>Privacy</h2>
      <p className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <a href="mailto:privacy@godscircle.ca">privacy@godscircle.ca</a>
      </p>
    </section>

    <section>
      <h2>Hours</h2>
      <p className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Mon – Fri, 9AM – 6PM EST
      </p>
    </section>
  </LegalPageLayout>
);

export default Contact;
