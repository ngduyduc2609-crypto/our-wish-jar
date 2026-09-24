import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchMembers, logAction, type Member } from "./db";

const PRIVATE_ACCESS_MESSAGE = "Đây là không gian riêng tư của Duy Đức và Thu Thuỷ, bạn không có quyền truy cập chiếc lọ này nhé!";
const ALLOWED_MEMBERS = [
  "ngduyduc2609@gmail.com",
  "thuthuydanghocbai@gmail.com",
];
const ALLOWED_EMAILS = new Set(ALLOWED_MEMBERS.map((email) => email.trim().toLowerCase()));

function normalizeEmail(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isAllowedEmail(email?: string | null) {
  return ALLOWED_EMAILS.has(normalizeEmail(email));
}

function getAppRedirectUrl() {
  if (typeof window === "undefined") return "/";
  return window.location.origin;
}

type IdentityValue = {
  members: Member[];
  me: Member | null;
  userId: string | null;
  signedIn: boolean;
  ready: boolean;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  claim: (memberId: string) => Promise<void>;
  track: (action: string, subject?: string | null) => void;
};

const IdentityContext = createContext<IdentityValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? null;

  const { data: members = [], isFetched } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    enabled: Boolean(userId),
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, next) => {
      const email = next?.user?.email ?? session?.user?.email;
      if (next?.user?.email && !isAllowedEmail(next.user.email)) {
        await supabase.auth.signOut();
        toast.error(PRIVATE_ACCESS_MESSAGE);
        setSession(null);
        setAuthReady(true);
        return;
      }

      setSession(next);
      setAuthReady(true);

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void queryClient.invalidateQueries();
      }
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }

      if (event === "SIGNED_IN" && next?.user?.id && email) {
        const target = members.find((member) => member.name.toLowerCase().includes(next.user.email === "ngduyduc2609@gmail.com" ? "duy" : "thu"));
        if (target && target.user_id !== next.user.id) {
          const { error } = await supabase
            .from("members")
            .update({ user_id: next.user.id })
            .eq("id", target.id)
            .is("user_id", null);
          if (!error) {
            await queryClient.invalidateQueries();
          }
        }
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email && !isAllowedEmail(data.session.user.email)) {
        void supabase.auth.signOut();
        toast.error(PRIVATE_ACCESS_MESSAGE);
        setSession(null);
      } else {
        setSession(data.session);
      }
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, members, session]);

  const value = useMemo<IdentityValue>(() => {
    const me = userId ? (members.find((m) => m.user_id === userId) ?? null) : null;
    return {
      members,
      me,
      userId,
      signedIn: Boolean(userId),
      ready: authReady && (!userId || isFetched),
      signIn: async () => {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: getAppRedirectUrl(),
          },
        });
      },
      signInWithPassword: async (email: string, password: string) => {
        const normalizedEmail = normalizeEmail(email);
        if (!isAllowedEmail(normalizedEmail)) {
          await supabase.auth.signOut();
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (data.user?.id) {
          const target = members.find((member) =>
            member.name.toLowerCase().includes(normalizedEmail === "ngduyduc2609@gmail.com" ? "duy" : "thu"),
          );
          if (target && target.user_id !== data.user.id) {
            const { error: updateError } = await supabase
              .from("members")
              .update({ user_id: data.user.id })
              .eq("id", target.id)
              .is("user_id", null);
            if (!updateError) {
              await queryClient.invalidateQueries();
            }
          }
        }
      },
      signUpWithPassword: async (email: string, password: string) => {
        const normalizedEmail = normalizeEmail(email);
        if (!isAllowedEmail(normalizedEmail)) {
          await supabase.auth.signOut();
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getAppRedirectUrl(),
          },
        });
        if (error) throw error;
        if (data.user?.id) {
          const target = members.find((member) =>
            member.name.toLowerCase().includes(normalizedEmail === "ngduyduc2609@gmail.com" ? "duy" : "thu"),
          );
          if (target && target.user_id !== data.user.id) {
            const { error: updateError } = await supabase
              .from("members")
              .update({ user_id: data.user.id })
              .eq("id", target.id)
              .is("user_id", null);
            if (!updateError) {
              await queryClient.invalidateQueries();
            }
          }
        }
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
