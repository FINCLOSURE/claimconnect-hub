import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewClaim from "./pages/NewClaim";
import ClaimDetail from "./pages/ClaimDetail";
import DocumentUpload from "./pages/DocumentUpload";
import ProcessFlow from "./pages/ProcessFlow";
import Support from "./pages/Support";
import AdminConsole from "./pages/AdminConsole";
import AssetClaim from "./pages/AssetClaim";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claims/new" element={<NewClaim />} />
            <Route path="/claims/:id" element={<ClaimDetail />} />
            <Route path="/claims/:id/upload" element={<DocumentUpload />} />
            <Route path="/process" element={<ProcessFlow />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/assets/:id/claim" element={<AssetClaim />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
