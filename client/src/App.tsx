import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import GroupDetail from "./pages/GroupDetail";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Payment from "./pages/Payment";
import UXShowcase from "./pages/UXShowcase";
import SunuSavBrandShowcase from "./pages/SunuSavBrandShowcase";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path="/app" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/create" component={CreateGroup} />
      <Route path="/groups/:id" component={GroupDetail} />
      <Route path="/payment" component={Payment} />
      <Route path="/ux-showcase" component={UXShowcase} />
      <Route path="/brand-showcase" component={SunuSavBrandShowcase} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
