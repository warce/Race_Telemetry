import { pgTable, text, serial, integer, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("stopped"), // stopped, running, paused
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  trackConditions: jsonb("track_conditions").default({}),
  targetLaps: integer("target_laps").default(20),
});

export const karts = pgTable("karts", {
  id: serial("id").primaryKey(),
  kartNumber: integer("kart_number").notNull().unique(),
  driverName: text("driver_name").notNull(),
  transponderId: text("transponder_id").notNull().unique(),
  color: text("color").notNull().default("#dc2626"),
  isActive: boolean("is_active").notNull().default(true),
});

export const lapTimes = pgTable("lap_times", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  kartId: integer("kart_id").notNull(),
  lapNumber: integer("lap_number").notNull(),
  lapTime: real("lap_time").notNull(), // in milliseconds
  crossingTime: timestamp("crossing_time").notNull(),
  isValid: boolean("is_valid").notNull().default(true),
});

export const telemetryData = pgTable("telemetry_data", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  kartId: integer("kart_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  data: jsonb("data").notNull(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  kartId: integer("kart_id"),
  type: text("type").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  name: true,
  status: true,
  trackConditions: true,
});

export const insertKartSchema = createInsertSchema(karts).pick({
  kartNumber: true,
  driverName: true,
  transponderId: true,
  color: true,
});

export const insertLapTimeSchema = createInsertSchema(lapTimes).pick({
  sessionId: true,
  kartId: true,
  lapNumber: true,
  lapTime: true,
  crossingTime: true,
  isValid: true,
});

export const insertTelemetrySchema = createInsertSchema(telemetryData).pick({
  sessionId: true,
  kartId: true,
  timestamp: true,
  data: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertKart = z.infer<typeof insertKartSchema>;
export type Kart = typeof karts.$inferSelect;

export type InsertLapTime = z.infer<typeof insertLapTimeSchema>;
export type LapTime = typeof lapTimes.$inferSelect;

export type InsertTelemetryData = z.infer<typeof insertTelemetrySchema>;
export type TelemetryData = typeof telemetryData.$inferSelect;

// Extended types for API responses
export type LeaderboardEntry = {
  position: number;
  kartId: number;
  kartNumber: number;
  driverName: string;
  color: string;
  bestLap: number | null;
  lastLap: number | null;
  gap: number | null;
  laps: number;
  isActive: boolean;
};

export type SessionStats = {
  sessionTime: number;
  activeKarts: number;
  totalKarts: number;
  bestLap: {
    time: number;
    kartNumber: number;
    driverName: string;
  } | null;
  totalLaps: number;
};

export type RecentLap = {
  kartId: number;
  kartNumber: number;
  driverName: string;
  color: string;
  lapTime: number;
  timestamp: Date;
  isPersonalBest: boolean;
  gapToBest: number | null;
};
