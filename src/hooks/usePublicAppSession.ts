"use client";

import { useEffect, useState } from "react";
import { isDemoModeEnabled } from "@/lib/demo";
import { supabase } from "@/lib/supabase/client";

export const usePublicAppSession = () => {
  const [hasAppSession, setHasAppSession] = useState(false);
  const [isSessionResolved, setIsSessionResolved] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const resolveSession = async () => {
      if (isDemoModeEnabled()) {
        if (!isCancelled) {
          setHasAppSession(true);
          setIsSessionResolved(true);
        }
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!isCancelled) {
        setHasAppSession(Boolean(data.user));
        setIsSessionResolved(true);
      }
    };

    resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasAppSession(Boolean(session?.user) || isDemoModeEnabled());
      setIsSessionResolved(true);
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { hasAppSession, isSessionResolved };
};
