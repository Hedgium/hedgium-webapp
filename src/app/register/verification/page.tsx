"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import SignUpStepper from "@/components/SignUpStepper";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

const VerificationPending: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter()
  const alert = useAlert()

  const formData = new FormData();
 

  const handleSkip = async (e: React.FormEvent) => {
      try{
      setSubmitting(true);
  
      e.preventDefault();
      formData.append("kyc_skipped", "true"); // optional, if you added this field
      const res = await authFetch("users/" + (user?.id ?? "") + "/", {
        method: "PUT",
        body: formData,
      });
  
    updateUser({  kyc_skipped: true });
  
    alert.success("Verification skipped", {
      duration: 3000,
    }); 
    } catch(e){
      // alert.error("Something went wrong!!", {duration:4000})
    }
    
    finally{
          setSubmitting(false);
    }
  
  
    }


  useEffect(()=>{
    if (user.signup_step=="verified") {
      router.push("/hedgium/dashboard")
    }
  },[])

  return (
    <div className="min-h-screen hero-pattern flex flex-col items-center justify-center bg-base-200 p-6">
      {/* Stepper showing progress */}
      <div className="w-full max-w-2xl mb-12">
        <SignUpStepper currentStepId="broker_profile_added" />
      </div>

      {/* Card with pending message */}
      <div className="card w-full max-w-lg shadow-xl bg-base-100 p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Clock className="w-16 h-16 text-warning animate-pulse" />

          <h1 className="text-2xl font-bold text-warning">
            Profile Verification Pending
          </h1>

          <p className="text-base text-gray-600">
            Thank you for submitting your details. Your profile is currently under review.
            Please wait for some time while our team verifies your information.
          </p>

          <p className="text-sm text-gray-500 italic">
            You’ll be notified once the verification is complete.
          </p>

          <button
                type="button"
                disabled={submitting}
                onClick={handleSkip}
                className="btn btn-outline"
              >
                Skip Verification
        </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
