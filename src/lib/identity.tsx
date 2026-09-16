import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchMembers, logAction, type Member } from "./db";

type IdentityValue = {
  members: Member[];
  me: Member | null;
  userId: string | null;
  signedIn: boolean;
  ready: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  claim: (memberId: string) => Promise<void>;
  track: (action: string, subject?: string | null) => void;
};

const IdentityContext = createContext<IdentityValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setAuthReady(true);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void queryClient.invalidateQueries();
      }
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user?.id ?? null;

  const { data: members = [], isFetched } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    enabled: Boolean(userId),
  });

  const value = useMemo<IdentityValue>(() => {
    const me = userId ? (members.find((m) => m.user_id === userId) ?? null) : null;
    return {
      members,
      me,
      userId,
      signedIn: Boolean(userId),
      ready: authReady && (!userId || isFetched),
      signIn: async () => {
        await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
      claim: async (memberId: string) => {
        if (!userId) return;
        const { error } = await supabase
          .from("members")
          .update({ user_id: userId })
          .eq("id", memberId)
          .is("user_id", null);
        if (error) throw error;
        await queryClient.invalidateQueries();
      },
      track: (action: string, subject?: string | null) => {
        if (!me) return;
        void logAction(me.id, action, subject ?? null);
      },
    };
  }, [members, userId, authReady, isFetched, queryClient]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity phải nằm trong IdentityProvider");
  return ctx;
}

export function useMemberName(members: Member[], id?: string | null) {
  if (!id) return "Ai đó";
  return members.find((m) => m.id === id)?.name ?? "Ai đó";
}
