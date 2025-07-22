import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getBaseUrl } from "@/lib/apiBase";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao logar");

      if (data.mustChangePassword) {
        setMustChangePassword(true);
        localStorage.setItem("temp-token", data.token);
        return;
      }

      login(data.token);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${getBaseUrl()}/api/auth/change-password-first-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("temp-token")}`,
          },
          body: JSON.stringify({ user, newPassword }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao trocar senha");

      alert("Senha alterada com sucesso! Faça login novamente.");
      localStorage.removeItem("temp-token");
      setMustChangePassword(false);
      setPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mustChangePassword ? "Altere sua Senha" : "Login"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={mustChangePassword ? handleChangePassword : handleLogin}
            className="space-y-4"
          >
            <Input
              type="text"
              placeholder="Usuário"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={mustChangePassword}
            />

            <Input
              type="password"
              placeholder={mustChangePassword ? "Nova senha" : "Senha"}
              value={mustChangePassword ? newPassword : password}
              onChange={(e) =>
                mustChangePassword
                  ? setNewPassword(e.target.value)
                  : setPassword(e.target.value)
              }
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full">
              {mustChangePassword ? "Salvar Senha" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
