"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { persistFromRedirectUriParam } from "@/utils/nativeAppReturn";

export default function NativeAppReturnCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    persistFromRedirectUriParam(searchParams.get("redirect_uri"));
  }, [searchParams]);

  return null;
}
