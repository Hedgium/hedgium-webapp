"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  createBuilder,
  createBuilderLeg,
  deleteBuilder,
  deleteBuilderLeg,
  getBuilder,
  listBuilders,
  updateBuilder,
  updateBuilderLeg,
} from "@/services/builder";
import {
  StrategyBuilder,
  BuilderLeg,
  StrategyBuilderCreate,
  StrategyBuilderUpdate,
  BuilderLegCreate,
  BuilderLegUpdate,
} from "@/types/builder";
import BuilderItem from "@/components/admin/builder/BuilderItem";
import useAlert from "@/hooks/useAlert";
import { Plus } from "lucide-react";
import BuilderItemSkeleton from "@/components/skeletons/BuilderItemSkeleton";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const BuilderForm = dynamic(
  () => import("@/components/admin/builder/BuilderForm"),
  { ssr: false }
);

const LegForm = dynamic(
  () => import("@/components/admin/builder/LegForm"),
  { ssr: false }
);

export default function ClientBuilderPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [builders, setBuilders] = useState<StrategyBuilder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [isLegModalOpen, setIsLegModalOpen] = useState(false);
  const [editingBuilder, setEditingBuilder] = useState<StrategyBuilder | undefined>(undefined);
  const [editingLeg, setEditingLeg] = useState<BuilderLeg | undefined>(undefined);
  const [selectedBuilderId, setSelectedBuilderId] = useState<number | null>(null);
  const [selectedStrategyBuilder, setSelectedStrategyBuilder] = useState<StrategyBuilder | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const alert = useAlert();

  useEffect(() => {
    if (user?.is_demo) {
      router.replace("/home");
    }
  }, [user?.is_demo, router]);

  const fetchBuilders = async () => {
    setLoading(true);
    try {
      const data = await listBuilders(statusFilter || undefined);
      setBuilders(data.results ?? []);
      setNextPage(data.next ?? null);
    } catch (error) {
      console.error("Error fetching builders:", error);
      alert.error("Failed to fetch strategy builders");
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (!nextPage) return;
    setLoadingMore(true);
    try {
      const url = new URL(nextPage);
      const path = url.pathname.replace(/^\/api\//, "") || "builder/builders/";
      const { authFetch } = await import("@/utils/api");
      const response = await authFetch(`${path}${url.search}`);
      const data = await response.json();
      setBuilders((prev) => {
        const incoming = data.results ?? [];
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...incoming.filter((b: StrategyBuilder) => b.id != null && !seen.has(b.id))];
      });
      setNextPage(data.next ?? null);
    } catch (error) {
      console.error("Error fetching next page:", error);
      alert.error("Failed to load more builders");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.is_demo) return;
    fetchBuilders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user?.is_demo]);

  const handleAddBuilder = () => {
    setEditingBuilder(undefined);
    setIsBuilderModalOpen(true);
  };

  const handleEditBuilder = (builder: StrategyBuilder) => {
    setEditingBuilder(builder);
    setIsBuilderModalOpen(true);
  };

  const handleDeleteBuilder = async (builderId: number) => {
    if (!confirm("Are you sure you want to delete this strategy builder?")) return;
    try {
      const result = await deleteBuilder(builderId);
      if (result.kind === "pending") {
        alert.info(result.data.message);
        return;
      }
      setBuilders((prev) => prev.filter((b) => b.id !== builderId));
      alert.success("Strategy builder deleted successfully");
    } catch (error) {
      console.error("Error deleting builder:", error);
      alert.error("Failed to delete strategy builder");
    }
  };

  const handleBuilderSubmit = async (data: StrategyBuilderCreate | StrategyBuilderUpdate) => {
    try {
      if (editingBuilder) {
        const result = await updateBuilder(editingBuilder.id, data);
        if (result.kind === "pending") {
          alert.info(result.data.message);
          setIsBuilderModalOpen(false);
          return;
        }
        setBuilders((prev) => prev.map((b) => (b.id === result.data.id ? result.data : b)));
        alert.success("Strategy builder updated successfully");
      } else {
        const newBuilder = await createBuilder(data as StrategyBuilderCreate);
        setBuilders((prev) => [newBuilder, ...prev]);
        alert.success("Strategy builder created successfully");
      }
      setIsBuilderModalOpen(false);
    } catch (error) {
      console.error("Error saving builder:", error);
      alert.error("Failed to save strategy builder");
    }
  };

  const handleRefreshStatus = async (builderId: number) => {
    try {
      const updatedBuilder = await getBuilder(builderId);
      setBuilders((prev) => prev.map((b) => (b.id === updatedBuilder.id ? updatedBuilder : b)));
      alert.success("Status refreshed");
    } catch (error) {
      console.error("Error refreshing status:", error);
      alert.error("Failed to refresh status");
    }
  };

  const handleAddLeg = (builderId: number) => {
    setSelectedBuilderId(builderId);
    setSelectedStrategyBuilder(builders.find((b) => b.id === builderId));
    setEditingLeg(undefined);
    setIsLegModalOpen(true);
  };

  const handleEditLeg = (leg: BuilderLeg) => {
    const builder = builders.find((b) => b.builder_legs.some((l) => l.id === leg.id));
    if (builder) setSelectedBuilderId(builder.id);
    setSelectedStrategyBuilder(builder);
    setEditingLeg(leg);
    setIsLegModalOpen(true);
  };

  const handleDeleteLeg = async (legId: number) => {
    if (!confirm("Are you sure you want to delete this leg?")) return;
    try {
      const result = await deleteBuilderLeg(legId);
      if (result.kind === "pending") {
        alert.info(result.data.message);
        return;
      }
      setBuilders((prev) =>
        prev.map((b) => ({
          ...b,
          builder_legs: b.builder_legs.filter((l) => l.id !== legId),
        }))
      );
      alert.success("Leg deleted successfully");
    } catch (error) {
      console.error("Error deleting leg:", error);
      alert.error("Failed to delete leg");
    }
  };

  const handleLegSubmit = async (data: BuilderLegCreate | BuilderLegUpdate) => {
    try {
      if (editingLeg) {
        const result = await updateBuilderLeg(editingLeg.id, data);
        if (result.kind === "pending") {
          alert.info(result.data.message);
          setIsLegModalOpen(false);
          return;
        }
        const updatedLeg = result.data;
        setBuilders((prev) =>
          prev.map((b) => {
            if (b.builder_legs.some((l) => l.id === updatedLeg.id)) {
              return {
                ...b,
                builder_legs: b.builder_legs.map((l) => (l.id === updatedLeg.id ? updatedLeg : l)),
              };
            }
            return b;
          })
        );
        alert.success("Leg updated successfully");
      } else {
        const result = await createBuilderLeg(data as BuilderLegCreate);
        if (result.kind === "pending") {
          alert.info(result.data.message);
          setIsLegModalOpen(false);
          return;
        }
        const newLeg = result.data;
        setBuilders((prev) =>
          prev.map((b) => {
            if (b.id === selectedBuilderId) {
              return {
                ...b,
                builder_legs: [...b.builder_legs, newLeg],
              };
            }
            return b;
          })
        );
        alert.success("Leg added successfully");
      }
      setIsLegModalOpen(false);
    } catch (error) {
      console.error("Error saving leg:", error);
      alert.error("Failed to save leg");
    }
  };

  if (user?.is_demo) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-base-300 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">Strategy Builder</h1>
            <p className="text-sm text-base-content/60 mt-1">
              Create builders for your profile. Edits are sent for system validation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm h-9 w-40"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="CHECKING">Checking</option>
              <option value="ACTIVE">Active</option>
              <option value="EXIT_CHECKING">Exit Checking</option>
              <option value="EXIT_STARTED">Exit Started</option>
              <option value="EXITED">Exited</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button
              type="button"
              onClick={handleAddBuilder}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus size={18} /> Add Builder
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <BuilderItemSkeleton />
      ) : (
        <>
          <div className="space-y-4">
            {builders.map((builder, index) => (
              <BuilderItem
                key={builder.id ?? `builder-${index}`}
                builder={builder}
                variant="client"
                onEdit={handleEditBuilder}
                onDelete={handleDeleteBuilder}
                onAddLeg={handleAddLeg}
                onEditLeg={handleEditLeg}
                onDeleteLeg={handleDeleteLeg}
                onRefreshStatus={handleRefreshStatus}
              />
            ))}
            {builders.length === 0 && (
              <p className="text-center text-base-content/60">No strategy builders found.</p>
            )}
          </div>

          {nextPage && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={fetchNextPage}
                disabled={loadingMore}
                className="btn btn-outline btn-sm"
              >
                {loadingMore ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {isBuilderModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl rounded-xl">
            <h3 className="font-semibold text-xl mb-4">
              {editingBuilder ? "Edit Strategy Builder" : "Add Strategy Builder"}
            </h3>
            <BuilderForm
              variant="client"
              initialData={editingBuilder}
              onSubmit={handleBuilderSubmit}
              onCancel={() => setIsBuilderModalOpen(false)}
            />
          </div>
        </div>
      )}

      {isLegModalOpen && selectedBuilderId && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl rounded-xl">
            <h3 className="font-semibold text-xl mb-4">
              {editingLeg ? "Edit Leg" : "Add Leg"}
            </h3>
            <LegForm
              initialData={editingLeg}
              builderId={selectedBuilderId}
              onSubmit={handleLegSubmit}
              onCancel={() => setIsLegModalOpen(false)}
              exchange={selectedStrategyBuilder?.exchange || "NFO"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
