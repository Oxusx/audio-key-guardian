import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border/40 mt-16 py-8 px-4">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} GODSCIRCLE. All rights reserved.</p>
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
        <Link to="/shipping-policy" className="hover:text-foreground">Shipping</Link>
        <Link to="/return-policy" className="hover:text-foreground">Returns</Link>
        <Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
