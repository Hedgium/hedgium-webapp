'use client'

import useAlert from '../hooks/useAlert';

const TempAlerts = () => {
  const alert = useAlert();
  
  const handleBuyOrder = () => {
    try {
      // Execute buy order logic
      alert.success('Buy order executed successfully!', { duration: 3000 });
      
    } catch (error) {
      alert.error('Failed to execute buy order');
    }
  };
  
  const handlePriceAlert = () => {
    alert.info('Price alert set for BTC at $50,000', { duration: 5000 });
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Trading Panel</h2>
      <div className="flex gap-2">
        <button 
          className="btn btn-primary"
          onClick={handleBuyOrder}
        >
          Buy BTC
        </button>
        <button 
          className="btn btn-outline"
          onClick={handlePriceAlert}
        >
          Set Price Alert
        </button>
        <button 
          className="btn btn-warning"
          onClick={() => alert.warning('Market volatility is high today', { duration: 4000 })}
        >
          Show Warning
        </button>
      </div>
    </div>
  );
};

export default TempAlerts;