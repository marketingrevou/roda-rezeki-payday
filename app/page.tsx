"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadySpun, setAlreadySpun] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setAlreadySpun(null);

    const trimmed = email.trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Terjadi kesalahan. Coba lagi.");
        return;
      }
      if (data.exists) {
        setAlreadySpun(data.result);
        return;
      }

      sessionStorage.setItem("rr_email", trimmed);
      router.push("/spin");
    } catch {
      setError("Tidak dapat terhubung. Periksa koneksimu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-start pt-12 sm:justify-center sm:pt-0 px-6 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1e3a8a 0%, #2563eb 100%)" }}
    >
{/* ── Main content ── */}
      <div className="relative w-full max-w-sm flex flex-col items-center" style={{ zIndex: 10 }}>

        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/revoulogo.png"
            alt="RevoU"
            width={80}
            height={80}
            className="object-contain"
            style={{ opacity: 0.95 }}
          />
        </div>

        {/* Headline block */}
        <div className="text-center mb-10">

          {/* Title */}
          <h1
            className="font-pacifico leading-tight mb-3"
            style={{
              fontSize: "clamp(34px, 10vw, 54px)",
              color: "#ffffff",
              textShadow:
                "0 0 30px rgba(99, 150, 255, 0.4), 0 2px 8px rgba(0,0,0,0.5)",
              letterSpacing: "0.01em",
            }}
          >
            Roda Rezeki
          </h1>

        </div>

        {/* Form / Already spun */}
        {!alreadySpun ? (
          <form onSubmit={handleSubmit} className="w-full space-y-3 sm:bg-black/25 sm:backdrop-blur-sm sm:rounded-2xl sm:p-6 sm:border sm:border-white/10">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Masukkan email kamu"
              className="w-full px-5 py-3.5 rounded-xl text-white text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(99,150,255,0.35)",
                caretColor: "#93c5fd",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(99,150,255,0.7)";
                e.target.style.background = "rgba(255,255,255,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(99,150,255,0.35)";
                e.target.style.background = "rgba(255,255,255,0.1)";
              }}
              disabled={loading}
              autoComplete="email"
            />

            {error && (
              <p className="text-xs text-red-400 px-1">⚠ {error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #60a5fa, #2563eb)",
                color: "#ffffff",
                letterSpacing: "0.06em",
                boxShadow:
                  loading || !email ? "none" : "0 4px 28px rgba(37,99,235,0.45)",
              }}
            >
              {loading ? "Mengecek..." : "Putar Roda"}
            </button>
          </form>
        ) : (
          <div
            className="w-full rounded-xl p-5 text-center"
            style={{
              background: "rgba(99,150,255,0.1)",
              border: "1px solid rgba(99,150,255,0.35)",
            }}
          >
            <p className="text-xs text-blue-200 mb-2">
              Email ini sudah pernah putar roda.
            </p>
            <p className="text-lg font-bold mb-3" style={{ color: "#93c5fd" }}>
              {alreadySpun}
            </p>
            <p className="text-xs text-blue-300 mb-4">
              Hubungi tim RevoU untuk menggunakan bonusmu.
            </p>
            <button
              onClick={() => { setAlreadySpun(null); setEmail(""); }}
              className="text-xs text-blue-300 hover:text-white transition-colors underline"
            >
              Coba email lain
            </button>
          </div>
        )}

        <p
          className="mt-8 text-center"
          style={{ fontSize: "11px", color: "rgba(148,163,184,0.4)" }}
        >
          Setiap email hanya bisa putar 1 kali · S&K berlaku
        </p>
      </div>

    </main>
  );
}
