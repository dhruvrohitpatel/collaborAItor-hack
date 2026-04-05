"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { useMockAuthClient } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "collabor-aitor.mock-auth";

export function MockAuthToggle() {
  const mockAuthEnabled = useMockAuthClient();
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    if (!mockAuthEnabled) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSignedIn(saved === "on");
    }
  }, [mockAuthEnabled]);

  if (!mockAuthEnabled) {
    return <Badge variant="secondary">Firebase mode configured</Badge>;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={signedIn ? "success" : "warning"}>
        <UserRound className="mr-1 h-3.5 w-3.5" />
        {signedIn ? "Mock Google Session" : "Signed out"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const nextValue = !signedIn;
          setSignedIn(nextValue);
          window.localStorage.setItem(STORAGE_KEY, nextValue ? "on" : "off");
        }}
      >
        {signedIn ? "Sign out" : "Sign in"}
      </Button>
    </div>
  );
}
