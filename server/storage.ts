import { 
  sessions, karts, lapTimes, telemetryData,
  type Session, type Kart, type LapTime, type TelemetryData,
  type InsertSession, type InsertKart, type InsertLapTime, type InsertTelemetryData,
  type LeaderboardEntry, type SessionStats, type RecentLap
} from "@shared/schema";

export interface IStorage {
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  getCurrentSession(): Promise<Session | undefined>;
  updateSessionStatus(id: number, status: string, endTime?: Date): Promise<Session | undefined>;
  
  // Kart management
  createKart(kart: InsertKart): Promise<Kart>;
  getKart(id: number): Promise<Kart | undefined>;
  getKartByNumber(kartNumber: number): Promise<Kart | undefined>;
  getKartByTransponder(transponderId: string): Promise<Kart | undefined>;
  getAllKarts(): Promise<Kart[]>;
  updateKartStatus(id: number, isActive: boolean): Promise<Kart | undefined>;
  
  // Lap time management
  addLapTime(lapTime: InsertLapTime): Promise<LapTime>;
  getLapTimes(sessionId: number, kartId?: number): Promise<LapTime[]>;
  getLastLapTime(sessionId: number, kartId: number): Promise<LapTime | undefined>;
  getBestLapTime(sessionId: number, kartId?: number): Promise<LapTime | undefined>;
  
  // Telemetry data
  addTelemetryData(data: InsertTelemetryData): Promise<TelemetryData>;
  
  // Dashboard queries
  getLeaderboard(sessionId: number): Promise<LeaderboardEntry[]>;
  getSessionStats(sessionId: number): Promise<SessionStats>;
  getRecentLaps(sessionId: number, limit?: number): Promise<RecentLap[]>;
  
  // Utility methods
  resetSession(sessionId: number): Promise<void>;
  clearAllKarts(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<number, Session>;
  private karts: Map<number, Kart>;
  private lapTimes: Map<number, LapTime>;
  private telemetryData: Map<number, TelemetryData>;
  private currentSessionId = 1;
  private currentKartId = 1;
  private currentLapTimeId = 1;
  private currentTelemetryId = 1;

  constructor() {
    this.sessions = new Map();
    this.karts = new Map();
    this.lapTimes = new Map();
    this.telemetryData = new Map();
    
    // Initialize with default session and some karts
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default session
    const defaultSession: Session = {
      id: this.currentSessionId++,
      name: "Sessão de Treino",
      status: "stopped",
      startTime: null,
      endTime: null,
      trackConditions: { weather: "sunny", temperature: 24, surface: "dry" }
    };
    this.sessions.set(defaultSession.id, defaultSession);

    // Create default karts
    const defaultKarts = [
      { kartNumber: 23, driverName: "Marcus Silva", transponderId: "T001", color: "#dc2626" },
      { kartNumber: 42, driverName: "Alex Johnson", transponderId: "T002", color: "#3b82f6" },
      { kartNumber: 18, driverName: "Emma Davis", transponderId: "T003", color: "#10b981" },
      { kartNumber: 7, driverName: "Ryan Chen", transponderId: "T004", color: "#f59e0b" },
      { kartNumber: 91, driverName: "Sofia Rodriguez", transponderId: "T005", color: "#8b5cf6" },
      { kartNumber: 15, driverName: "Carlos Mendes", transponderId: "T006", color: "#e11d48" },
      { kartNumber: 33, driverName: "Isabella Santos", transponderId: "T007", color: "#0ea5e9" },
      { kartNumber: 44, driverName: "Diego Oliveira", transponderId: "T008", color: "#22c55e" },
      { kartNumber: 88, driverName: "Marina Costa", transponderId: "T009", color: "#f97316" },
      { kartNumber: 12, driverName: "Pedro Almeida", transponderId: "T010", color: "#a855f7" },
      { kartNumber: 77, driverName: "Beatriz Lima", transponderId: "T011", color: "#ef4444" },
      { kartNumber: 21, driverName: "Gabriel Rocha", transponderId: "T012", color: "#06b6d4" },
      { kartNumber: 55, driverName: "Camila Ferreira", transponderId: "T013", color: "#84cc16" },
      { kartNumber: 99, driverName: "Lucas Barbosa", transponderId: "T014", color: "#f59e0b" },
      { kartNumber: 3, driverName: "Valentina Ramos", transponderId: "T015", color: "#8b5cf6" },
    ];

    defaultKarts.forEach(kartData => {
      const kart: Kart = {
        id: this.currentKartId++,
        ...kartData,
        isActive: true
      };
      this.karts.set(kart.id, kart);
    });
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: this.currentSessionId++,
      ...insertSession,
      startTime: insertSession.status === 'running' ? new Date() : null,
      endTime: null
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getCurrentSession(): Promise<Session | undefined> {
    return Array.from(this.sessions.values())
      .find(session => session.status === 'running') || 
      Array.from(this.sessions.values())[0];
  }

  async updateSessionStatus(id: number, status: string, endTime?: Date): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession: Session = {
      ...session,
      status,
      startTime: status === 'running' && !session.startTime ? new Date() : session.startTime,
      endTime: status === 'stopped' ? (endTime || new Date()) : null
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async createKart(insertKart: InsertKart): Promise<Kart> {
    const kart: Kart = {
      id: this.currentKartId++,
      ...insertKart,
      isActive: true
    };
    this.karts.set(kart.id, kart);
    return kart;
  }

  async getKart(id: number): Promise<Kart | undefined> {
    return this.karts.get(id);
  }

  async getKartByNumber(kartNumber: number): Promise<Kart | undefined> {
    return Array.from(this.karts.values()).find(kart => kart.kartNumber === kartNumber);
  }

  async getKartByTransponder(transponderId: string): Promise<Kart | undefined> {
    return Array.from(this.karts.values()).find(kart => kart.transponderId === transponderId);
  }

  async getAllKarts(): Promise<Kart[]> {
    return Array.from(this.karts.values());
  }

  async updateKartStatus(id: number, isActive: boolean): Promise<Kart | undefined> {
    const kart = this.karts.get(id);
    if (!kart) return undefined;

    const updatedKart: Kart = { ...kart, isActive };
    this.karts.set(id, updatedKart);
    return updatedKart;
  }

  async addLapTime(insertLapTime: InsertLapTime): Promise<LapTime> {
    const lapTime: LapTime = {
      id: this.currentLapTimeId++,
      ...insertLapTime,
      crossingTime: insertLapTime.crossingTime || new Date()
    };
    this.lapTimes.set(lapTime.id, lapTime);
    return lapTime;
  }

  async getLapTimes(sessionId: number, kartId?: number): Promise<LapTime[]> {
    return Array.from(this.lapTimes.values())
      .filter(lap => lap.sessionId === sessionId && (!kartId || lap.kartId === kartId))
      .sort((a, b) => b.crossingTime.getTime() - a.crossingTime.getTime());
  }

  async getLastLapTime(sessionId: number, kartId: number): Promise<LapTime | undefined> {
    const laps = await this.getLapTimes(sessionId, kartId);
    return laps[0];
  }

  async getBestLapTime(sessionId: number, kartId?: number): Promise<LapTime | undefined> {
    const laps = await this.getLapTimes(sessionId, kartId);
    return laps.filter(lap => lap.isValid).sort((a, b) => a.lapTime - b.lapTime)[0];
  }

  async addTelemetryData(insertTelemetry: InsertTelemetryData): Promise<TelemetryData> {
    const telemetry: TelemetryData = {
      id: this.currentTelemetryId++,
      ...insertTelemetry,
      timestamp: insertTelemetry.timestamp || new Date()
    };
    this.telemetryData.set(telemetry.id, telemetry);
    return telemetry;
  }

  async getLeaderboard(sessionId: number): Promise<LeaderboardEntry[]> {
    const karts = await this.getAllKarts();
    const leaderboard: LeaderboardEntry[] = [];

    for (const kart of karts) {
      const laps = await this.getLapTimes(sessionId, kart.id);
      const validLaps = laps.filter(lap => lap.isValid);
      const bestLap = validLaps.sort((a, b) => a.lapTime - b.lapTime)[0];
      const lastLap = laps[0];

      leaderboard.push({
        position: 0, // Will be calculated after sorting
        kartId: kart.id,
        kartNumber: kart.kartNumber,
        driverName: kart.driverName,
        color: kart.color,
        bestLap: bestLap?.lapTime || null,
        lastLap: lastLap?.lapTime || null,
        gap: null, // Will be calculated after sorting
        laps: validLaps.length,
        isActive: kart.isActive
      });
    }

    // Sort by laps completed (desc) then by best lap time (asc)
    leaderboard.sort((a, b) => {
      if (a.laps !== b.laps) return b.laps - a.laps;
      if (!a.bestLap) return 1;
      if (!b.bestLap) return -1;
      return a.bestLap - b.bestLap;
    });

    // Calculate positions and gaps
    const leader = leaderboard[0];
    leaderboard.forEach((entry, index) => {
      entry.position = index + 1;
      if (index > 0 && entry.bestLap && leader.bestLap) {
        entry.gap = entry.bestLap - leader.bestLap;
      }
    });

    return leaderboard;
  }

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    const session = await this.getSession(sessionId);
    const karts = await this.getAllKarts();
    const activeKarts = karts.filter(kart => kart.isActive).length;
    const allLaps = await this.getLapTimes(sessionId);
    const bestLap = await this.getBestLapTime(sessionId);
    const bestLapKart = bestLap ? await this.getKart(bestLap.kartId) : null;

    const sessionTime = session?.startTime ? 
      Date.now() - session.startTime.getTime() : 0;

    return {
      sessionTime,
      activeKarts,
      totalKarts: karts.length,
      bestLap: bestLap && bestLapKart ? {
        time: bestLap.lapTime,
        kartNumber: bestLapKart.kartNumber,
        driverName: bestLapKart.driverName
      } : null,
      totalLaps: allLaps.filter(lap => lap.isValid).length
    };
  }

  async getRecentLaps(sessionId: number, limit = 10): Promise<RecentLap[]> {
    const recentLaps = await this.getLapTimes(sessionId);
    const result: RecentLap[] = [];

    for (const lap of recentLaps.slice(0, limit)) {
      const kart = await this.getKart(lap.kartId);
      if (!kart) continue;

      const kartBestLap = await this.getBestLapTime(sessionId, lap.kartId);
      const sessionBestLap = await this.getBestLapTime(sessionId);
      
      result.push({
        kartId: kart.id,
        kartNumber: kart.kartNumber,
        driverName: kart.driverName,
        color: kart.color,
        lapTime: lap.lapTime,
        timestamp: lap.crossingTime,
        isPersonalBest: kartBestLap?.id === lap.id,
        gapToBest: sessionBestLap ? lap.lapTime - sessionBestLap.lapTime : null
      });
    }

    return result;
  }

  async resetSession(sessionId: number): Promise<void> {
    // Remove all lap times and telemetry data for this session
    const lapTimesToRemove = Array.from(this.lapTimes.entries())
      .filter(([_, lap]) => lap.sessionId === sessionId)
      .map(([id]) => id);
    
    const telemetryToRemove = Array.from(this.telemetryData.entries())
      .filter(([_, data]) => data.sessionId === sessionId)
      .map(([id]) => id);

    lapTimesToRemove.forEach(id => this.lapTimes.delete(id));
    telemetryToRemove.forEach(id => this.telemetryData.delete(id));

    // Reset session status
    await this.updateSessionStatus(sessionId, 'stopped');
  }

  async clearAllKarts(): Promise<void> {
    // Clear all karts, lap times, and telemetry data
    this.karts.clear();
    this.lapTimes.clear();
    this.telemetryData.clear();
    
    // Reset ID counters
    this.currentKartId = 1;
    this.currentLapTimeId = 1;
    this.currentTelemetryId = 1;
  }
}

export const storage = new MemStorage();
