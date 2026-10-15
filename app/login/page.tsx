import { redirect } from "next/navigation";
import { passwordEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (!passwordEnabled()) redirect("/");
  const { error, next } = await searchParams;
  const title = process.env.DASHBOARD_TITLE || "KPI Dashboard";

  return (
    <main className="login">
      <form className="login-card" method="POST" action="/api/login">
        <h1>{title}</h1>
        <p className="login-hint">Enter the dashboard password to continue.</p>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" autoFocus required />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {error ? <p className="login-error">That password didn&apos;t match. Try again.</p> : null}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
