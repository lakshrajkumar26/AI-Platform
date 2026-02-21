import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Video from "./pages/Video";

/**
 * National Media Portal - Main App
 * 
 * Routes:
 * - / (Home) - Public portal showing all uploaded videos/blogs
 * - /admin - Admin dashboard for uploading videos/blogs
 * - /video/:id - Video player for viewing content
 * - /404 - Not found page
 */

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/video/:id" component={Video} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

export default App;
