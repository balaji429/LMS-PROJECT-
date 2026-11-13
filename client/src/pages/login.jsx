// Login page and public account access form.
import { useState } from "react";
import learningImage from "../learning.jpg";
import { GraduationCap } from "lucide-react";
import {
  useForgotPasswordMutation,
  useLoginMutation,
  useRegisterMutation,
} from "../features/api/apiSlice";
import ThemeToggle from "../components/ThemeToggle";

function Login({ onLogin }) {

  // Initialize login and register API mutations
  const [loginUser, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [requestReset, { isLoading: isResetLoading }] = useForgotPasswordMutation();

  // Login form data
  const [loginInput, setLoginInput] = useState({
    email: "",
    password: ""
  });

  // Signup form data
  const [signupInput, setSignupInput] = useState({
    name: "",
    email: "",
    password: ""
  });

  // Tab switching
  const [activeTab, setActiveTab] = useState("login");

  // Password show/hide
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetResult, setResetResult] = useState(null);
  const [resetError, setResetError] = useState("");

  // Form messages
  const [formMessage, setFormMessage] = useState({
    text: "",
    type: "error"
  });

  // Common input handler
  const changeInputHandler = (e, type) => {

    const { name, value } = e.target;

    if (type === "signup") {

      setSignupInput({
        ...signupInput,
        [name]: value
      });

    } else {

      setLoginInput({
        ...loginInput,
        [name]: value
      });

    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();

    setFormMessage({ text: "", type: "error" });

    try {
      const data = await loginUser(loginInput).unwrap();
      onLogin?.();

      setFormMessage({
        text: data.message || "Login successful.",
        type: "success"
      });

    } catch (error) {
      setFormMessage({
        text: error?.data?.message || "Unable to connect to the server.",
        type: "error"
      });
    }
  };

  // Handle user registration
  const handleSignup = async (e) => {
    e.preventDefault();

    setFormMessage({ text: "", type: "error" });

    try {
      await registerUser(signupInput).unwrap();

      setLoginInput({
        email: signupInput.email.trim(),
        password: ""
      });

      setSignupInput({
        name: "",
        email: "",
        password: ""
      });

      setActiveTab("login");

      setFormMessage({
        text: "Account created successfully. Please log in.",
        type: "success"
      });

    } catch (error) {
      setFormMessage({
        text: error?.data?.message || "Unable to connect to the server.",
        type: "error"
      });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetResult(null);
    setResetError("");
    try { setResetResult(await requestReset({ email: forgotEmail }).unwrap()); }
    catch (error) { setResetError(error?.data?.message || "Could not request a password reset."); }
  };

  const isLogin = activeTab === "login";

  return (

    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6">
      <ThemeToggle className="fixed right-4 top-4 z-30"/>

      <div className="mb-5 flex w-full max-w-5xl items-center gap-3 px-1 sm:mb-6">
        <span className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/15"><GraduationCap size={25}/></span>
        <span className="text-2xl font-extrabold tracking-tight text-foreground">SmartLearn</span>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl md:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="p-8 md:p-12">

          {/* TABS */}

          <div className="flex gap-6 border-b mb-8">

            <button
              onClick={() => {
                setActiveTab("login");
                setShowPassword(false);
                setFormMessage({ text: "", type: "error" });
              }}
              className={`pb-3 font-semibold ${isLogin
                ? "border-b-2 border-black text-black"
                : "text-gray-400"
                }`}
            >
              Login
            </button>

            <button
              onClick={() => {
                setActiveTab("signup");
                setShowPassword(false);
                setFormMessage({ text: "", type: "error" });
              }}
              className={`pb-3 font-semibold ${!isLogin
                ? "border-b-2 border-black text-black"
                : "text-gray-400"
                }`}
            >
              Sign Up
            </button>

          </div>

          {/* LOGIN FORM */}

          {isLogin ? (

            <div>

              <h1 className="text-3xl font-bold mb-2">
                Welcome Back!
              </h1>

              <p className="text-gray-500 mb-8">
                Login to your account to continue.
              </p>

              {formMessage.text && (
                <p
                  role="status"
                  className={`mb-4 text-sm ${formMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                >
                  {formMessage.text}
                </p>
              )}

              <form onSubmit={handleLogin} className="space-y-5">

                {/* EMAIL */}

                <div>

                  <label className="block mb-2 font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={loginInput.email}
                    onChange={(e) => changeInputHandler(e, "login")}
                    placeholder="Enter your email"
                    required
                    className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block mb-2 font-medium">
                    Password
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginInput.password}
                      onChange={(e) => changeInputHandler(e, "login")}
                      placeholder="Enter your password"
                      required
                      className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-black"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-sm text-gray-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoginLoading ? "Logging in..." : "Login"}
                </button>

              </form>

              <details className="mt-5 rounded-xl border border-gray-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-indigo-700">Forgot your password?</summary>
                <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">Account email<input required type="email" value={forgotEmail || loginInput.email} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-lg border p-3"/></label>
                  {resetResult && <p role="status" className="text-sm text-green-700">{resetResult.message}{resetResult.resetUrl && <> <a className="font-semibold underline" href={resetResult.resetUrl}>Open reset page</a></>}</p>}
                  {resetError && <p role="alert" className="text-sm text-red-600">{resetError}</p>}
                  <button disabled={isResetLoading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{isResetLoading ? "Sending..." : "Send reset instructions"}</button>
                </form>
              </details>

            </div>

          ) : (

            /* SIGNUP FORM */

            <div>

              <h1 className="text-3xl font-bold mb-2">
                Create Account
              </h1>

              <p className="text-gray-500 mb-8">
                Sign up to get started with us.
              </p>

              {formMessage.text && (
                <p
                  role="status"
                  className={`mb-4 text-sm ${formMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                >
                  {formMessage.text}
                </p>
              )}

              <form onSubmit={handleSignup} className="space-y-5">

                {/* NAME */}

                <div>

                  <label className="block mb-2 font-medium">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={signupInput.name}
                    onChange={(e) => changeInputHandler(e, "signup")}
                    placeholder="Enter your name"
                    required
                    className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block mb-2 font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={signupInput.email}
                    onChange={(e) => changeInputHandler(e, "signup")}
                    placeholder="Enter your email"
                    required
                    className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block mb-2 font-medium">
                    Password
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signupInput.password}
                      onChange={(e) => changeInputHandler(e, "signup")}
                      placeholder="Create a password"
                      required
                      className="w-full border rounded-lg p-3 pr-16 outline-none focus:ring-2 focus:ring-black"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-sm text-gray-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRegisterLoading ? "Creating account..." : "Create Account"}
                </button>

              </form>

            </div>

          )}

        </div>

        {/* RIGHT SIDE IMAGE */}

        <div className="relative hidden min-h-[620px] overflow-hidden md:block">

          <img
            src={learningImage}
            alt="Learning"
            className="absolute inset-0 size-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-black/40 flex items-end p-10">

            <div className="text-white">

              <h2 className="text-3xl font-bold mb-3">
                Welcome to Our Learning Platform
              </h2>

              <p className="text-white/85">
                Learn new skills, expand your knowledge, and grow every day with us.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Login;
