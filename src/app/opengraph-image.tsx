import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/config";

export const alt = `${SITE_NAME} — Pronađi uslugu brzo i lako`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: -2,
              borderRadius: 20,
            }}
          >
            NL
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            {SITE_NAME}
          </div>
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Pronađi uslugu brzo i lako
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.3,
            color: "#cbd5e1",
            maxWidth: 940,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
