import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import AccessPage from "./pages/Access";
import AdminAuditPage from "./pages/AdminAudit";
import CollegesPage from "./pages/Colleges";
import Home from "./pages/Home";
import ImportPage from "./pages/Import";
import InventoryPage from "./pages/Inventory";
import LoginPage from "./pages/Login";
import MaterialsPage from "./pages/Materials";
import MemosPage from "./pages/Memos";
import MemoDetailsPage from "./pages/MemoDetails";
import OfficialReportsEvidence from "./pages/OfficialReportsEvidence";
import PrintPreviewEvidence from "./pages/PrintPreviewEvidence";
import UsersPage from "./pages/Users";
import StatisticsPage from "./pages/Statistics";
import WarehousesPage from "./pages/Warehouses";

const withShell = (Page: React.ComponentType) => () => <DashboardLayout preview={import.meta.env.DEV}><Page /></DashboardLayout>;
const Preview = () => <DashboardLayout preview><Home /></DashboardLayout>;

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={withShell(Home)} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/preview"} component={Preview} />
      <Route path={"/_print-preview-evidence"} component={PrintPreviewEvidence} />
      <Route path={"/_official-reports-evidence"} component={OfficialReportsEvidence} />
      <Route path={"/materials"} component={withShell(MaterialsPage)} />
      <Route path={"/warehouses"} component={withShell(WarehousesPage)} />
      <Route path={"/colleges"} component={withShell(CollegesPage)} />
      <Route path={"/inbound"} component={withShell(() => <MemosPage kind="inbound" inboundMode="receipt" />)} />
      <Route path={"/entry"} component={withShell(() => <MemosPage kind="inbound" inboundMode="entry" />)} />
      <Route path={"/outbound"} component={withShell(() => <MemosPage kind="outbound" />)} />
      <Route path={"/transfer"} component={withShell(() => <MemosPage kind="outbound" mode="transfer" />)} />
      <Route path={"/memos/:id"} component={withShell(MemoDetailsPage)} />
      <Route path={"/inventory"} component={withShell(InventoryPage)} />
      <Route path={"/reports"} component={withShell(() => <InventoryPage reportsOnly />)} />
      <Route path={"/import"} component={withShell(ImportPage)} />
      <Route path={"/access"} component={withShell(AccessPage)} />
      <Route path={"/admin-audit"} component={withShell(AdminAuditPage)} />
      <Route path={"/statistics"} component={withShell(StatisticsPage)} />
      <Route path={"/users"} component={withShell(UsersPage)} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
