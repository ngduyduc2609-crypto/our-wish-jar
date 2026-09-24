import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { fetchMembers, logAction, type Member } from "./db";

const LOCAL_AUTH_SESSION_KEY = "wish-jar-private-auth-session";
const PRIVATE_ACCESS_MESSAGE = "Đây là không gian riêng tư của Duy Đức và Thu Thuỷ, bạn không có quyền truy cập chiếc lọ này nhé!";
const ALLOWED_MEMBERS = [
  "ngduyduc2609@gmail.com",
  "thuthuydanghocbai@gmail.com",
];
const ALLOWED_EMAILS = new Set(ALLOWED_MEMBERS.map((email) => email.trim().toLowerCase()));

type LocalAuthSession = {
  userId: string;
  email: string;
  name: string;
};

function normalizeEmail(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isAllowedEmail(email?: string | null) {
  return ALLOWED_EMAILS.has(normalizeEmail(email));
}

function getMemberNameFromEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return normalized === "ngduyduc2609@gmail.com" ? "Duy Đức" : "Thu Thuỷ";
}

function findMemberForEmail(members: Member[], email?: string | null) {
  const normalized = normalizeEmail(email);
  const keyword = normalized === "ngduyduc2609@gmail.com" ? "duy" : "thu";
  return members.find((member) => member.name.toLowerCase().includes(keyword)) ?? null;
}

function readStoredAuthSession(): LocalAuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LocalAuthSession>;
    if (!parsed.userId || !parsed.email) {
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
      return null;
    }

    const email = normalizeEmail(parsed.email);
    if (!isAllowedEmail(email)) {
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
      return null;
    }

    return {
      userId: String(parsed.userId),
      email,
      name: parsed.name || getMemberNameFromEmail(email),
    };
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    }
    return null;
  }
}

function persistAuthSession(session: LocalAuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(session));
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
  const [authReady, setAuthReady] = useState(false);
  const [localSession, setLocalSession] = useState<LocalAuthSession | null>(() => readStoredAuthSession());
  const queryClient = useQueryClient();
  const userId = localSession?.userId ?? null;

  const { data: members = [], isFetched } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    enabled: true,
  });

  useEffect(() => {
    setAuthReady(true);
  }, []);

  const value = useMemo<IdentityValue>(() => {
    const sessionEmail = localSession?.email ?? null;
    const me = userId
      ? members.find((member) => member.id === userId) ??
        (sessionEmail ? findMemberForEmail(members, sessionEmail) : null) ??
        null
      : null;

    return {
      members,
      me,
      userId,
      signedIn: Boolean(userId),
      ready: authReady && isFetched,
      signIn: async () => {
        throw new Error("Vui lòng đăng nhập bằng email được cấp trong danh sách trắng.");
      },
      signInWithPassword: async (email: string, password: string) => {
        const normalizedEmail = normalizeEmail(email);
        if (!password.trim()) {
          throw new Error("Vui lòng nhập mật khẩu.");
        }
        if (!isAllowedEmail(normalizedEmail)) {
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }

        const member = findMemberForEmail(members, normalizedEmail) ?? {
          id: normalizedEmail,
          name: getMemberNameFromEmail(normalizedEmail),
          emoji: normalizedEmail === "ngduyduc2609@gmail.com" ? "🧑‍💻" : "💐",
          color: normalizedEmail === "ngduyduc2609@gmail.com" ? "#f59e0b" : "#f472b6",
          user_id: null,
        };

        const nextSession: LocalAuthSession = {
          userId: member.id,
          email: normalizedEmail,
          name: member.name,
        };

        setLocalSession(nextSession);
        persistAuthSession(nextSession);
        await queryClient.invalidateQueries();
      },
      signUpWithPassword: async (email: string, password: string) => {
        const normalizedEmail = normalizeEmail(email);
        if (!password.trim()) {
          throw new Error("Vui lòng nhập mật khẩu.");
        }
        if (!isAllowedEmail(normalizedEmail)) {
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }

        const member = findMemberForEmail(members, normalizedEmail) ?? {
          id: normalizedEmail,
          name: getMemberNameFromEmail(normalizedEmail),
          emoji: normalizedEmail === "ngduyduc2609@gmail.com" ? "🧑‍💻" : "💐",
          color: normalizedEmail === "ngduyduc2609@gmail.com" ? "#f59e0b" : "#f472b6",
          user_id: null,
        };

        const nextSession: LocalAuthSession = {
          userId: member.id,
          email: normalizedEmail,
          name: member.name,
        };

        setLocalSession(nextSession);
        persistAuthSession(nextSession);
        await queryClient.invalidateQueries();
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        setLocalSession(null);
        persistAuthSession(null);
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
  }, [authReady, isFetched, localSession, members, queryClient, userId]);

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
