// UI-only mock auth: always returns a fake signed-in user.
export function useAuth() {
  const user = {
    id: "demo-user",
    email: "demo@lastminute.app",
    user_metadata: { full_name: "Alex Rivera", avatar_url: null },
  } as const;
  return { session: { user } as any, user: user as any, loading: false };
}
