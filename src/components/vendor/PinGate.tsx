"use client";

import React, { useState, useRef, useEffect } from "react";

interface PinGateProps {
  /** Le PIN à vérifier (stocké dans les métadonnées vendeur / Supabase) */
  correctPin?: string;
  onSuccess: () => void;
  shopName?: string;
  vendorName?: string;
}

const DEFAULT_PIN = "1234"; // À remplacer par le vrai PIN stocké en base

export function PinGate({
  correctPin = DEFAULT_PIN,
  onSuccess,
  shopName,
  vendorName,
}: PinGateProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for lockout
  useEffect(() => {
    if (!locked) return;
    setLockTimer(30);
    const interval = setInterval(() => {
      setLockTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocked(false);
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    // Auto-advance
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (newPin.every((d) => d !== "") && newPin.join("").length === 4) {
      checkPin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === correctPin) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      setError(true);
      setPin(["", "", "", ""]);
      setTimeout(() => {
        setShaking(false);
        inputs.current[0]?.focus();
      }, 600);

      if (newAttempts >= 3) {
        setLocked(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div
        className={`w-full max-w-sm bg-surface border border-outline-variant rounded-2xl shadow-xl p-8 text-center space-y-6 ${
          shaking ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">
              lock
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-on-surface">
            {shopName ? `Espace Vendeur` : "Accès sécurisé"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {vendorName && (
              <span className="font-semibold text-secondary">{vendorName} · </span>
            )}
            {shopName && <span>{shopName}</span>}
          </p>
          <p className="text-xs text-on-surface-variant mt-2">
            Saisissez votre code d&apos;accès à 4 chiffres pour accéder à votre
            tableau de bord.
          </p>
        </div>

        {/* PIN inputs */}
        <div className="flex items-center justify-center gap-3">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={locked}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-surface-container focus:outline-none transition-all ${
                error
                  ? "border-error bg-error/5 text-error"
                  : digit
                  ? "border-secondary bg-secondary/5 text-secondary"
                  : "border-outline-variant text-on-surface focus:border-secondary"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`Chiffre ${i + 1}`}
            />
          ))}
        </div>

        {/* Error / Locked state */}
        {locked ? (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            <span className="material-symbols-outlined text-base mr-1 align-middle">
              block
            </span>
            Accès bloqué pendant {lockTimer}s après 3 tentatives échouées.
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold">
            <span className="material-symbols-outlined text-base mr-1 align-middle">
              error
            </span>
            Code incorrect. {3 - attempts} tentative(s) restante(s).
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant">
            Ce code est personnel et ne doit jamais être partagé.
          </p>
        )}

        {/* Forgot PIN */}
        <div className="pt-2 border-t border-outline-variant">
          <button className="text-xs text-secondary hover:underline font-semibold">
            Code oublié ? Contacter le support
          </button>
        </div>
      </div>

      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-\\[shake_0\\.5s_ease-in-out\\] {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
