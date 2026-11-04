// dHdCZy3znPFQHJco
import { useState } from "react";
import learningImage from "../learning.jpg";

function Login() {

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


  // Login submit
  const handleLogin = (e) => {
    e.preventDefault();

    console.log("Login Data:", loginInput);
  };


  // Signup submit
  const handleSignup = (e) => {
    e.preventDefault();

    console.log("Signup Data:", signupInput);
  };


  const isLogin = activeTab === "login";


  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="p-8 md:p-12">

          {/* TABS */}

          <div className="flex gap-6 border-b mb-8">

            <button
              onClick={() => {
                setActiveTab("login");
                setShowPassword(false);
              }}
              className={`pb-3 font-semibold ${
                isLogin
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
              }}
              className={`pb-3 font-semibold ${
                !isLogin
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


                <div className="text-right">

                  <button
                    type="button"
                    className="text-sm text-blue-600"
                  >
                    Forgot Password?
                  </button>

                </div>


                <button
                  type="submit"
                  className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800"
                >
                  Login
                </button>

              </form>

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
                  className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800"
                >
                  Create Account
                </button>

              </form>

            </div>

          )}

        </div>


        {/* RIGHT SIDE IMAGE */}

        <div className="hidden md:block relative">

          <img
            src={learningImage}
            alt="Learning"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/40 flex items-end p-10">

            <div className="text-white">

              <h2 className="text-3xl font-bold mb-3">
                Welcome to Our Learning Platform
              </h2>

              <p className="text-gray-200">
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