import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Seat } from "@/types/seat";
import {
  getSeats,
  reserveSeat,
  confirmSeat,
  releaseSeat,
  getMockSeats,
} from "@/services/seat.service";

export function useSeatSelection(map?: string) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"client" | "admin">("client");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  // Sillas que este usuario ha reservado temporalmente (para mostrar botón de confirmar)
  const [heldSeats, setHeldSeats] = useState<string[]>([]);

  useEffect(() => {
    type BackendSeat = {
      id: string;
      externalId?: string;
      status: Seat["status"];
      expiresAt?: string;
    };

    const fetchSeats = async () => {
      setLoading(true);
      setSelectedSeats([]);
      setSeats([]);
      try {
        const data = (await getSeats(map)) as BackendSeat[];
        // backend returns seats with id = `${map}::${externalId}` and externalId
        // transform to frontend Seat shape where id is externalId
        const transformed = data.map((s) => ({
          id: s.externalId || s.id,
          status: s.status,
          expiresAt: s.expiresAt, // Pasamos la fecha de expiración
        }));
        setSeats(transformed);
      } catch (error) {
        console.error("Failed to fetch seats, using mocks:", error);
        setSeats(getMockSeats());
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [map]);

  // Efecto para manejar la conexión WebSocket en tiempo real
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    let isMounted = true;

    // Refetch seats (used on reconnect to catch any missed updates)
    const refetchSeats = async () => {
      try {
        type BackendSeat = {
          id: string;
          externalId?: string;
          status: Seat["status"];
          expiresAt?: string;
        };
        const data = (await getSeats(map)) as BackendSeat[];
        const transformed = data.map((s) => ({
          id: s.externalId || s.id,
          status: s.status,
          expiresAt: s.expiresAt,
        }));
        if (isMounted) setSeats(transformed);
      } catch (err) {
        console.warn("Error refetching seats on reconnect:", err);
      }
    };

    const connect = () => {
      const wsHost =
        typeof window !== "undefined" ? window.location.hostname : "localhost";
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${wsHost}:5001`;
      console.log("🔄 Intentando conectar WebSocket a:", wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("🟢 Conectado al servicio de tiempo real de sillas");
        // Refetch seats to catch any updates missed while disconnected
        refetchSeats();
        // Heartbeat: send ping every 25s to keep connection alive
        // Mobile browsers and routers kill idle WebSocket connections
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "SEAT_UPDATE" && data.seat) {
            const updatedSeat = data.seat;
            console.log("📩 WebSocket Update recibido:", updatedSeat);

            setSeats((prevSeats) => {
              if (map && updatedSeat.map && updatedSeat.map !== map)
                return prevSeats;

              const targetId =
                updatedSeat.externalId ||
                updatedSeat.seatId ||
                updatedSeat.id ||
                updatedSeat._id;

              return prevSeats.map((seat) => {
                const isMatch = String(seat.id) === String(targetId);
                if (isMatch)
                  console.log(`✅ Silla encontrada y actualizada: ${seat.id}`);
                return isMatch
                  ? {
                      ...seat,
                      status: updatedSeat.status,
                      expiresAt: updatedSeat.expiresAt,
                    }
                  : seat;
              });
            });
          }
        } catch (error) {
          console.error("Error procesando mensaje WS:", error);
        }
      };

      ws.onerror = (err) => {
        console.error("🔴 Error en WebSocket:", err);
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        if (isMounted) {
          console.log(
            "🔴 Desconectado. Intentando reconectar en 3 segundos...",
          );
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
      if (ws) {
        ws.close();
      }
    };
  }, [map]);

  const selectSeat = async (seatId: string) => {
    if (mode === "client") {
      // Toggle selection
      setSelectedSeats((prev) =>
        prev.includes(seatId)
          ? prev.filter((id) => id !== seatId)
          : [...prev, seatId],
      );
    } else if (mode === "admin") {
      // Release if reserved
      const seat = seats.find((s) => s.id === seatId);
      if (seat?.status === "reserved") {
        try {
          await releaseSeat(map, seatId);
          setSeats((prev) =>
            prev.map((s) =>
              s.id === seatId ? { ...s, status: "available" } : s,
            ),
          );
          toast.success("Asiento liberado correctamente");
        } catch (error) {
          console.error("Failed to release seat:", error);
          toast.error("Error al liberar el asiento");
          // Fallback: update local state
          setSeats((prev) =>
            prev.map((s) =>
              s.id === seatId ? { ...s, status: "available" } : s,
            ),
          );
        }
      }
    }
  };

  // Paso 1: Reservar temporalmente (Hold 5 min)
  const confirmSelection = async () => {
    const newlyHeld: string[] = [];
    for (const seatId of selectedSeats) {
      try {
        const updatedSeat = await reserveSeat(map, seatId);
        setSeats((prev) =>
          prev.map((seat) =>
            seat.id === seatId
              ? {
                  ...seat,
                  status: updatedSeat.status,
                  expiresAt: updatedSeat.expiresAt,
                }
              : seat,
          ),
        );
        newlyHeld.push(seatId);
        toast.success(
          `Asiento ${seatId} reservado por 5 minutos. ¡Confirma tu compra!`,
        );
      } catch (error) {
        // Usamos warn en lugar de error para evitar ruido en la consola, ya que es un flujo controlado
        console.warn("No se pudo completar la reserva:", seatId);
        // Mostramos el mensaje exacto que viene del backend ("La silla ya no está disponible")
        const message =
          error instanceof Error
            ? error.message
            : `No se pudo reservar el asiento ${seatId}`;
        toast.error(message);
      }
    }
    setHeldSeats((prev) => [...prev, ...newlyHeld]);
    setSelectedSeats([]);
  };

  // Paso 2: Confirmación Definitiva (Compra)
  const confirmBooking = async () => {
    const confirmedIds: string[] = []; // Lista temporal para guardar las que sí funcionaron

    for (const seatId of heldSeats) {
      try {
        const updatedSeat = await confirmSeat(map, seatId);
        setSeats((prev) =>
          prev.map((seat) =>
            seat.id === seatId
              ? { ...seat, status: updatedSeat.status, expiresAt: undefined }
              : seat,
          ),
        );
        toast.success(`¡Compra confirmada para el asiento ${seatId}!`);
        confirmedIds.push(seatId);
      } catch (error) {
        console.error("Error confirmando:", error);
        const message =
          error instanceof Error
            ? error.message
            : `Error al confirmar ${seatId}`;
        toast.error(message);
      }
    }
    // Solo quitamos de la lista de espera las sillas que se confirmaron exitosamente
    setHeldSeats((prev) => prev.filter((id) => !confirmedIds.includes(id)));
  };

  const clearSelection = () => {
    setSelectedSeats([]);
  };

  return {
    seats,
    selectSeat,
    clearSelection,
    releaseSeat,
    loading,
    mode,
    setMode,
    selectedSeats,
    confirmSelection,
    confirmBooking, // Nueva función expuesta
    heldSeats, // Para saber si mostrar el botón de "Confirmar Compra"
  };
}
