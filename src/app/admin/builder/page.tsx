"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { StrategyBuilder, BuilderLeg, StrategyBuilderCreate, StrategyBuilderUpdate, BuilderLegCreate, BuilderLegUpdate } from "@/types/builder";
import BuilderItem from "@/components/admin/builder/BuilderItem";
import BuilderForm from "@/components/admin/builder/BuilderForm";
import LegForm from "@/components/admin/builder/LegForm";
import useAlert from "@/hooks/useAlert";
import { Plus } from "lucide-react";

export default function BuilderPage() {
    const [builders, setBuilders] = useState<StrategyBuilder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
    const [isLegModalOpen, setIsLegModalOpen] = useState(false);
    const [editingBuilder, setEditingBuilder] = useState<StrategyBuilder | undefined>(undefined);
    const [editingLeg, setEditingLeg] = useState<BuilderLeg | undefined>(undefined);
    const [selectedBuilderId, setSelectedBuilderId] = useState<number | null>(null);

    const alert = useAlert();

    const fetchBuilders = async () => {
        setLoading(true);
        try {
            const response = await authFetch('builder/builders/');
            const data = await response.json();

            // console.log(data);
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
    }, []);

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
                // Fetch again to get legs (though empty initially) or just append
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
        // Implement status refresh logic here if there's a specific endpoint
        // For now, just re-fetching the builder details
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
        setEditingLeg(undefined);
        setIsLegModalOpen(true);
    };

    const handleEditLeg = (leg: BuilderLeg) => {
        // We need builderId for the form, find it from builders list
        const builder = builders.find(b => b.builder_legs.some(l => l.id === leg.id));
        if (builder) setSelectedBuilderId(builder.id);

        setEditingLeg(leg);
        setIsLegModalOpen(true);
    };

    const handleDeleteLeg = async (legId: number) => {
        if (!confirm('Are you sure you want to delete this leg?')) return;
        try {
            await authFetch(`builder/legs/${legId}/`, { method: 'DELETE' });
            // Update local state
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

                // Update specific leg in the specific builder
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
                console.log('Selected Builder ID:');
                const response = await authFetch('builder/legs/', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const newLeg = await response.json();

                // Add leg to the specific builder
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Strategy Builder</h1>
                <button
                    onClick={handleAddBuilder}
                    className="btn btn-primary gap-2"
                >
                    <Plus size={20} /> Add Builder
                </button>
            </div>

            {loading ? (
                <p className="text-center text-gray-400 mt-4">Loading...</p>
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
                        <p className="text-center text-gray-400">No strategy builders found.</p>
                    )}


                </div>
            )}

            {/* Builder Modal */}
            {isBuilderModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">{editingBuilder ? 'Edit Strategy Builder' : 'Add Strategy Builder'}</h3>
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
                    <div className="modal-box w-11/12 max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">{editingLeg ? 'Edit Leg' : 'Add Leg'}</h3>
                        <LegForm
                            initialData={editingLeg}
                            builderId={selectedBuilderId}
                            onSubmit={handleLegSubmit}
                            onCancel={() => setIsLegModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}