import React from 'react';
import { BuilderLeg } from '@/types/builder';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDateOnly } from '@/utils/formatDate';

interface BuilderLegItemProps {
    leg: BuilderLeg;
    onEdit: (leg: BuilderLeg) => void;
    onDelete: (legId: number) => void;
}

export default function BuilderLegItem({ leg, onEdit, onDelete }: BuilderLegItemProps) {

    return (
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg mb-2 border border-base-300">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 flex-1">
                <div>
                    <p className="text-sm text-base-content/60">Leg Index</p>
                    <p className="font-medium">{leg.leg_index}</p>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Symbol</p>
                    <p className="font-medium">{leg.symbol}</p>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Type</p>
                    <span className={`px-2 py-0.5 rounded text-sm ${leg.option_type === 'CE' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                        {leg.option_type}
                    </span>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Action</p>
                    <span className={`px-2 py-0.5 rounded text-sm ${leg.action === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                        {leg.action}
                    </span>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Strike</p>
                    <p className="font-medium">{leg.strike}</p>
                </div>
                <div>
                    <p className="text-sm text-base-content/60">Period, Expiry</p>
                    <p className="font-medium">{formatDateOnly(leg.expiry)}</p>
                </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
                <button
                    onClick={() => onEdit(leg)}
                    className="p-1.5 cursor-pointer hover:bg-base-300 rounded-full transition-colors text-blue-400"
                    title="Edit Leg"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDelete(leg.id)}
                    className="p-1.5 cursor-pointer hover:bg-base-300 rounded-full transition-colors text-red-400"
                    title="Delete Leg"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
