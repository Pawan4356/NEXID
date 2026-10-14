import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { ServerCrash } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { Topbar } from "./components/layout/Topbar";
import { Button, EmptyState, Spinner } from "./components/ui";
import { LoginPage, SignupPage, Logo } from "./pages/AuthPages";
import HomePage from "./pages/HomePage";
import NotesPage from "./pages/NotesPage";
import NotePage from "./pages/NotePage";
import TodosPage from "./pages/TodosPage";
import DiagramsPage from "./pages/DiagramsPage";
import PeoplePage from "./pages/PeoplePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { apiBaseUrl } from "./services/api";

// Excalidraw is heavy; only load it when a diagram is opened.
const DiagramPage = lazy(() => import("./pages/DiagramPage"));

function FullScreen({ children }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">{children}</div>;
}

function Unreachable() {
  const { retry, error } = useAuth();
  return (
    <FullScreen>
      <EmptyState
        icon={ServerCrash}
        title="Can't reach the Nexid backend"
        description={
          <>
            {error?.message} Requests go to <code className="rounded bg-hover px-1">{apiBaseUrl}</code>. Start it with{" "}
            <code className="rounded bg-hover px-1">cd backend && npm run dev</code>.
          </>
        }
        action={<Button onClick={retry}>Retry</Button>}
      />
    </FullScreen>
  );
}

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading")
    return (
      <FullScreen>
        <Logo className="size-8 animate-pulse text-fg" />
      </FullScreen>
    );
  if (status === "unreachable") return <Unreachable />;
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function GuestOnly({ children }) {
  const { status } = useAuth();
  if (status === "loading")
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  if (status === "authenticated") return <Navigate to="/" replace />;
  return children;
}

function NotFound() {
  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <EmptyState title="Page not found" description="The link may be broken or the page was removed." />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<HomePage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/:noteId" element={<NotePage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="diagrams" element={<DiagramsPage />} />
          <Route
            path="diagrams/:diagramId"
            element={
              <Suspense fallback={<FullScreen><Spinner /> Loading editor…</FullScreen>}>
                <DiagramPage />
              </Suspense>
            }
          />
          <Route path="people" element={<PeoplePage />} />
          <Route path="people/:userId" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
