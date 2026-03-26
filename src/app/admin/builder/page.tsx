"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { authFetch } from "@/utils/api";
import { StrategyBuilder, BuilderLeg, StrategyBuilderCreate, StrategyBuilderUpdate, BuilderLegCreate, BuilderLegUpdate } from "@/types/builder";
import BuilderItem from "@/components/admin/builder/BuilderItem";
import useAlert from "@/hooks/useAlert";
import { Plus } from "lucide-react";

import BuilderItemSkeleton from "@/components/skeletons/BuilderItemSkeleton";

const BuilderForm = dynamic(
    () => import("@/components/admin/builder/BuilderForm"),
    { ssr: false }
);

const LegForm = dynamic(
    () => import("@/components/admin/builder/LegForm"),
    { ssr: false }
);

const BuilderTaskControl = dynamic(
    () => import("@/components/admin/builder/BuilderTaskControl"),
    { ssr: false, loading: () => <div className="h-14 w-40 bg-base-300 rounded-xl animate-pulse" /> }
);

const ExitTaskControl = dynamic(
    () => import("@/components/admin/builder/ExitTaskControl"),
    { ssr: false, loading: () => <div className="h-14 w-40 bg-base-300 rounded-xl animate-pulse" /> }
);

export default function BuilderPage() {
    const [builders, setBuilders] = useState<StrategyBuilder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
    const [isLegModalOpen, setIsLegModalOpen] = useState(false);
    const [editingBuilder, setEditingBuilder] = useState<StrategyBuilder | undefined>(undefined);
    const [editingLeg, setEditingLeg] = useState<BuilderLeg | undefined>(undefined);
    const [selectedBuilderId, setSelectedBuilderId] = useState<number | null>(null);
    const [selectedStrategyBuilder, setSelectedStrategyBuilder] = useState<StrategyBuilder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>("");

    const alert = useAlert();

    const fetchBuilders = async () => {
        setLoading(true);
        try {
            const url = statusFilter
                ? `builder/builders/?status=${statusFilter}`
                : 'builder/builders/';
            const response = await authFetch(url);
            const data = await response.json();

            setBuilders(data.results);
        } catch (error) {
            console.error('Error fetching builders:', error);
            alert.error('Failed to fetch strategy builders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilders();
    }, [statusFilter]);

    // --- Builder Actions ---

    const handleAddBuilder = () => {
        setEditingBuilder(undefined);
        setIsBuilderModalOpen(true);
    };

    const handleEditBuilder = (builder: StrategyBuilder) => {
        setEditingBuilder(builder);
        setIsBuilderModalOpen(true);
    };

    const handleDeleteBuilder = async (builderId: number) => {
        if (!confirm('Are you sure you want to delete this strategy builder?')) return;
        try {
            await authFetch(`builder/builders/${builderId}/`, { method: 'DELETE' });
            setBuilders(prev => prev.filter(b => b.id !== builderId));
            alert.success('Strategy builder deleted successfully');
        } catch (error) {
            console.error('Error deleting builder:', error);
            alert.error('Failed to delete strategy builder');
        }
    };

    const handleBuilderSubmit = async (data: StrategyBuilderCreate | StrategyBuilderUpdate) => {
        try {
            if (editingBuilder) {
                const response = await authFetch(`builder/builders/${editingBuilder.id}/`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                const updatedBuilder = await response.json();
                setBuilders(prev => prev.map(b => b.id === updatedBuilder.id ? updatedBuilder : b));
                alert.success('Strategy builder updated successfully');
            } else {
                const response = await authFetch('builder/builders/', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const newBuilder = await response.json();
                setBuilders(prev => [newBuilder, ...prev]);
                alert.success('Strategy builder created successfully');
            }
            setIsBuilderModalOpen(false);
        } catch (error) {
            console.error('Error saving builder:', error);
            alert.error('Failed to save strategy builder');
        }
    };

    const handleRefreshStatus = async (builderId: number) => {
        try {
            const response = await authFetch(`builder/builders/${builderId}/`);
            const updatedBuilder = await response.json();
            setBuilders(prev => prev.map(b => b.id === updatedBuilder.id ? updatedBuilder : b));
            alert.success('Status refreshed');
        } catch (error) {
            console.error('Error refreshing status:', error);
            alert.error('Failed to refresh status');
        }
    };

    // --- Leg Actions ---

    const handleAddLeg = (builderId: number) => {
        setSelectedBuilderId(builderId);
        setSelectedStrategyBuilder(builders.find(b => b.id === builderId));
        setEditingLeg(undefined);
        setIsLegModalOpen(true);
    };

    const handleEditLeg = (leg: BuilderLeg) => {
        const builder = builders.find(b => b.builder_legs.some(l => l.id === leg.id));
        if (builder) setSelectedBuilderId(builder.id);
        setSelectedStrategyBuilder(builder);
        setEditingLeg(leg);
        setIsLegModalOpen(true);
    };

    const handleDeleteLeg = async (legId: number) => {
        if (!confirm('Are you sure you want to delete this leg?')) return;
        try {
            await authFetch(`builder/legs/${legId}/`, { method: 'DELETE' });
            setBuilders(prev => prev.map(b => ({
                ...b,
                builder_legs: b.builder_legs.filter(l => l.id !== legId)
            })));
            alert.success('Leg deleted successfully');
        } catch (error) {
            console.error('Error deleting leg:', error);
            alert.error('Failed to delete leg');
        }
    };

    const handleLegSubmit = async (data: BuilderLegCreate | BuilderLegUpdate) => {
        try {
            if (editingLeg) {
                const response = await authFetch(`builder/legs/${editingLeg.id}/`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                const updatedLeg = await response.json();

                setBuilders(prev => prev.map(b => {
                    if (b.builder_legs.some(l => l.id === updatedLeg.id)) {
                        return {
                            ...b,
                            builder_legs: b.builder_legs.map(l => l.id === updatedLeg.id ? updatedLeg : l)
                        };
                    }
                    return b;
                }));
                alert.success('Leg updated successfully');
            } else {
                const response = await authFetch('builder/legs/', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const newLeg = await response.json();

                setBuilders(prev => prev.map(b => {
                    if (b.id === selectedBuilderId) {
                        return {
                            ...b,
                            builder_legs: [...b.builder_legs, newLeg]
                        };
                    }
                    return b;
                }));
                alert.success('Leg added successfully');
            }
            setIsLegModalOpen(false);
        } catch (error) {
            console.error('Error saving leg:', error);
            alert.error('Failed to save leg');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto lg:px-8">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-4">
                    <h1 className="text-2xl font-semibold">Strategy Builder</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-base-content/80">Filter by Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="select select-bordered select-sm h-9 w-48"
                            >
                                <option value="">All Statuses</option>
                                <option value="CHECKING">Checking</option>
                                <option value="ACTIVE">Active</option>
                                <option value="EXIT_CHECKING">Exit Checking</option>
                                <option value="EXITED">Exited</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                            {statusFilter && (
                                <button
                                    onClick={() => setStatusFilter("")}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleAddBuilder}
                            className="btn btn-primary btn-sm gap-2"
                        >
                            <Plus size={18} /> Add Builder
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                    <BuilderTaskControl />
                    <ExitTaskControl />
                </div>
            </div>

            {loading ? (
                <BuilderItemSkeleton />
            ) : (
                <div className="space-y-4">
                    {builders.map(builder => (
                        <BuilderItem
                            key={builder.id}
                            builder={builder}
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
            )}

            {/* Builder Modal */}
            {isBuilderModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-3xl rounded-xl">
                        <h3 className="font-semibold text-xl mb-4">{editingBuilder ? 'Edit Strategy Builder' : 'Add Strategy Builder'}</h3>
                        <BuilderForm
                            initialData={editingBuilder}
                            onSubmit={handleBuilderSubmit}
                            onCancel={() => setIsBuilderModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Leg Modal */}
            {isLegModalOpen && selectedBuilderId && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-3xl rounded-xl">
                        <h3 className="font-semibold text-xl mb-4">{editingLeg ? 'Edit Leg' : 'Add Leg'}</h3>
                        <LegForm
                            initialData={editingLeg}
                            builderId={selectedBuilderId}
                            onSubmit={handleLegSubmit}
                            onCancel={() => setIsLegModalOpen(false)}
                            exchange={selectedStrategyBuilder?.exchange || 'NFO'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}