import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LegalPageLayoutProps {
  title: string;
  accent?: string;
  children: React.ReactNode;
}

const LegalPageLayout = ({ title, accent, children }: LegalPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-foreground mb-3">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:list-inside [&_a]:text-primary [&_a]:hover:underline">
          {children}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default LegalPageLayout;
