"use client"
import { useState, useEffect } from 'react';

import { CheckIcon } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';

import { authFetch, myFetch } from '@/utils/api';


interface Plan {
  id: string;
  name: string;
  price: number;
  aum: string;
  features: string[];
  popular?: boolean;
  description: string;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
}


export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>([]);
  const {user, updateUser} = useAuthStore();
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);


  const [currentStep, setCurrentStep] = useState<'select' | 'payment' | 'success'>('select');
  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const url = "subscriptions/user-subscriptions/"

    const res = await authFetch(url, {
        method:"POST",
        body: JSON.stringify({
            "user_id": user.id,
            "plan_id": selectedPlan.id
        })
    })

    const data = await res.json();
    // console.log(data);
    updateUser({active_subscription:data})



    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setPaymentSuccess(true);
    setCurrentStep('success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function getAllPlans(){
       const res = await myFetch("subscriptions/?page=1&page_size=10");
       const data = await res.json();
       const plansData = data.results;
       const plansWithFeatureList: Plan[] = plansData.map(plan => ({
            ...plan,
            features: plan.features.split(",").map(f => f.trim())
        }));
        console.log(plansWithFeatureList);
       setPlans(plansWithFeatureList);
        
  }

  useEffect(()=>{
    getAllPlans();
  },[])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return value;
  };

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="card-title justify-center text-2xl mb-2">Payment Successful!</h2>
            <p className="text-lg font-semibold mb-2">{selectedPlan?.name} Plan Activated</p>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to our {selectedPlan?.name} plan. Your account has been upgraded and you now have access to all premium features.
            </p>
            <div className="card-actions justify-center">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setCurrentStep('select');
                  setSelectedPlan(null);
                  setPaymentSuccess(false);
                }}
              >
                Back to Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'payment' && selectedPlan) {
    return (
      <div className="min-h-screen bg-base-200 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button 
            className="btn btn-ghost mb-6"
            onClick={() => setCurrentStep('select')}
          >
            ← Back to Plans
          </button>
          
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-2">Complete Your Purchase</h2>
              
              {/* Order Summary */}
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPlan.name} Plan</p>
                    <p className="text-sm text-gray-600">{selectedPlan.aum}</p>
                  </div>
                  <p className="text-lg font-bold">₹{selectedPlan.price}/month</p>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePaymentSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Card Holder Name</span>
                    </label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={paymentData.cardHolder}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="input input-bordered w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Card Number</span>
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formatCardNumber(paymentData.cardNumber)}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Expiry Date</span>
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formatExpiryDate(paymentData.expiryDate)}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text">CVV</span>
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength={3}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="card-actions justify-end mt-8">
                  <button 
                    type="submit" 
                    className={`btn btn-primary w-full ${isProcessing ? 'loading' : ''}`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Pay ₹${selectedPlan.price}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Subscription-based model with tiers designed for different investor profiles based on AUM
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card rounded-xl transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'bg-primary text-primary-content shadow-2xl transform scale-105' 
                  : 'bg-base-100 border border-base-300'
              }`}
            >
              {plan.popular && (
                <div className="badge badge-accent absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  POPULAR
                </div>
              )}
              
              <div className="card-body p-8">
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? 'text-primary-content' : 'text-primary'}`}>
                    {plan.name}
                  </h3>
                  <div className={`text-3xl font-bold mb-1 ${plan.popular ? 'text-accent' : 'text-secondary'}`}>
                    ₹{plan.price}
                  </div>
                  <p className={`text-sm ${plan.popular ? 'text-primary-content/80' : 'text-gray-500'}`}>
                    {plan.aum}
                  </p>
                </div>

                <p className={`text-sm mb-6 ${plan.popular ? 'text-primary-content/80' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                        plan.popular ? 'text-green-400' : 'text-green-500'
                      }`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn w-full ${
                    plan.popular 
                      ? 'btn-accent text-accent-content' 
                      : 'btn-outline btn-primary'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include our proprietary AI stack and risk management framework
          </p>
        </div>
      </div>
    </div>
  );
}