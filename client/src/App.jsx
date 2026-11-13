// Root application component and signed-in session routing.
import Login from "./pages/login.jsx";
import Dashboard from "./pages/dashboard.jsx";
import { useMeQuery } from "./features/api/apiSlice";
import { ResetPasswordPage, VerifyEmailPage } from "./pages/account.jsx";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { apiSlice } from "./features/api/apiSlice";

function App() {
  const [loggedOut, setLoggedOut] = useState(false);
  const dispatch = useDispatch();
  const { data, isLoading, refetch } = useMeQuery();
  const handleLogout = () => {
    setLoggedOut(true);
    dispatch(apiSlice.util.resetApiState());
    window.history.replaceState({ smartLearnLoggedOut: true }, "", window.location.pathname);
  };
  const handleLogin = () => {
    setLoggedOut(false);
    refetch();
  };
  if (window.location.pathname === "/reset-password") return <ResetPasswordPage />;
  if (window.location.pathname === "/verify-email") return <VerifyEmailPage />;
  if (loggedOut) return <Login onLogin={handleLogin} />;
  if (isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">Loading SmartLearn…</div>;
  if (data?.user) return <Dashboard user={data.user} onLogout={handleLogout} />;
  return <Login onLogin={handleLogin} />;
}

export default App;
