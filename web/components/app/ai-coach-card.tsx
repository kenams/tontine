"use client";

import { BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";

export function AiCoachCard() {
  const [advice, setAdvice] = useState("Analyse de votre comportement financier...");

  useEffect(() => {
    fetch("/api/ai/coach")
      .then((response) => response.json())
      .then((data: { advice?: string }) => setAdvice(data.advice ?? "Coach IA pret."))
      .catch(() => setAdvice("Coach IA local indisponible pour le moment."));
  }, []);

  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black">
        <BrainCircuit size={18} className="text-gold" />
        Coach financier IA
      </div>
      <p className="text-sm leading-6 text-smoke">{advice}</p>
    </div>
  );
}
