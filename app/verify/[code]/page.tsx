"use client";

import { api } from "@/convex/_generated/api";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { CheckCircle, Loader2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type VerifyResult = {
  success: boolean;
  message: string;
  gateName?: string;
  eventName?: string;
};

export default function VerifyPage() {
  const params = useParams();
  const qrCode = decodeURIComponent(params.code as string);
  const { user, isLoaded, isSignedIn } = useUser();
  const verifyQR = useMutation(api.gateQueue.verifyQRCode);

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleVerify = async () => {
    if (!user) return;
    setIsVerifying(true);
    try {
      const res = await verifyQR({
        qrCode,
        verifierUserId: user.id,
        verifierName: user.fullName ?? user.firstName ?? undefined,
        verifierEmail: user.primaryEmailAddress?.emailAddress ?? undefined,
      });
      setResult(res);
    } catch (error) {
      console.error("Verification error:", error);
      setResult({
        success: false,
        message: "Something went wrong during verification.",
      });
    } finally {
      setIsVerifying(false);
      setHasAttempted(true);
    }
  };

  // Auto-verify once user is loaded and signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && !hasAttempted && !isVerifying) {
      handleVerify();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not signed in — require login
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">
            Sign In Required
          </h1>
          <p className="text-gray-600">
            You need to sign in to verify your QR code and enter through the
            gate.
          </p>
          <SignInButton
            mode="modal"
            fallbackRedirectUrl={`/verify/${encodeURIComponent(qrCode)}`}
          >
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
              Sign In to Verify
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Verifying...
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">Verifying...</h1>
          <p className="text-gray-500">Scanning your QR code</p>
        </div>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
          {result.success ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-800">
                Verified!
              </h1>
              {result.eventName && (
                <p className="text-lg text-gray-700 font-medium">
                  {result.eventName}
                </p>
              )}
              <p className="text-gray-600">{result.message}</p>
              {result.gateName && (
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {result.gateName}
                </div>
              )}
              <p className="text-sm text-gray-400">
                Verified by: {user.fullName ?? user.primaryEmailAddress?.emailAddress}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-800">
                Verification Failed
              </h1>
              <p className="text-gray-600">{result.message}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
