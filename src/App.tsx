
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
import MyTastingBox from "./pages/MyTastingBox";
import Explore from "./pages/Explore";
import WhiskyUpload from "./pages/WhiskyUpload";
import AddWhisky from "./pages/AddWhisky";

import Quiz from "./pages/Quiz";
import Certificate from "./pages/Certificate";
import SiteHeader from "./components/layout/SiteHeader";
import WhiskyDossier from "./pages/WhiskyDossier";
import MyReviews from "./pages/MyReviews";
import Activate from "./pages/Activate";
import Feed from "./pages/Feed";
import UserProfile from "./pages/UserProfile";
import Discover from "./pages/Discover";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import WhiskyInfo from "./pages/WhiskyInfo";
import MediaLibrary from "./pages/admin/MediaLibrary";
import SetEntry from "./pages/SetEntry";
import Welcome from "./pages/Welcome";
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
            <Routes>
              {/* Entry flow routes (no header) */}
              <Route path="/set/:setCode" element={<SetEntry />} />
              <Route path="/welcome" element={<Welcome />} />
              
              {/* Main app routes (with header) */}
              <Route path="/*" element={
                <>
                  <SiteHeader />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/add-whisky" element={<AddWhisky />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    {/* MVP Hidden: <Route path="/university" element={<University />} /> */}
                    <Route path="/tasting" element={<Tasting />} />
                    <Route path="/my-tasting-box" element={<MyTastingBox />} />
                    {/* MVP Hidden: <Route path="/explore" element={<Explore />} /> */}
                    <Route path="/whisky-upload" element={<WhiskyUpload />} />
                    <Route path="/whisky-info/:id" element={<WhiskyInfo />} />
                    <Route path="/tasting/:id" element={<WhiskyDossier />} />
                    <Route path="/whisky-dossier/:id" element={<WhiskyDossier />} />
                    <Route path="/dossier/:id" element={<WhiskyDossier />} />
                    
                    <Route path="/reviews" element={<MyReviews />} />
                    <Route path="/profile" element={<Profile />} />
                    {/* MVP Hidden: <Route path="/feed" element={<Feed />} /> */}
                    <Route path="/user/:userId" element={<UserProfile />} />
                    {/* MVP Hidden: <Route path="/discover" element={<Discover />} /> */}
                    <Route path="/settings" element={<Settings />} />
                    {/* MVP Hidden: <Route path="/quiz" element={<Quiz />} /> */}
                    <Route path="/certificate" element={<Certificate />} />
                    <Route path="/admin/media" element={<MediaLibrary />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </>
              } />
            </Routes>
          </ActiveSetProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
