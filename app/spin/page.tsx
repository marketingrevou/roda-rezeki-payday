"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import ResultDisplay from "@/components/ResultDisplay";

const Wheel = dynamic(() => import("@/components/Wheel"), { ssr: false });

const BG_STYLE = { background: "linear-gradient(160deg, #1e3a8a 0%, #2563eb 100%)" };

export default function SpinPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [freeSpin, setFreeSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState("");
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("rr_email");
    if (!stored) {
      router.replace("/");
      return;
    }
    setEmail(stored);
  }, [router]);

  const handleSpinComplete = useCallback(() => {
    setSpinning(false);
    setShowResult(true);
  }, []);

  async function handleSpin() {
    if (!email || freeSpin || spinning || hasSpun) return;
    setError("");
    setHasSpun(true);

    // Start wheel spinning immediately — Phase 1
    setFreeSpin(true);

    try {
      const res = await fetch("/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setFreeSpin(false);
        setResult(data.result);
        setError("Email ini sudah pernah putar roda.");
        return;
      }

      if (!res.ok) {
        setFreeSpin(false);
        setHasSpun(false);
        setError("Terjadi kesalahan. Coba lagi.");
        return;
      }

      // Stop free spin, trigger landing — Phase 2
      setFreeSpin(false);
      setResult(data.result);
      setTargetIndex(data.segmentIndex);
      setSpinning(true);
    } catch {
      setFreeSpin(false);
      setHasSpun(false);
      setError("Tidak dapat terhubung. Periksa koneksimu.");
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG_STYLE}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
      style={BG_STYLE}
    >
{/* ── Main content ── */}
      <div className="relative w-full max-w-lg flex flex-col items-center gap-5" style={{ zIndex: 10 }}>

        {/* Logo */}
        <Image
          src="/revoulogo.png"
          alt="RevoU"
          width={80}
          height={80}
          className="object-contain"
          style={{ opacity: 0.95 }}
        />

        {/* Header */}
        <div className="text-center">
          <h1
            className="font-pacifico leading-tight mb-1"
            style={{
              fontSize: "clamp(28px, 7vw, 42px)",
              color: "#ffffff",
              textShadow: "0 0 30px rgba(99,150,255,0.4), 0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Roda Rezeki
          </h1>
          <p className="text-blue-200 text-sm">
            Selamat datang,{" "}
            <span className="text-white font-semibold">{email}</span>!
          </p>
        </div>

        {/* Wheel */}
        <div
          className="relative p-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(99,150,255,0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <Wheel
            targetIndex={targetIndex}
            spinning={spinning}
            freeSpin={freeSpin}
            onSpinComplete={handleSpinComplete}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="w-full rounded-xl px-4 py-3 text-center text-sm"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#fca5a5",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Spin button */}
        {!hasSpun && (
          <button
            onClick={handleSpin}
            className="px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 glow-border"
            style={{
              background: "linear-gradient(135deg, #60a5fa, #2563eb)",
              color: "#ffffff",
              boxShadow: "0 4px 28px rgba(37,99,235,0.5)",
              minWidth: "200px",
              letterSpacing: "0.05em",
            }}
          >
            Putar!
          </button>
        )}

        {/* Hint */}
        {!hasSpun && (
          <p className="text-xs text-blue-300 text-center">
            Kamu hanya bisa memutar roda <strong className="text-white">1 kali</strong>.
          </p>
        )}

        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-400 hover:text-blue-200 transition-colors underline"
        >
          ← Kembali ke beranda
        </button>
      </div>

      {/* Result overlay */}
      {showResult && result && email && (
        <ResultDisplay
          result={result}
          email={email}
          onClose={() => {
            sessionStorage.removeItem("rr_email");
            router.push("/");
          }}
        />
      )}

    </main>
  );
}
