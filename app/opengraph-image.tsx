import { ImageResponse } from "next/og";

export const alt = "Demir Diesel - Peças, Módulos Eletrônicos & Oficina Especializada";
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
          justifyContent: "space-between",
          padding: "50px 60px",
          backgroundColor: "#0A0F1D",
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(10, 122, 172, 0.35) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(15, 23, 42, 0.8) 0%, transparent 60%)",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
          border: "8px solid #0F172A",
        }}
      >
        {/* Top Header / Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                backgroundColor: "#0F172A",
                border: "2px solid #0A7AAC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(10, 122, 172, 0.4)",
              }}
            >
              <span
                style={{
                  fontSize: "38px",
                  fontWeight: 900,
                  color: "#0A7AAC",
                }}
              >
                D
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: "#FFFFFF",
                  }}
                >
                  DEMIR
                </span>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: "#0A7AAC",
                  }}
                >
                  DIESEL
                </span>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#94A3B8",
                }}
              >
                Peças & Tecnologia Diesel
              </span>
            </div>
          </div>

          {/* Domain Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              borderRadius: "999px",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(10, 122, 172, 0.4)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                boxShadow: "0 0 10px #10B981",
              }}
            />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#E2E8F0",
                letterSpacing: "0.5px",
              }}
            >
              demirdiesel.com.br
            </span>
          </div>
        </div>

        {/* Middle Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            maxWidth: "960px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#38BDF8",
                backgroundColor: "rgba(14, 165, 233, 0.15)",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              Catálogo Online & Atendimento Especializado
            </span>
          </div>
          <h1
            style={{
              fontSize: "46px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Módulos Eletrônicos, Injeção & Peças para Caminhões e Linha Pesada
          </h1>
          <p
            style={{
              fontSize: "19px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#94A3B8",
              margin: 0,
            }}
          >
            Especialistas em diagnóstico avançado, laboratório diesel e componentes de alta performance com envio para todo o Brasil.
          </p>
        </div>

        {/* Bottom Feature Cards */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            width: "100%",
          }}
        >
          {[
            { title: "Estoque Imediato", desc: "Módulos ECM, bombas e bicos", icon: "⚙️" },
            { title: "Laboratório Diesel", desc: "Testes e reparos eletrônicos", icon: "🔬" },
            { title: "Envio Nacional", desc: "Despacho rápido e seguro", icon: "🚚" },
            { title: "Suporte Técnico", desc: "Atendimento por especialistas", icon: "💬" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                borderRadius: "14px",
                border: "1px solid rgba(51, 65, 85, 0.6)",
              }}
            >
              <span style={{ fontSize: "24px" }}>{item.icon}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#F8FAFC" }}>
                  {item.title}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748B" }}>
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
