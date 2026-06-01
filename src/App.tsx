import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioProvider } from "./contexts/AudioContext";
import { CookieConsent } from "./components/CookieConsent";
import SubdomainRouter from "./components/SubdomainRouter";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";
import Investment from "./pages/Investment";
import Contracts from "./pages/Contracts";
import ArtistKeys from "./pages/ArtistKeys";
import Player from "./pages/Player";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./pages/Analytics";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ArtistDashboard from "./pages/ArtistDashboard";
import ArtistPage from "./pages/ArtistPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AudioProvider>
          <CookieConsent />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user" element={<User />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/artist-keys" element={<ArtistKeys />} />
            <Route path="/player" element={<Player />} />
            <Route path="/artist-dashboard" element={<ArtistDashboard />} />
            <Route path="/:username" element={<ArtistPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AudioProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
