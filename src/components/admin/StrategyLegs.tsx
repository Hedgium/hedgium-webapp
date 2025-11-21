"use client";

import { useState } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

function SingleLegRow({ leg }) {
  const [qty, setQty] = useState(leg.quantity);
  const [price, setPrice] = useState(leg.price);

  const alert = useAlert();

  async function onSave(legId: number, newQty: number, newPrice: number | null) {
    // Implement save logic here, e.g., call an API to update the leg
    alert.success("Leg saved successfully!", { duration: 3000 });
    const res = await authFetch("myadmin/update-cycle-leg/", {
      method: "POST",
      body: JSON.stringify({
        leg_id: legId,
        quantity: newQty,
        price: newPrice,
      }),
    });
    // alert.success("Leg saved successfully!", { duration: 3000 });
  }

  return (
    <tr>
      <td>{leg.leg_index}</td>

      <td>{leg.action}</td>
      <td>{leg.instrument}</td>

      {/* Editable Quantity */}
      <td>
        <input
          type="number"
          className="input input-sm input-bordered w-24"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </td>

      {/* Editable Price (optional, mkt allowed) */}
      <td>{leg.order_type}</td>

      <td>
        <input
          type="number"
          className="input input-sm input-bordered w-24"
          placeholder="MKT"
          value={price ?? ""}
          onChange={(e) =>
            setPrice(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      </td>

      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => onSave(leg.id, qty, price)}
        >
          Save
        </button>
      </td>
    </tr>
  );
}

export default function StrategyLegs({ legs }) {
  return (
    <>
      {legs?.length > 0 ? (
        legs.map((leg) => (
          <SingleLegRow key={leg.id} leg={leg} />
        ))
      ) : (
        <tr>
          <td colSpan={8} className="text-center opacity-60 py-4">
            No legs found
          </td>
        </tr>
      )}
    </>
  );
}
