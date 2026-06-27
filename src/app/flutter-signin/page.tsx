"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Chrome, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function FlutterSignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/api/auth/flutter-callback";
  const [status, setStatus] = useState<"redirecting" | "success" | "error">("redirecting");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setStatus("redirecting");
    signIn("google", { callbackUrl })
      .then((result) => {
        if (result?.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(result?.error || "Google sign-in failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Connection error");
      });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center">
            {/* Logo / Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30"
            >
              <Chrome className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              فذلكة
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-sm mb-8"
            >
              {status === "redirecting" && "جاري تسجيل الدخول بحساب Google..."}
              {status === "success" && "تم تسجيل الدخول بنجاح!"}
              {status === "error" && "فشل تسجيل الدخول"}
            </motion.p>

            {/* Status animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-6"
            >
              {status === "redirecting" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-indigo-400" />
                </motion.div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </motion.div>
              )}
            </motion.div>

            {status === "redirecting" && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6"
              />
            )}

            {status === "error" && errorMsg && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs mb-4"
              >
                {errorMsg}
              </motion.p>
            )}

            {status === "error" && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setStatus("redirecting"); signIn("google", { callbackUrl }); }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/30"
              >
                إعادة المحاولة
              </motion.button>
            )}

            {status === "success" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-500 text-xs"
              >
                سيتم إعادة توجيهك إلى التطبيق...
              </motion.p>
            )}
          </div>

          {/* App info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-white/10 text-center"
          >
            <p className="text-gray-600 text-xs">
              تطبيق فذلكة — منصة تعليمية رائدة
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
