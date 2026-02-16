"use client";

import { useState, useEffect } from "react";

type SvgFile = {
  name: string;
  url: string;
};

type Props = {
  onSelectSvg: (url: string) => void;
  selectedSvg?: string;
  isAdmin?: boolean;
};

export default function SvgSelector({
  onSelectSvg,
  selectedSvg,
  isAdmin,
}: Props) {
  const [svgs, setSvgs] = useState<SvgFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSvgs();
  }, []);

  const fetchSvgs = async () => {
    try {
      const response = await fetch("http://localhost:3002/svg/list");
      if (response.ok) {
        const data = await response.json();
        setSvgs(data);
      }
    } catch (error) {
      console.error("Error fetching SVGs:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const svgContent = await file.text();
      const response = await fetch("http://localhost:3002/svg/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          svgContent,
        }),
      });
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      if (!response.ok) {
        console.error("Upload failed:", response.status, body);
        const msg = body?.error || body?.details || `HTTP ${response.status}`;
        setErrorMsg(String(msg));
        return;
      }
      const { url } = body || {};
      if (url) {
        onSelectSvg(url);
        fetchSvgs(); // Refresh list
      } else {
        setErrorMsg("Upload succeeded but no URL returned");
      }
    } catch (error) {
      console.error("Error uploading:", error);
      setErrorMsg(String(error));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (name: string) => {
    setDeleteTarget(name);
    setErrorMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `http://localhost:3002/svg/${encodeURIComponent(deleteTarget)}`,
        {
          method: "DELETE",
        },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Delete failed", res.status, body);
        setErrorMsg(body?.error || body?.details || `HTTP ${res.status}`);
        return;
      }
      fetchSvgs();
      if (selectedSvg && selectedSvg.includes(deleteTarget)) onSelectSvg("");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete error", err);
      setErrorMsg(String(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => setDeleteTarget(null);

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#333" }}>
        Seleccionar o Subir SVG del Mapa de Asientos
      </h3>

      {/* Subir nuevo SVG - área grande y accesible */}
      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="svg-file"
          style={{
            display: "block",
            padding: 16,
            border: "2px dashed #ddd",
            borderRadius: 8,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: file ? "#e0e0e0" : "transparent",
          }}
        >
          <input
            id="svg-file"
            type="file"
            accept=".svg"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <strong style={{ color: "#333" }}>{file.name}</strong>
              <button
                onClick={() => setFile(null)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#007bff",
                  color: "white",
                }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, marginBottom: 6, color: "#333" }}>
                Haz clic aquí para seleccionar un archivo .svg
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                O arrastra y suelta (no soportado: usa selector)
              </div>
            </div>
          )}
        </label>

        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              padding: "8px 14px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: !file || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Subiendo..." : "Subir SVG"}
          </button>
        </div>
        {errorMsg && (
          <div style={{ marginTop: 8, color: "crimson", fontSize: 13 }}>
            Error: {errorMsg}
          </div>
        )}
      </div>

      {/* Seleccionar existente */}
      <div>
        <h4 style={{ marginBottom: 8, color: "#333" }}>SVGs Disponibles:</h4>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {svgs.map((svg) => (
            <div
              key={svg.name}
              style={{
                margin: 6,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => onSelectSvg(svg.url)}
                style={{
                  padding: "8px 12px",
                  backgroundColor:
                    selectedSvg === svg.url ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {svg.name}
              </button>
              {isAdmin ? (
                <button
                  onClick={() => handleDeleteClick(svg.name)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#dc3545",
                    color: "white",
                  }}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
              color: "#333",
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>
              Confirmar eliminación
            </h4>
            <p>
              ¿Eliminar <strong>{deleteTarget}</strong>? Esta acción es
              irreversible.
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                onClick={handleCancelDelete}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                  e.currentTarget.style.transform = "scale(1.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  background: "#f8f9fa",
                  transition: "all 0.15s ease",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.opacity = "0.85";
                    e.currentTarget.style.transform = "scale(1.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  cursor: deleting ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
            {errorMsg && (
              <div style={{ color: "crimson", marginTop: 8 }}>{errorMsg}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
