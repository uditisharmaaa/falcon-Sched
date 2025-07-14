// src/Login.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-200 to-white">
      <form onSubmit={handleAuth} className="bg-white shadow-xl rounded-lg p-8 w-96 border border-purple-200">
        <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">
          {isSignUp ? "Create an Account" : "Welcome Back"}
        </h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-4">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-purple-700 text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-purple-700 text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          {isSignUp ? "Sign Up" : "Log In"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-700">
          {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
          <span
            className="text-purple-600 font-semibold cursor-pointer hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
        </p>
      </form>
    </div>
  );
}
