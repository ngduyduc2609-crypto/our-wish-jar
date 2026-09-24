import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { fetchMembers, logAction, type Member } from "./db";

const LOCAL_AUTH_SESSION_KEY = "wish-jar-private-auth-session";
const USER_EMAIL_STORAGE_KEY = "wishjar_user_email";
const USER_NAME_STORAGE_KEY = "wishjar_user_name";
const PRIVATE_ACCESS_MESSAGE = "Đây là không gian riêng tư của Duy Đức và Thu Thuỷ, bạn không có quyền truy cập chiếc lọ này nhé!";
const ALLOWED_EMAILS = [
  "ngduyduc2609@gmail.com",
  "thuthuydanghocbai@gmail.com",
];
const ALLOWED_EMAIL_SET = new Set(ALLOWED_EMAILS.map((email) => email.trim().toLowerCase()));

type LocalAuthSession = {
  userId: string;
  email: string;
  name: string;
};

function normalizeEmail(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isAllowedEmail(email?: string | null) {
  return ALLOWED_EMAIL_SET.has(normalizeEmail(email));
}

function getMemberNameFromEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return normalized === "ngduyduc2609@gmail.com" ? "Duy Đức" : "Thu Thuỷ";
}

function getMemberIdFromEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "guest";
  return normalized.includes("duc") ? "duy-duc" : normalized.includes("thu") || normalized.includes("thuy") ? "thu-thuy" : normalized;
}

function findMemberForEmail(members: Member[], email?: string | null) {
  const normalized = normalizeEmail(email);
  const keyword = normalized === "ngduyduc2609@gmail.com" ? "duy" : "thu";
  return members.find((member) => member.name.toLowerCase().includes(keyword)) ?? null;
}

function readStoredAuthSession(): LocalAuthSession | null {
  if (typeof window === "undefined") return null;

  const storedEmail = window.localStorage.getItem(USER_EMAIL_STORAGE_KEY);
  const storedName = window.localStorage.getItem(USER_NAME_STORAGE_KEY);
  const fallbackRaw = window.localStorage.getItem(LOCAL_AUTH_SESSION_KEY);

  try {
    const raw = storedEmail ? { email: storedEmail, name: storedName ?? getMemberNameFromEmail(storedEmail) } : fallbackRaw ? JSON.parse(fallbackRaw) : null;
    if (!raw || !raw.email) {
      window.localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
      return null;
    }

    const email = normalizeEmail(raw.email);
    if (!isAllowedEmail(email)) {
      window.localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
      return null;
    }

    return {
      userId: getMemberIdFromEmail(email),
      email,
      name: raw.name || getMemberNameFromEmail(email),
    };
  } catch {
    window.localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
    window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    return null;
  }
}

function persistAuthSession(session: LocalAuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
    window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, session.email);
  window.localStorage.setItem(USER_NAME_STORAGE_KEY, session.name);
  window.localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(session));
}

type IdentityValue = {
  members: Member[];
  me: Member | null;
  userId: string | null;
  signedIn: boolean;
  ready: boolean;
  signIn: () => Promise<void>;
  loginAs: (email: string) => Promise<void>;
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
    const sessionEmail = localSession?.email ?? (typeof window !== "undefined" ? window.localStorage.getItem("wishjar_user_email") : null);
    const activeEmail = normalizeEmail(sessionEmail);
    const localUser = activeEmail && isAllowedEmail(activeEmail)
      ? {
          id: getMemberIdFromEmail(activeEmail),
          name: activeEmail.toLowerCase().includes("duc") ? "Duy Đức" : "Thu Thủy",
          emoji: activeEmail.toLowerCase().includes("duc") ? "🧑‍💻" : "💐",
          color: activeEmail.toLowerCase().includes("duc") ? "#f59e0b" : "#f472b6",
          user_id: getMemberIdFromEmail(activeEmail),
        }
      : null;

    const me = userId
      ? members.find((member) => member.id === userId || member.user_id === userId || member.name.toLowerCase().includes(userId.includes("duc") ? "duy" : "thu")) ??
        localUser ??
        null
      : localUser ?? null;

    const setAuthenticatedSession = async (email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!ALLOWED_EMAILS.includes(cleanEmail)) {
        throw new Error(PRIVATE_ACCESS_MESSAGE);
      }

      const nextSession: LocalAuthSession = {
        userId: getMemberIdFromEmail(cleanEmail),
        email: cleanEmail,
        name: cleanEmail.toLowerCase().includes("duc") ? "Duy Đức" : "Thu Thủy",
      };

      setLocalSession(nextSession);
      persistAuthSession(nextSession);
      await queryClient.invalidateQueries();
    };

    return {
      members,
      me,
      userId,
      signedIn: Boolean(userId || activeEmail),
      ready: authReady && isFetched,
      signIn: async () => {
        throw new Error("Vui lòng đăng nhập bằng email được cấp trong danh sách trắng.");
      },
      loginAs: async (email: string) => {
        await setAuthenticatedSession(email);
      },
      signInWithPassword: async (email: string, password: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!password.trim()) {
          throw new Error("Vui lòng nhập mật khẩu.");
        }
        if (!ALLOWED_EMAILS.includes(cleanEmail)) {
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }
        await setAuthenticatedSession(cleanEmail);
      },
      signUpWithPassword: async (email: string, password: string) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!password.trim()) {
          throw new Error("Vui lòng nhập mật khẩu.");
        }
        if (!ALLOWED_EMAILS.includes(cleanEmail)) {
          throw new Error(PRIVATE_ACCESS_MESSAGE);
        }
        await setAuthenticatedSession(cleanEmail);
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
