import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_URL;

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
            const res = await fetch(`${API}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, password }),
            });

            const data = await res.json();
            console.log("Resposta do login:", data);

            if (!res.ok) throw new Error(data.error || "Erro ao logar");

            if (data.mustChangePassword) {
                console.log("Usuário precisa trocar a senha:", data);
                setMustChangePassword(true);
                localStorage.setItem("temp-token", data.token); // salvar token temporário
                return;
            }

            login(data.token);
            navigate("/");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erro desconhecido.");
            }
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(`${API}/api/auth/change-password-first-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("temp-token")}`,
                },
                body: JSON.stringify({ user, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao trocar senha");

            alert("Senha alterada com sucesso! Faça login novamente.");
            localStorage.removeItem("temp-token");
            setMustChangePassword(false);
            setPassword("");
            setNewPassword("");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erro desconhecido.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={mustChangePassword ? handleChangePassword : handleLogin}
                className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
            >
                <h2 className="text-xl font-bold flex justify-center">
                    {mustChangePassword ? "Você Precisa Alterar a Senha!" : "Login"}
                </h2>

                <input
                    type="text"
                    placeholder="Usuário"
                    className="w-full px-3 py-2 border rounded"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    disabled={mustChangePassword}
                />

                <input
                    type="password"
                    placeholder={mustChangePassword ? "Nova senha" : "Senha"}
                    className="w-full px-3 py-2 border rounded"
                    value={mustChangePassword ? newPassword : password}
                    onChange={(e) =>
                        mustChangePassword
                            ? setNewPassword(e.target.value)
                            : setPassword(e.target.value)
                    }
                />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
                >
                    {mustChangePassword ? "Salvar Senha" : "Entrar"}
                </button>
            </form>
        </div>
    );
}
