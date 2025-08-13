
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import University from "./pages/University";
import Tasting from "./pages/Tasting";
import Community from "./pages/Community";
import Quiz from "./pages/Quiz";
import Certificate from "./pages/Certificate";
import SiteHeader from "./components/layout/SiteHeader";
import WhiskyDossier from "./pages/WhiskyDossier";
import MyReviews from "./pages/MyReviews";
import Activate from "./pages/Activate";
import WhiskyProfile from "./pages/WhiskyProfile";
import { ActiveSetProvider } from "./context/ActiveSetContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ActiveSetProvider>
            <SiteHeader />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/university" element={<University />} />
              <Route path="/tasting" element={<Tasting />} />
              <Route path="/tasting/:id" element={<WhiskyDossier />} />
              <Route path="/community" element={<Community />} />
              <Route path="/reviews" element={<MyReviews />} />
              <Route path="/profile" element={<WhiskyProfile />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/certificate" element={<Certificate />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ActiveSetProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
