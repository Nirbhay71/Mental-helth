import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import MyPosts from "@/pages/my-posts";
import Doctors from "@/pages/doctors";
import Analytics from "@/pages/analytics";
import Chatbot from "@/pages/chatbot";
import Sidebar from "@/components/layout/sidebar";
import CreatePostModal from "@/components/modals/create-post-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/my-posts" component={MyPosts} />
          <Route path="/doctors" component={Doctors} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/chatbot" component={Chatbot} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <CreatePostModal />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <TooltipProvider>
      <Toaster />
      {isLoading ? (
        <LoadingSpinner />
      ) : isAuthenticated ? (
        <AuthenticatedLayout>
          <Router />
        </AuthenticatedLayout>
      ) : (
        <Router />
      )}
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
