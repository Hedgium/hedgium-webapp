"use client";

const BillingTab: React.FC = () => {
  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <h2 className="text-2xl font-bold mb-6">Billing</h2>
      <p className="text-base-content/70 mb-4">Your billing history will appear here.</p>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2025-09-01</td>
            <td>Pro Plan</td>
            <td>₹999</td>
            <td className="text-success">Paid</td>
          </tr>
          <tr>
            <td>2025-08-01</td>
            <td>Pro Plan</td>
            <td>₹999</td>
            <td className="text-success">Paid</td>
          </tr>
        </tbody>
      </table>
      <button className="btn btn-primary mt-6 w-full">Update Payment Method</button>
    </div>
  );
};

export default BillingTab;
