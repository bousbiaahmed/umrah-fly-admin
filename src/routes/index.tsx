import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

type LoginResp = { message?: string };
type VerifyResp = {
  token?: string;
  accessToken?: string;
  utilisateur?: { role?: string };
  user?: { role?: string };
  role?: string;
};

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.role ?? null;
  } catch {
    return null;
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, ready, login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/dashboard" });
  }, [ready, isAuthenticated, navigate]);

  const submitCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await api<LoginResp>("/utilisateurs/login-otp", {
        method: "POST",
        auth: false,
        body: { email, password, mot_de_passe: password },
      });
      toast.success("OTP sent. Check your email.");
      setStep(2);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!otp) errs.otp = "OTP is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const data = await api<VerifyResp>("/utilisateurs/verify-otp", {
        method: "POST",
        auth: false,
        body: { email, otp },
      });
      const authToken = data.accessToken ?? data.token;
      if (!authToken) throw new ApiError("No token returned", 500, data);

      const role =
        data.utilisateur?.role ?? data.user?.role ?? data.role ?? decodeJwtRole(authToken);

      if (role && role.toUpperCase() !== "ADMIN") {
        toast.error("Access denied — admins only.");
        return;
      }

      login(authToken);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-[oklch(0.25_0.05_150)] p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl p-8 border border-border">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gold flex items-center justify-center text-gold-foreground text-2xl font-bold mb-3">
            U
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Umrah Fly Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 ? "Sign in to your account" : "Enter the OTP sent to your email"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={submitCreds} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className={`pl-9 ${errors.password ? "border-destructive" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp">One-time code</Label>
              <div className="relative mt-1.5">
                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  className={`pl-9 tracking-widest ${errors.otp ? "border-destructive" : ""}`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
              {errors.otp && <p className="text-xs text-destructive mt-1">{errors.otp}</p>}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify & sign in
            </Button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
