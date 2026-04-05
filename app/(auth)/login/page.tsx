"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";
import { setCredentials, type AuthUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MAKER", "CHECKER", "ADMIN", "IT_ADMIN"], {
    message: "Please select a valid role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Something went wrong";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
};

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "MAKER",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: LoginFormValues) => {
    const loadingToast = toast.loading("Verifying credentials...");
    try {
      const response = await api.post("/users/login", data);

      const body = response.data as unknown;
      const payload = (body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body) as unknown;
      const user =
        (payload as { user?: AuthUser; returnUser?: AuthUser }).user ??
        (payload as { user?: AuthUser; returnUser?: AuthUser }).returnUser;
      const accessToken = (payload as { accessToken?: string }).accessToken;

      if (!user || !accessToken) {
        throw new Error("Unexpected login response from server");
      }

      dispatch(
        setCredentials({
          user,
          token: accessToken,
        })
      );

      toast.success("Welcome back! 👋", {
        id: loadingToast,
        duration: 2000,
      });

      const normalizedRole = String(user.role || "").toUpperCase();
      if (normalizedRole === "CHECKER") {
        router.push("/dashboard/checker/queue");
      } else if (["ADMIN", "IT_ADMIN"].includes(normalizedRole)) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const roleDescriptions: Record<string, string> = {
    MAKER: "Create and edit policies",
    CHECKER: "Review and approve policies",
    ADMIN: "Manage platform and workflows",
    IT_ADMIN: "System administration",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Decorations */}
      <div className="absolute top-20 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Gradient */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />

          <div className="p-8 sm:p-10 space-y-8">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                  <Shield size={28} className="text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Policy Manager
              </h1>
              <p className="text-slate-600">
                Enterprise policy governance platform
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className={`pl-10 h-11 text-sm ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-indigo-500"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 h-11 text-sm ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-indigo-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">
                  Login As
                </label>
                <Select
                  defaultValue="MAKER"
                  onValueChange={(value) => setValue("role", value as any)}
                >
                  <SelectTrigger className={`h-11 text-sm ${
                    errors.role
                      ? "border-red-500 focus:ring-red-500"
                      : "focus:ring-indigo-500"
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAKER">
                      <span className="flex items-center gap-2">
                        Maker (Editor)
                      </span>
                    </SelectItem>
                    <SelectItem value="CHECKER">Checker (Reviewer)</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="IT_ADMIN">IT Admin</SelectItem>
                  </SelectContent>
                </Select>
                {roleDescriptions[selectedRole] && (
                  <p className="text-xs text-slate-500 italic">
                    {roleDescriptions[selectedRole]}
                  </p>
                )}
                {errors.role && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  New to platform?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>            
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2024 Policy Manager. All rights reserved.
        </p>
      </div>
    </div>
  );
}
