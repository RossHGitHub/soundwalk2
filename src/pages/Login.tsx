import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Seo from "../components/Seo";

function getSafeRedirect(rawRedirect: string | null) {
    if (!rawRedirect || !rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) {
        return '/admin';
    }

    return rawRedirect;
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = localStorage.getItem("auth-token");
        if (!token) return;
        const controller = new AbortController();
        fetch("/api/auth", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
            .then((res) => {
                if (res.ok) navigate(getSafeRedirect(searchParams.get("redirect")), { replace: true });
                else if (res.status === 401) localStorage.removeItem("auth-token");
            }).catch(() => {});
        return () => controller.abort();
    }, [navigate, searchParams]);

    const handleLogin = async () => {
        if (pending) return;
        setPending(true);
        setError('');
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: username, password }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                setError(error || 'Login failed');
                return;
            }

            const { token } = await res.json();
            localStorage.setItem('auth-token', token);
            navigate(getSafeRedirect(searchParams.get('redirect')), { replace: true });
        } catch {
            setError('Something went wrong');
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <Seo
                title="Admin Login | Soundwalk"
                description="Secure login for the Soundwalk admin area."
                path="/login"
                robots="noindex,nofollow"
            />
            <div className="flex flex-col items-center text-black justify-center h-screen bg-gray-100">
                <form onSubmit={(event) => { event.preventDefault(); void handleLogin(); }} className="bg-white p-6 rounded-lg shadow-lg w-80">
                    <h2 className="text-xl font-bold mb-4 text-center">Admin Login</h2>
                    {error && <p className="text-red-500 mb-2">{error}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        aria-label="Username"
                        autoComplete="username"
                        name="username"
                        required
                        className="border p-2 w-full mb-3 rounded"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        aria-label="Password"
                        autoComplete="current-password"
                        name="password"
                        required
                        className="border p-2 w-full mb-4 rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        {pending ? "Signing in…" : "Login"}
                    </button>
                </form>
            </div>
        </>
    );
}
