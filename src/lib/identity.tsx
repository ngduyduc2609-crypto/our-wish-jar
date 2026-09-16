import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMembers, logAction, type Member } from "./db";

const STORAGE_KEY = "wishjar-identity";

type IdentityValue = {
  members: Member[];
  me: Member | null;
  setMe: (id: string) => void;
  ready: boolean;
  track: (action: string, subject?: string | null) => void;
};

const IdentityContext = createContext<IdentityValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  useEffect(() => {
    setMemberId(localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  const value = useMemo<IdentityValue>(() => {
    const me = members.find((m) => m.id === memberId) ?? null;
    return {
      members,
      me,
      ready: ready && members.length > 0,
      setMe: (id: string) => {
        localStorage.setItem(STORAGE_KEY, id);
        setMemberId(id);
      },
      track: (action: string, subject?: string | null) => {
        if (!me) return;
        void logAction(me.id, action, subject ?? null);
      },
    };
  }, [members, memberId, ready]);

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
