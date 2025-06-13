import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertSessionSchema, insertKartSchema, insertLapTimeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // WebSocket connection handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    socket.on("join-session", (sessionId: number) => {
      socket.join(`session-${sessionId}`);
    });
  });

  // Session management
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      
      io.emit("session-created", session);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });

  app.get("/api/sessions/current", async (req, res) => {
    try {
      const session = await storage.getCurrentSession();
      if (!session) {
        return res.status(404).json({ message: "No active session found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get current session", error });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["running", "stopped", "paused"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const session = await storage.updateSessionStatus(sessionId, status);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // If starting a session, check if we need to generate simulation data
      if (status === "running") {
        const existingLaps = await storage.getLapTimes(sessionId);
        if (existingLaps.length === 0) {
          // Auto-generate simulation data for demo purposes
          const karts = await storage.getAllKarts();
          
          for (const kart of karts) {
            if (kart.isActive) {
              // Generate multiple laps with realistic times
              const baseLapTime = 42000 + Math.random() * 8000; // 42-50 seconds
              
              for (let lapNumber = 1; lapNumber <= Math.floor(Math.random() * 5) + 3; lapNumber++) {
                const variation = (Math.random() - 0.5) * 3000; // ±3 seconds variation
                const lapTime = Math.max(35000, baseLapTime + variation);
                
                const crossingTime = new Date(Date.now() - (8 - lapNumber) * 55000); // Stagger lap times
                
                const lapData = {
                  sessionId,
                  kartId: kart.id,
                  lapNumber,
                  lapTime: Math.round(lapTime),
                  crossingTime,
                  isValid: Math.random() > 0.05 // 95% valid laps
                };
                
                await storage.addLapTime(lapData);
              }
            }
          }
        }
      }

      io.emit("session-status-changed", session);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session status", error });
    }
  });

  app.patch("/api/sessions/:id/status", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["running", "stopped", "paused"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const session = await storage.updateSessionStatus(sessionId, status);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // If starting a session, check if we need to generate simulation data
      if (status === "running") {
        const existingLaps = await storage.getLapTimes(sessionId);
        if (existingLaps.length === 0) {
          // Auto-generate simulation data for demo purposes
          const karts = await storage.getAllKarts();
          
          for (const kart of karts) {
            if (kart.isActive) {
              // Generate multiple laps with realistic times
              const baseLapTime = 42000 + Math.random() * 8000; // 42-50 seconds
              
              for (let lapNumber = 1; lapNumber <= Math.floor(Math.random() * 5) + 3; lapNumber++) {
                const variation = (Math.random() - 0.5) * 3000; // ±3 seconds variation
                const lapTime = Math.max(35000, baseLapTime + variation);
                
                const crossingTime = new Date(Date.now() - (8 - lapNumber) * 55000); // Stagger lap times
                
                const lapData = {
                  sessionId,
                  kartId: kart.id,
                  lapNumber,
                  lapTime: Math.round(lapTime),
                  crossingTime,
                  isValid: Math.random() > 0.05 // 95% valid laps
                };
                
                await storage.addLapTime(lapData);
              }
            }
          }
        }
      }

      io.emit("session-status-changed", session);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session status", error });
    }
  });

  app.post("/api/sessions/:id/reset", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.resetSession(sessionId);
      
      io.to(`session-${sessionId}`).emit("session-reset", { sessionId });
      res.json({ message: "Session reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset session", error });
    }
  });

  // Kart management
  app.get("/api/karts", async (req, res) => {
    try {
      const karts = await storage.getAllKarts();
      res.json(karts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get karts", error });
    }
  });

  app.post("/api/karts", async (req, res) => {
    try {
      const kartData = insertKartSchema.parse(req.body);
      const kart = await storage.createKart(kartData);
      
      io.emit("kart-added", kart);
      res.json(kart);
    } catch (error) {
      res.status(400).json({ message: "Invalid kart data", error });
    }
  });

  // Timing data endpoint (for external decoder)
  app.post("/api/timing", async (req, res) => {
    try {
      const { transponderId, timestamp } = req.body;
      
      if (!transponderId) {
        return res.status(400).json({ message: "Transponder ID required" });
      }

      const kart = await storage.getKartByTransponder(transponderId);
      if (!kart) {
        return res.status(404).json({ message: "Kart not found for transponder ID" });
      }

      const currentSession = await storage.getCurrentSession();
      if (!currentSession || currentSession.status !== "running") {
        return res.status(400).json({ message: "No active session" });
      }

      // Calculate lap time
      const lastLap = await storage.getLastLapTime(currentSession.id, kart.id);
      const crossingTime = timestamp ? new Date(timestamp) : new Date();
      
      let lapTime = 0;
      let lapNumber = 1;

      if (lastLap) {
        lapTime = crossingTime.getTime() - lastLap.crossingTime.getTime();
        lapNumber = lastLap.lapNumber + 1;
      }

      const lapTimeData = await storage.addLapTime({
        sessionId: currentSession.id,
        kartId: kart.id,
        lapNumber,
        lapTime,
        crossingTime,
        isValid: lapTime > 30000 // Minimum 30 seconds for valid lap
      });

      // Emit real-time updates
      const leaderboard = await storage.getLeaderboard(currentSession.id);
      const sessionStats = await storage.getSessionStats(currentSession.id);
      const recentLaps = await storage.getRecentLaps(currentSession.id, 5);

      io.to(`session-${currentSession.id}`).emit("lap-completed", {
        lapTime: lapTimeData,
        kart,
        leaderboard,
        sessionStats,
        recentLaps
      });

      res.json({ 
        message: "Lap time recorded", 
        lapTime: lapTimeData,
        kart: { kartNumber: kart.kartNumber, driverName: kart.driverName }
      });
    } catch (error) {
      console.error("Timing data error:", error);
      res.status(500).json({ message: "Failed to process timing data", error });
    }
  });

  // Dashboard data endpoints
  app.get("/api/sessions/:id/leaderboard", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const leaderboard = await storage.getLeaderboard(sessionId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard", error });
    }
  });

  app.get("/api/sessions/:id/stats", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const stats = await storage.getSessionStats(sessionId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session stats", error });
    }
  });

  app.get("/api/sessions/:id/recent-laps", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 10;
      const recentLaps = await storage.getRecentLaps(sessionId, limit);
      res.json(recentLaps);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent laps", error });
    }
  });

  // Delete individual kart
  app.delete("/api/karts/:id", async (req, res) => {
    try {
      const kartId = parseInt(req.params.id);
      const kart = await storage.getKart(kartId);
      
      if (!kart) {
        return res.status(404).json({ error: "Kart not found" });
      }
      
      await storage.updateKartStatus(kartId, false);
      
      // Emit event to notify clients
      io.emit("kart-removed", { kartId, kart });
      
      res.json({ message: "Kart removed successfully", kart });
    } catch (error) {
      console.error("Error removing kart:", error);
      res.status(500).json({ error: "Failed to remove kart" });
    }
  });

  // Clear all karts
  app.delete("/api/karts/clear", async (req, res) => {
    try {
      await storage.clearAllKarts();
      
      // Emit event to notify clients
      io.emit("karts-cleared");
      
      res.json({ message: "All karts cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear karts", error });
    }
  });

  // Start comprehensive simulation
  app.post("/api/sessions/:id/start-simulation", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Start the session if not already started
      await storage.updateSessionStatus(sessionId, "running");
      
      // Generate realistic lap times for each kart
      const karts = await storage.getAllKarts();
      const simulationData = [];
      
      for (const kart of karts) {
        if (kart.isActive) {
          // Generate multiple laps with realistic times
          const baseLapTime = 42000 + Math.random() * 8000; // 42-50 seconds
          
          for (let lapNumber = 1; lapNumber <= Math.floor(Math.random() * 5) + 3; lapNumber++) {
            const variation = (Math.random() - 0.5) * 3000; // ±3 seconds variation
            const lapTime = Math.max(35000, baseLapTime + variation);
            
            const crossingTime = new Date(Date.now() - (8 - lapNumber) * 55000); // Stagger lap times
            
            const lapData = {
              sessionId,
              kartId: kart.id,
              lapNumber,
              lapTime: Math.round(lapTime),
              crossingTime,
              isValid: Math.random() > 0.05 // 95% valid laps
            };
            
            await storage.addLapTime(lapData);
            simulationData.push(lapData);
            
            // Add telemetry data for this lap
            await storage.addTelemetryData({
              sessionId,
              kartId: kart.id,
              lapNumber,
              speed: Math.round(45 + Math.random() * 30), // 45-75 km/h
              rpm: Math.round(6000 + Math.random() * 2500), // 6000-8500 RPM
              throttle: Math.round(65 + Math.random() * 35), // 65-100%
              brake: Math.round(Math.random() * 25), // 0-25%
              gForce: Math.round((Math.random() * 2.5 + 1.2) * 100) / 100, // 1.2-3.7 G
              timestamp: crossingTime
            });
          }
        }
      }
      
      // Broadcast update via WebSocket
      io.emit('sessionUpdate', {
        type: 'simulation_started',
        sessionId,
        message: 'Simulação de dados iniciada com sucesso'
      });
      
      res.json({ 
        message: "Simulação iniciada com dados realistas", 
        sessionId,
        lapsGenerated: simulationData.length
      });
    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ error: "Falha ao iniciar simulação" });
    }
  });

  // Development/testing endpoints
  app.post("/api/simulate/lap-crossing", async (req, res) => {
    try {
      const currentSession = await storage.getCurrentSession();
      if (!currentSession || currentSession.status !== "running") {
        return res.status(400).json({ message: "No active session" });
      }

      const karts = await storage.getAllKarts();
      const activeKarts = karts.filter(k => k.isActive);
      
      if (activeKarts.length === 0) {
        return res.status(400).json({ message: "No active karts" });
      }

      const randomKart = activeKarts[Math.floor(Math.random() * activeKarts.length)];
      const lastLap = await storage.getLastLapTime(currentSession.id, randomKart.id);
      
      // Generate realistic lap time (42-50 seconds)
      const baseLapTime = 42000 + Math.random() * 8000;
      const lapNumber = lastLap ? lastLap.lapNumber + 1 : 1;

      const lapTimeData = await storage.addLapTime({
        sessionId: currentSession.id,
        kartId: randomKart.id,
        lapNumber,
        lapTime: Math.round(baseLapTime),
        crossingTime: new Date(),
        isValid: Math.random() > 0.05
      });

      // Add telemetry data
      await storage.addTelemetryData({
        sessionId: currentSession.id,
        kartId: randomKart.id,
        lapNumber,
        speed: Math.round(45 + Math.random() * 30),
        rpm: Math.round(6000 + Math.random() * 2500),
        throttle: Math.round(65 + Math.random() * 35),
        brake: Math.round(Math.random() * 25),
        gForce: Math.round((Math.random() * 2.5 + 1.2) * 100) / 100,
        timestamp: new Date()
      });

      // Emit real-time updates
      const leaderboard = await storage.getLeaderboard(currentSession.id);
      const sessionStats = await storage.getSessionStats(currentSession.id);
      const recentLaps = await storage.getRecentLaps(currentSession.id, 5);

      io.to(`session-${currentSession.id}`).emit("lap-completed", {
        lapTime: lapTimeData,
        kart: randomKart,
        leaderboard,
        sessionStats,
        recentLaps
      });

      res.json({ 
        message: "Simulated lap crossing", 
        lapTime: lapTimeData,
        kart: randomKart 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate lap crossing", error });
    }
  });

  return httpServer;
}
