"use client";

import { useState } from "react";

const getApiBase = () => {
  if (typeof window === "undefined") return "http://localhost:3002";
  return `http://${window.location.hostname}:3002`;
};

type Zone = {
  zoneId: string;
  zoneName: string;
  seatCount: number;
  seatIds: string[];
};

type Warning = {
  type: string;
  message: string;
  seatId?: string;
};

type AnalysisReport = {
  fileName: string | null;
  totalSeats: number;
  dimensions: {
    width: number | null;
    height: number | null;
    viewBox: string | null;
  };
  zones: Zone[];
  seatsWithoutZone: string[];
  warnings: Warning[];
};

type Props = {
  svgUrl?: string;
};

export default function SvgAnalysisPanel({ svgUrl }: Props) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);

  const fileName = svgUrl ? (svgUrl.split("/").pop() || "").split("?")[0] : "";

  const handleAnalyze = async () => {
    if (!svgUrl) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setRegisterResult(null);

    try {
      // Fetch SVG content
      const isRemote = svgUrl.startsWith("http");
      const fetchUrl = isRemote
        ? `/api/proxy?url=${encodeURIComponent(svgUrl)}`
        : svgUrl;
      const svgRes = await fetch(fetchUrl, { cache: "no-store" });
      if (!svgRes.ok) throw new Error("No se pudo cargar el SVG");
      const svgContent = await svgRes.text();

      // Call analyze endpoint
      const res = await fetch(`${getApiBase()}/svg/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svgContent, fileName }),
      });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!svgUrl) return;
    setRegistering(true);
    setRegisterResult(null);

    try {
      const isRemote = svgUrl.startsWith("http");
      const fetchUrl = isRemote
        ? `/api/proxy?url=${encodeURIComponent(svgUrl)}`
        : svgUrl;
      const svgRes = await fetch(fetchUrl, { cache: "no-store" });
      const svgContent = await svgRes.text();

      const res = await fetch(`${getApiBase()}/svg/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svgContent, fileName }),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setRegisterResult(
        `✅ Registrado: ${data.totalSeats} asientos, ${data.totalZones} zonas`,
      );
    } catch (err) {
      setRegisterResult(
        `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setRegistering(false);
    }
  };

  if (!svgUrl) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 16,
        border: "1px solid #4a90d9",
        borderRadius: 8,
        backgroundColor: "#f0f6ff",
        color: "#000",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h4 style={{ margin: 0, color: "#000" }}>🔍 Panel de Análisis SVG</h4>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: "6px 14px",
            backgroundColor: loading ? "#aaa" : "#4a90d9",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Analizando..." : "Analizar Mapa"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 10,
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {report && (
        <div>
          {/* Resumen general */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <StatCard
              label="Total Asientos"
              value={report.totalSeats}
              color="#28a745"
            />
            <StatCard
              label="Zonas"
              value={report.zones.length}
              color="#4a90d9"
            />
            <StatCard
              label="Sin Zona"
              value={report.seatsWithoutZone.length}
              color={report.seatsWithoutZone.length > 0 ? "#dc3545" : "#6c757d"}
            />
            <StatCard
              label="Advertencias"
              value={report.warnings.length}
              color={report.warnings.length > 0 ? "#ffc107" : "#6c757d"}
            />
          </div>

          {/* Dimensiones */}
          {report.dimensions && (
            <div
              style={{
                fontSize: 13,
                color: "#000",
                marginBottom: 10,
                padding: "6px 10px",
                backgroundColor: "#e8eef6",
                borderRadius: 4,
              }}
            >
              📐 <strong>Dimensiones:</strong> {report.dimensions.width ?? "?"}{" "}
              × {report.dimensions.height ?? "?"} px
              {report.dimensions.viewBox && (
                <span style={{ marginLeft: 12 }}>
                  viewBox: <code>{report.dimensions.viewBox}</code>
                </span>
              )}
            </div>
          )}

          {/* Tabla de zonas */}
          {report.zones.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h5 style={{ margin: "0 0 6px", color: "#000" }}>
                Zonas Detectadas
              </h5>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#d6e4f0" }}>
                    <th style={thStyle}>Zona</th>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Asientos</th>
                    <th style={thStyle}>IDs de Asientos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.zones.map((z) => (
                    <tr
                      key={z.zoneId}
                      style={{ borderBottom: "1px solid #ddd" }}
                    >
                      <td style={tdStyle}>
                        <strong>{z.zoneName}</strong>
                      </td>
                      <td style={tdStyle}>
                        <code>{z.zoneId}</code>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {z.seatCount}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#000" }}>
                        {z.seatIds.slice(0, 6).join(", ")}
                        {z.seatIds.length > 6 &&
                          ` (+${z.seatIds.length - 6} más)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Advertencias */}
          {report.warnings.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h5 style={{ margin: "0 0 6px", color: "#000" }}>
                ⚠️ Advertencias
              </h5>
              <div
                style={{
                  maxHeight: 120,
                  overflow: "auto",
                  fontSize: 12,
                  backgroundColor: "#fff3cd",
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                {report.warnings.map((w, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>
                    • {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón registrar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <button
              onClick={handleRegister}
              disabled={registering}
              style={{
                padding: "8px 16px",
                backgroundColor: registering ? "#aaa" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: registering ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {registering
                ? "Registrando..."
                : "📥 Registrar Asientos y Zonas en MongoDB"}
            </button>
            {registerResult && (
              <span style={{ fontSize: 13, color: "#000" }}>
                {registerResult}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small helper components ── */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        backgroundColor: "white",
        borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#000" }}>{label}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: 600,
  color: "#000",
};
const tdStyle: React.CSSProperties = {
  padding: "6px 8px",
  color: "#000",
};
