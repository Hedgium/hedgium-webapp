import React, { useState } from 'react';
import { StrategyBuilder, BuilderLeg } from '@/types/builder';
import { Edit2, Trash2, RotateCw, Plus } from 'lucide-react';
import BuilderLegItem from './BuilderLegItem';
import { formatDateTimeMinutes } from '@/utils/formatDate';

interface BuilderItemProps {
    builder: StrategyBuilder;
    onEdit: (builder: StrategyBuilder) => void;
    onDelete: (builderId: number) => void;
    onAddLeg: (builderId: number) => void;
    onEditLeg: (leg: BuilderLeg) => void;
    onDeleteLeg: (legId: number) => void;
    onRefreshStatus: (builderId: number) => void;
}

export default function BuilderItem({
    builder,
    onEdit,
    onDelete,
    onAddLeg,
    onEditLeg,
    onDeleteLeg,
    onRefreshStatus
}: BuilderItemProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefreshStatus(builder.id);
        setIsRefreshing(false);
    };

    return (
        <div className="bg-base-100 rounded-lg p-4 mb-6 border border-base-300 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-base-200">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        {builder.name}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${builder.status === 'ACTIVE' ? 'border-green-500 text-green-500' :
                            builder.status === 'INACTIVE' ? 'border-red-500 text-red-500' : 'border-gray-500 text-gray-500'
                            }`}>
                            {builder.status}
                        </span>
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                        <span>Exch: <span className="">{builder?.exchange}</span></span>
                        <span>Strike Step: <span className="">{builder?.strike_step}</span></span>
                        <span>Entry WS: <span className="">{builder?.entry_ws}%</span></span>
                        <span>Exit WS: <span className="">{builder?.exit_ws}%</span></span>
                        <span>Calc WS: <span className="">{builder?.calculated_ws}%, at {formatDateTimeMinutes(builder?.updated_at)}</span></span>


                    </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-ghost btn-sm ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh Status"
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={() => onEdit(builder)}
                        className="btn btn-ghost btn-sm text-blue-400"
                        title="Edit Builder"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(builder.id)}
                        className="btn btn-ghost btn-sm text-red-400"
                        title="Delete Builder"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="pl-0 md:pl-0">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Builder Legs</h4>
                    <button
                        onClick={() => onAddLeg(builder.id)}
                        className="btn btn-xs btn-outline btn-primary gap-1"
                    >
                        <Plus size={14} /> Add Leg
                    </button>
                </div>

                {builder.builder_legs.length > 0 ? (
                    <div className="space-y-2">
                        {builder.builder_legs.map(leg => (
                            <BuilderLegItem
                                key={leg.id}
                                leg={leg}
                                onEdit={onEditLeg}
                                onDelete={onDeleteLeg}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-base-200/50 rounded-md text-gray-500 text-sm italic">
                        No legs configured yet.
                    </div>
                )}
            </div>
        </div>
    );
}
