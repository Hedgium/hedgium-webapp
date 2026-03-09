"use client";
import { useAuthStore } from "@/store/authStore";

import { formatDateOnly } from "@/utils/formatDate";
import { formatMoneyIN } from "@/utils/formatNumber";

export default function SubscriptionTab(){

    const {user} = useAuthStore();

    console.log(user?.active_subscription)

    return(
       <>

       <div className="card bg-base-100 border border-base-300 p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Subscription Info</h2>
                
                
                {user?.active_subscription && <div className="space-y-6">
                  <div className="card bg-base-200 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Current Plan</h3>
                      <span className="badge badge-primary">{user?.active_subscription?.plan.name}</span>
                    </div>
                    <p className="text-base-content/80">{formatMoneyIN(user?.active_subscription?.plan.price)}/month</p>
                    <p className="text-sm text-base-content/60 mt-2">Active till: {formatDateOnly(user.active_subscription?.end_date)}</p>
                    <button className="btn btn-outline btn-sm mt-4">Change Plan</button>
                  </div>
                  <div>
                    
                  </div>

                </div>}

                {!user?.active_subscription && <div className="space-y-6">
                  <div className="card bg-base-200 p-4">
                    <p>No active subscription.</p>
                    <a href="/hedgium/upgrade" className="btn btn-outline btn-sm mt-4">Upgrade now</a>
                  </div>
                  <div>
                    
                  </div>

                </div>}



              </div>

       </> 
    )
}