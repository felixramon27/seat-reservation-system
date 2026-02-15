import { FastifyInstance } from "fastify";
import { supabase } from "../supabase";
import {
  uploadSVG as gcsUpload,
  getSVG as gcsGet,
  listSVGs as gcsList,
  deleteSVG as gcsDelete,
} from "../gcs";

export default async function svgRoutes(fastify: FastifyInstance) {
  // Subir SVG a Supabase storage (o a GCS si USE_GCS=true)
  fastify.post("/svg/upload", async (request, reply) => {
    const { fileName, svgContent } = request.body as {
      fileName: string;
      svgContent: string;
    };
    console.log("Uploading:", fileName);
    try {
      if (process.env.USE_GCS === "true") {
        const publicUrl = await gcsUpload(fileName, svgContent);
        console.log("GCS public URL:", publicUrl);

        // Seed seats from svgContent as before
        try {
          const idRegex = /\sid=["']?(seat-[a-zA-Z0-9_\-]+)["']?/g;
          const ids: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = idRegex.exec(svgContent)) !== null) {
            if (m[1]) ids.push(m[1]);
          }
          const dataSeatRegex = /data-seat=["']?([a-zA-Z0-9_\-]+)["']?/g;
          while ((m = dataSeatRegex.exec(svgContent)) !== null) {
            if (m[1]) ids.push(m[1]);
          }
          const uniq = Array.from(new Set(ids));
          const seatsToInsert = uniq.map((extId) => ({
            id: `${fileName}::${extId}`,
            externalId: extId,
            map: fileName,
            status: "available",
          }));
          if (seatsToInsert.length > 0) {
            const Seat = require("../models/Seat").default;
            await Seat.deleteMany({ map: fileName });
            await Seat.insertMany(seatsToInsert);
            console.log(
              `Seeded ${seatsToInsert.length} seats for map ${fileName}`,
            );
          }
        } catch (err) {
          console.warn("SVG upload: failed to auto-create seats:", err);
        }

        return { url: publicUrl, fileName };
      }

      // Supabase path
      // Supabase storage in Node expects a Buffer or stream for upload
      const buffer = Buffer.from(svgContent, "utf-8");
      const { data, error } = await supabase.storage
        .from("svgs")
        .upload(fileName, buffer, {
          contentType: "image/svg+xml",
          upsert: true,
          cacheControl: "0",
        });
      if (error) {
        console.error("Supabase upload error:", error);
        const details =
          typeof error === "object" ? JSON.stringify(error) : String(error);
        return reply
          .code(500)
          .send({ error: "Supabase upload error", details });
      }

      console.log("Upload data:", data);
      const urlRes = supabase.storage.from("svgs").getPublicUrl(fileName);
      const publicUrl = urlRes.data?.publicUrl;
      console.log("Public URL:", publicUrl);
      // After upload, parse svgContent to find seat-like ids and create seat records scoped to this file
      try {
        // Extract ids from svgContent
        const idRegex = /\sid=["']?(seat-[a-zA-Z0-9_\-]+)["']?/g;
        const ids: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = idRegex.exec(svgContent)) !== null) {
          if (m[1]) ids.push(m[1]);
        }
        // Also look for common data attributes (data-seat) and text labels like A1, B12
        const dataSeatRegex = /data-seat=["']?([a-zA-Z0-9_\-]+)["']?/g;
        while ((m = dataSeatRegex.exec(svgContent)) !== null) {
          if (m[1]) ids.push(m[1]);
        }

        // dedupe
        const uniq = Array.from(new Set(ids));
        const seatsToInsert = uniq.map((extId) => ({
          id: `${fileName}::${extId}`,
          externalId: extId,
          map: fileName,
          status: "available",
        }));
        if (seatsToInsert.length > 0) {
          // remove existing seats for this map to avoid duplicates
          const Seat = require("../models/Seat").default;
          await Seat.deleteMany({ map: fileName });
          await Seat.insertMany(seatsToInsert);
          console.log(
            `Seeded ${seatsToInsert.length} seats for map ${fileName}`,
          );
        }
      } catch (err) {
        console.warn("SVG upload: failed to auto-create seats:", err);
      }
      return { url: publicUrl, fileName };
    } catch (error) {
      console.error("Error uploading SVG (catch):", error);
      const details =
        error && typeof error === "object"
          ? JSON.stringify(error)
          : String(error);
      reply.code(500).send({ error: "Error uploading SVG", details });
    }
  });

  // Listar SVGs
  fastify.get("/svg/list", async (request, reply) => {
    try {
      if (process.env.USE_GCS === "true") {
        const files = await gcsList();
        return files;
      }
      const { data, error } = await supabase.storage.from("svgs").list();
      if (error) throw error;
      const svgs = data.map((file) => ({
        name: file.name,
        url: supabase.storage.from("svgs").getPublicUrl(file.name).data
          .publicUrl,
      }));
      return svgs;
    } catch (error) {
      console.error("Error listing SVGs:", error);
      const details =
        error && typeof error === "object"
          ? JSON.stringify(error)
          : String(error);
      reply.code(500).send({ error: "Error listing SVGs", details });
    }
  });

  // Debug route to check Supabase connection and bucket
  fastify.get("/svg/debug", async (request, reply) => {
    try {
      if (process.env.USE_GCS === "true") {
        const files = await gcsList();
        return {
          bucket: process.env.GCS_BUCKET_NAME || "seat-svgs",
          count: files.length,
          files: files.map((f) => f.name),
        };
      }
      const { data, error } = await supabase.storage.from("svgs").list();
      if (error) {
        const details =
          typeof error === "object" ? JSON.stringify(error) : String(error);
        console.error("Supabase list error:", error);
        return reply.code(500).send({ error: "Supabase list error", details });
      }
      return {
        bucket: "svgs",
        count: data.length,
        files: data.map((f) => f.name),
      };
    } catch (err) {
      console.error("Supabase debug error:", err);
      const details =
        err && typeof err === "object" ? JSON.stringify(err) : String(err);
      reply.code(500).send({ error: "Supabase debug error", details });
    }
  });

  // Obtener SVG (opcional, ruta con prefijo para evitar choque con /svg/debug)
  fastify.get("/svg/file/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    try {
      if (process.env.USE_GCS === "true") {
        const content = await gcsGet(fileName);
        reply.type("image/svg+xml").send(content);
        return;
      }
      const { data, error } = await supabase.storage
        .from("svgs")
        .download(fileName);
      if (error) {
        const details =
          typeof error === "object" ? JSON.stringify(error) : String(error);
        console.error("Supabase download error:", error);
        return reply
          .code(500)
          .send({ error: "Error downloading SVG", details });
      }
      reply.type("image/svg+xml").send(data);
    } catch (error) {
      const details =
        error && typeof error === "object"
          ? JSON.stringify(error)
          : String(error);
      reply.code(500).send({ error: "Error fetching SVG", details });
    }
  });

  // Eliminar SVG (admin)
  fastify.delete("/svg/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    try {
      console.log("Delete request for", fileName);
      if (process.env.USE_GCS === "true") {
        const res = await gcsDelete(fileName);
        return res;
      }
      const { data, error } = await supabase.storage
        .from("svgs")
        .remove([fileName]);
      if (error) {
        const details =
          typeof error === "object" ? JSON.stringify(error) : String(error);
        console.error("Supabase remove error:", error);
        return reply
          .code(500)
          .send({ error: "Supabase remove error", details });
      }
      return { removed: data };
    } catch (err) {
      console.error("Error removing SVG:", err);
      const details =
        err && typeof err === "object" ? JSON.stringify(err) : String(err);
      reply.code(500).send({ error: "Error removing SVG", details });
    }
  });
}
