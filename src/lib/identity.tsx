import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { fetchMembers, logAction, type Member } from "./db";

const PRIVATE_ACCESS_MESSAGE = "Đây là không gian riêng tư của Duy Đức và Thu Thuỷ, bạn không có quyền truy cập chiếc lọ này nhé!";
const ALLOWED_EMAILS = new Set(["ngduyduc2609@gmail.com", "thuthuydanghocbai@gmail.com"]);

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
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
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user.id ?? null);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void queryClient.invalidateQueries();
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const { data: members = [], isFetched } = useQuery({
    queryKey: ["members", userId],
    queryFn: fetchMembers,
    enabled: !!userId,
  });

  const value = useMemo<IdentityValue>(() => {
    const me = userId ? members.find((member) => member.user_id === userId) ?? null : null;

    const signInWithPassword = async (email: string, password: string) => {
      const address = cleanEmail(email);
      if (!ALLOWED_EMAILS.has(address)) throw new Error(PRIVATE_ACCESS_MESSAGE);
      if (!password.trim()) throw new Error("Vui lòng nhập mật khẩu.");
      const { error } = await supabase.auth.signInWithPassword({ email: address, password });
      if (error) {
        const message = error.message?.toLowerCase() ?? "";
        if (message.includes("invalid api key") || message.includes("invalid supabase") || message.includes("must be a valid http or https url")) {
          throw new Error("Tài khoản hoặc cấu hình Supabase chưa khớp với project hiện tại. Nếu bạn đã dùng Google trước đó, hãy dùng nút Đăng nhập bằng Google, hoặc kiểm tra lại URL/API key trong Lovable.");
        }
        if (message.includes("invalid login credentials") || message.includes("email not confirmed") || message.includes("user not found")) {
          throw new Error("Email hoặc mật khẩu chưa đúng. Nếu bạn từng đăng nhập bằng Google với email này, hãy dùng nút Đăng nhập bằng Google hoặc tạo lại mật khẩu.");
        }
        throw new Error("Email hoặc mật khẩu chưa đúng. Nếu bạn từng đăng nhập bằng Google, hãy thử nút Google trước.");
      }
    };

    return {
      members,
      me,
      userId,
      signedIn: !!userId,
      ready: authReady && (!userId || isFetched),
      signIn: async () => {
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (result.error) throw result.error;
      },
      loginAs: async () => undefined,
      signInWithPassword,
      signUpWithPassword: async (email: string, password: string) => {
        const address = cleanEmail(email);
        if (!ALLOWED_EMAILS.has(address)) throw new Error(PRIVATE_ACCESS_MESSAGE);
        if (password.trim().length < 6) throw new Error("Mật khẩu cần ít nhất 6 ký tự.");
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw new Error(error.message);
        if (!data.session) throw new Error("Kiểm tra email để xác nhận tài khoản rồi đăng nhập nhé.");
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        await supabase.auth.signOut();
        queryClient.clear();
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
  }, [authReady, isFetched, members, queryClient, userId]);

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
