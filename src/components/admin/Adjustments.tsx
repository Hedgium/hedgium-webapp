"use client";

import { useState } from "react";
import StrategyLegs from "./StrategyLegs";
import { authFetch } from "@/utils/api";
import { formatDateTimeMinutes } from "@/utils/formatDate";

function Adjustment({ adj }) {
  const [open, setOpen] = useState(false);

  async function approveAdjustment(adjId: number) {
    try {
      const res = await authFetch(`myadmin/approve-adjustment/${adjId}/`, {
        method: "POST",
        body: JSON.stringify({ adjustment_id: adjId }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      console.log("Approved adjustment:", data);

    } catch (error) {
      console.error("Error approving adjustment:", error);
    }
  }

  return (
    <div className="border border-base-300 rounded-xl shadow mb-4 bg-base-100">
      
      {/* COLLAPSE HEADER */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <span className="font-bold">v{adj.version}</span>
          <span className="text-gray-700">{adj.title || "-"}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* <span className="text-sm opacity-70">Approved: {adj.approved ? "Yes" : "No"}</span> */}
          <span className="text-sm opacity-70">{formatDateTimeMinutes(adj.created_at)}</span>

          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent dropdown toggle
              approveAdjustment(adj.id);
            }}
            className={`btn btn-sm ${
              adj.approved ? "btn-disabled" : "btn-success"
            }`}
          >
            {adj.approved ? "Approved" : "Approve"}
          </button>

          {/* Arrow */}
          <span className="transition-transform"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
        </div>
      </div>

      {/* COLLAPSE CONTENT */}
      {open && (
        <div className="p-4 border-t border-base-300 rounded-xl bg-base-100">
          {/* Notes */}
          {/* {adj.notes && (
            <p className="mb-3 text-sm text-gray-700">
              <strong>Notes:</strong> {adj.notes}
            </p>
          )} */}

          {/* Strategy Legs Table */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Leg #</th>
                  <th>Action</th>
                  <th>Instrument</th>
                  <th>Qty</th>
                  <th>Order Type</th>
                  <th>Price</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                <StrategyLegs legs={adj.legs} />
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Adjustments({ adjustments }) {
  return (
    <div className="mt-4">
      {adjustments.map((adj) => (
        <Adjustment key={adj.id} adj={adj} />
      ))}
    </div>
  );
}
