import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { api, getToken, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getToken()) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

type VerifyResponse = {
  accessToken?: string;
  token?: string;
  access_token?: string;
  user?: { role?: string };
};

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/utilisateurs/login-otp", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      toast.success("Code OTP envoyé à votre adresse e-mail");
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<VerifyResponse>("/utilisateurs/verify-otp", {
        method: "POST",
        auth: false,
        body: { email, otp },
      });
      const token = data.accessToken || data.token || data.access_token;
      if (!token) throw new Error("Aucun jeton reçu");
      if (data.user?.role && data.user.role !== "ADMIN") {
        throw new Error("Accès administrateur requis");
      }
      setToken(token);
      toast.success("Connecté");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion Administrateur</CardTitle>
          <CardDescription>
            {step === "credentials"
              ? "Connectez-vous pour accéder au tableau de bord"
              : `Saisissez le code OTP envoyé à ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi du code OTP..." : "Continuer"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Code OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Vérification..." : "Vérifier et se connecter"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setOtp("");
                }}
                disabled={loading}
              >
                Retour
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
