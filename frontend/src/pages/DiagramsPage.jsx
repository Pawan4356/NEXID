import { useNavigate } from "react-router";
import { PenTool, Plus } from "lucide-react";
import { Topbar } from "../components/layout/Topbar";
import { DiagramCard } from "../components/diagrams/DiagramCard";
import { Button, EmptyState, ErrorState, MockBadge, Skeleton } from "../components/ui";
import { useDiagramMutations, useDiagrams } from "../hooks/useDiagrams";

export default function DiagramsPage() {
  const { data = [], isLoading, error, refetch } = useDiagrams();
  const { create } = useDiagramMutations();
  const navigate = useNavigate();
  const newDiagram = () => create.mutate({}, { onSuccess: (d) => navigate(`/diagrams/${d.id}`) });
  const sorted = [...data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="flex h-full flex-col">
      <Topbar crumbs={[{ label: "Diagrams", icon: <PenTool className="size-4" /> }]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 pt-10 pb-24 sm:px-12">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold tracking-tight">Diagrams</h1>
              <p className="mt-1 text-sm text-muted">Whiteboards and flowcharts, powered by Excalidraw.</p>
            </div>
            <MockBadge className="mb-1.5" />
            <Button variant="primary" icon={Plus} onClick={newDiagram} loading={create.isPending}>
              New diagram
            </Button>
          </div>
          <div className="mt-8">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : sorted.length === 0 ? (
              <EmptyState
                icon={PenTool}
                title="No diagrams yet"
                description="Sketch an architecture, a flow, or a quick wireframe."
                action={
                  <Button variant="primary" icon={Plus} onClick={newDiagram}>
                    New diagram
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((d) => (
                  <DiagramCard key={d.id} diagram={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
