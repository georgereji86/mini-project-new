"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Trigger welcome message animation
        const timer = setTimeout(() => setShowWelcome(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (email === "admin" && password === "password") {
            router.push("/dashboard"); // Redirect to dashboard
        } else {
            setError("Invalid credentials");
        }
    };

    return (
        <div className="login-container">
            {/* Ensure the welcome message is rendered */}
            <div className={`welcome-message ${showWelcome ? "fade-in" : ""}`}>
                <h1>Welcome to Churn Prediction</h1>
            </div>
            <div className="login-box">
                <h2>Login</h2>
                
                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        required
                    />
                    <button type="submit" className="login-btn">
                        Login
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm">Forgot your password? <a href="#">Reset it here</a></p>
                </div>
            </div>
        </div>
    );
}
