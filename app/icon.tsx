import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F172A",
          backgroundImage:
            "radial-gradient(circle at 75% 25%, #0A7AAC 0%, #0F172A 70%)",
          borderRadius: "112px",
          border: "20px solid #0A7AAC",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "378px",
            height: "378px",
            borderRadius: "80px",
            backgroundColor: "#090D16",
            border: "8px solid rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontSize: "260px",
              fontWeight: 900,
              color: "#38BDF8",
              letterSpacing: "-2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              marginLeft: "10px",
            }}
          >
            D
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
