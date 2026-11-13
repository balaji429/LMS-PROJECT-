// Account recovery and email verification pages.
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, GraduationCap, KeyRound } from "lucide-react";
import { useResetPasswordMutation, useVerifyEmailMutation } from "../features/api/apiSlice";
import ThemeToggle from "../components/ThemeToggle";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const button = "w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50";

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try { const result = await resetPassword({ token, password }).unwrap(); setMessage(result.message); }
    catch (requestError) { setError(requestError?.data?.message || "Could not reset your password."); }
  };
  return <AccountFrame title="Choose a new password" text="Set a new password for your SmartLearn account.">
    {!token ? <Message type="error">This password reset link is missing its token.</Message> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">New password<input required minLength="8" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={field + " mt-2"} placeholder="At least 8 characters"/></label>{error && <Message type="error">{error}</Message>}{message && <Message>{message}</Message>}<button disabled={isLoading} className={button}>{isLoading ? "Saving..." : "Reset password"}</button></form>}
    <a href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><ArrowLeft size={15}/> Back to sign in</a>
  </AccountFrame>;
}

export function VerifyEmailPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    verifyEmail({ token }).unwrap().then((result) => setMessage(result.message)).catch((requestError) => setError(requestError?.data?.message || "Could not verify this email."));
  }, [token, verifyEmail]);
  return <AccountFrame title="Verify your email" text="Confirm your address to finish activating your account.">
    {!token && <Message type="error">This verification link is missing its token.</Message>}{isLoading && <p className="text-sm text-slate-500">Checking your verification link...</p>}{message && <Message>{message}</Message>}{error && <Message type="error">{error}</Message>}<a href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><ArrowLeft size={15}/> Back to sign in</a>
  </AccountFrame>;
}

function AccountFrame({ title, text, children }) {
  return <main className="grid min-h-screen place-items-center bg-background p-4"><ThemeToggle className="fixed right-4 top-4"/><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white"><GraduationCap size={24}/></div><h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><div className="mt-6">{children}</div></section></main>;
}

function Message({ children, type = "success" }) {
  const good = type === "success";
  return <div role="status" className={`flex items-start gap-2 rounded-xl p-3 text-sm ${good ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}><span className="mt-0.5">{good ? <CheckCircle2 size={16}/> : <KeyRound size={16}/>}</span><span>{children}</span></div>;
}
