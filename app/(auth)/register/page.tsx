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
  User,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    role: z.enum(["MAKER", "CHECKER"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Registration failed";
  }
  if (error instanceof Error) return error.message;
  return "Registration failed";
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "MAKER" },
    mode: "onChange",
  });

  const password = watch("password");
  const email = watch("email");
  const selectedRole = watch("role");

  const passwordStrength = {
    hasLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password || ""),
    hasNumber: /[0-9]/.test(password || ""),
  };

  const allRequirementsMet = Object.values(passwordStrength).every(Boolean);

  const onSubmit = async (data: SignupFormValues) => {
    const loadingToast = toast.loading("Creating your account...");
    try {
      const submitData = {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      };

      await api.post("/users/signup", submitData);

      toast.success("Account created! Please login.", { id: loadingToast });
      router.push("/login");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: loadingToast });
    }
  };

  const roleDescriptions: Record<string, string> = {
    MAKER: "Create and edit policies",
    CHECKER: "Review and approve policies",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
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
                Join Policy Manager
              </h1>
              <p className="text-slate-600 text-sm">
                Create your account to get started
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div
                className={`h-1 flex-1 rounded-full transition-all ${
                  step >= 1 ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full transition-all ${
                  step >= 2 ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {step === 1 ? (
                <>
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        {...register("name")}
                        placeholder="John Doe"
                        className="pl-10 h-11 text-sm focus:ring-indigo-500"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

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

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Role
                    </label>
                    <Select
                      defaultValue="MAKER"
                      onValueChange={(value) => setValue("role", value as any)}
                    >
                      <SelectTrigger className="h-11 text-sm focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAKER">Maker (Editor)</SelectItem>
                        <SelectItem value="CHECKER">
                          Checker (Reviewer)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {roleDescriptions[selectedRole] && (
                      <p className="text-xs text-slate-500 italic">
                        {roleDescriptions[selectedRole]}
                      </p>
                    )}
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                  >
                    Continue
                    <ArrowRight size={18} />
                  </Button>
                </>
              ) : (
                <>
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
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password Requirements */}
                    <div className="space-y-2 mt-3 bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={14}
                          className={`${
                            passwordStrength.hasLength
                              ? "text-emerald-600"
                              : "text-slate-300"
                          }`}
                        />
                        <span className="text-xs text-slate-600">
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={14}
                          className={`${
                            passwordStrength.hasUppercase
                              ? "text-emerald-600"
                              : "text-slate-300"
                          }`}
                        />
                        <span className="text-xs text-slate-600">
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={14}
                          className={`${
                            passwordStrength.hasNumber
                              ? "text-emerald-600"
                              : "text-slate-300"
                          }`}
                        />
                        <span className="text-xs text-slate-600">
                          One number
                        </span>
                      </div>
                    </div>

                    {errors.password && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        {...register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 h-11 text-sm ${
                          errors.confirmPassword
                            ? "border-red-500 focus:ring-red-500"
                            : "focus:ring-indigo-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 h-11 rounded-lg"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !allRequirementsMet}
                      className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight size={18} />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {/* Divider */}
            {step === 1 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">
                      Already registered?
                    </span>
                  </div>
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-slate-600 text-sm">
                    Have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
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
