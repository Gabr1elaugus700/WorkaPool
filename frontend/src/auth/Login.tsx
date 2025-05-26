import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL;

export default function Login() {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao logar");
            }

            const { token } = await res.json();
            localStorage.setItem("token", token);
            navigate("/"); // ou a rota protegida que quiser
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
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
                <h2 className="text-xl font-bold flex justify-center">Login</h2>
                <input
                    type="text"
                    placeholder="Usuário"
                    className="w-full px-3 py-2 border rounded"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    className="w-full px-3 py-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">
                    Entrar
                </button>
            </form>
        </div>
    );
}
