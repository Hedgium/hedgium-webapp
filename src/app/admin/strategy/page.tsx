"use client";
import { authFetch } from "@/utils/api";
import Link from "next/link";
import React from "react";

interface Version {
  version: number,
  approved: boolean,
}

interface Strategy {
  id: number;
  name: string;
  adjustment_count: number;
  trade_cycle_count: number;
  leg_count: number;
  total_pnl: number | null;
  versions: Version[]
}

// ---- SAMPLE DATA ----
// const strategies: Strategy[] = [
//   {
//     id: 1,
//     name: "NIFTY Credit Spread",
//     versions: [
//       {
//         version: 1,
//         approved: true,
//         legs: [
//           { leg_index: 1, action: "SELL", quantity: 50, instrument: "NIFTY24JAN20000CE", price: 120 },
//           { leg_index: 2, action: "BUY", quantity: 50, instrument: "NIFTY24JAN20200CE", price: 60 },
//         ],
//       },
//       {
//         version: 2,
//         approved: false,
//         legs: [
//           { leg_index: 1, action: "SELL", quantity: 50, instrument: "NIFTY24JAN19900CE", price: null },
//         ],
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "BANKNIFTY Iron Condor",
//     versions: [],
//   },
// ];



export default function Page() {


  const [strategies, setStrategies] = React.useState<Strategy[]>([]);
  const [next, setNext] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isActive, setIsActive] = React.useState<string>("");

  async function fetchStrategies() {
    setLoading(true);
    const res = await authFetch("myadmin/strategies/?page=1&page_size=20" + (isActive === "" ? "" : "&is_active=" + isActive));
    const data = await res.json();
    if (data.next) {
      setNext(data.next.split("api/")[1]);
    } else {
      setNext(null);
    }
    // console.log(data.next)
    setStrategies(data.results);
    setLoading(false);
  }

  async function loadMoreStrategies() {
    if (!next) return;
    setLoading(true);
    const res = await authFetch(next);
    const data = await res.json();
    if (data.next) {
      setNext(data.next.split("api/")[1]);
    }
    setStrategies((prev) => [...prev, ...data.results]);
    setLoading(false);
  }

  React.useEffect(() => {
    fetchStrategies();
  }, [isActive])
  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">

        <h3 className="text-2xl font-bold">Strategies</h3>

        <div className="form-control ">
          <select onChange={(e) => setIsActive(e.target.value)} defaultValue={isActive} className="select select-bordered">
            <option value="" >All</option>
            <option value="true"  >Active</option>
            <option value="false"  >Inactive</option>
          </select>
        </div>

      </div>



      <div className="overflow-x-auto rounded-xl shadow">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Allocated</th>
              <th>Total Adjustments</th>
              <th>Total Legs</th>
              <th>Total PnL</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {strategies.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  No strategies available.
                </td>
              </tr>
            ) : (
              strategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td>{strategy.id}</td>
                  <td className="font-semibold">{strategy.name}</td>
                  <td>{strategy.trade_cycle_count}</td>
                  <td>
                    {/* {strategy.adjustment_count ?? 0} */}


                      {strategy.versions.map((adj, i) => 
                        <div key={i} className="mb-3 pb-2">
                            <span className="font-semibold">
                              v{adj.version}_
                            </span>
                            <span
                              className={`badge ${adj.approved ? "badge-success" : "badge-error"
                                }`}
                            >
                              {adj.approved ? "Approved" : "Not Approved"}
                            </span>
                        </div>)}
                  </td>
                  <td>{strategy.leg_count ?? 0}</td>
                  <td>
                    {strategy.total_pnl !== null
                      ? Number(strategy.total_pnl).toFixed(2)
                      : "—"}
                  </td>

                  <td>
                    <Link href={`/admin/strategy/${strategy.id}`} className="btn btn-sm btn-primary">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(next && !loading) &&
        <button onClick={loadMoreStrategies} className="btn btn-sm">
          Load More
        </button>}

      {loading && <div>Loading strategies...</div>}

    </div>
  );
}
