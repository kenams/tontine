import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080b07",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Fond vert subtil */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(34,197,94,0.08) 0%, transparent 70%)",
        }} />

        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "20px",
            background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", fontWeight: 900, color: "#080b07",
          }}>K</div>
          <span style={{ fontSize: "40px", fontWeight: 900, color: "white", letterSpacing: "-1px" }}>Kotizy</span>
        </div>

        {/* Titre */}
        <div style={{
          fontSize: "62px", fontWeight: 900, color: "white",
          textAlign: "center", lineHeight: 1, letterSpacing: "-2px",
          marginBottom: "20px",
        }}>
          La tontine de
          <span style={{ color: "#22c55e" }}> la diaspora</span>
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: "24px", color: "rgba(255,255,255,0.5)",
          textAlign: "center", marginBottom: "40px",
        }}>
          Épargnez ensemble en euros · Paris → Abidjan · London → Lagos
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["50€ / mois", "Wave & Orange Money", "Gratuit"].map((tag) => (
            <div key={tag} style={{
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "100px", padding: "8px 20px",
              color: "#22c55e", fontSize: "18px", fontWeight: 700,
            }}>{tag}</div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: "absolute", bottom: "28px",
          fontSize: "16px", color: "rgba(255,255,255,0.25)",
        }}>
          Un produit KAH Digital · kah-digital.ch
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
