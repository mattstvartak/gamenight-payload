"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setVerificationStatus("error");
        toast({
          title: "Error",
          description: "No verification token found.",
          variant: "destructive",
        });
        return;
      }

      console.log(token);
      try {
        const res = await fetch(`/api/users/verify/${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Verification failed");
        }

        setVerificationStatus("success");
        toast({
          title: "Success",
          description: "Your email has been verified successfully!",
        });
      } catch (error) {
        setVerificationStatus("error");
        toast({
          title: "Error",
          description: "Failed to verify email. Please try again.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        {verificationStatus === "loading" && (
          <div>
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
            <p className="mt-2 text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {verificationStatus === "success" && (
          <div>
            <h1 className="text-2xl font-bold text-green-600">
              Email Verified!
            </h1>
            <p className="mt-2 text-gray-600">
              Your email has been successfully verified. You can now close this
              window.
            </p>
          </div>
        )}

        {verificationStatus === "error" && (
          <div>
            <h1 className="text-2xl font-bold text-red-600">
              Verification Failed
            </h1>
            <p className="mt-2 text-gray-600">
              We couldn't verify your email. The link may have expired or is
              invalid.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
