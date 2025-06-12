import { Clock, Car, Trophy, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionStats } from "@shared/schema";

interface RaceOverviewProps {
  sessionStats?: SessionStats;
  sessionStartTime?: Date | null;
  sessionStatus: string;
}

export default function RaceOverview({ 
  sessionStats, 
  sessionStartTime, 
  sessionStatus 
}: RaceOverviewProps) {
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatLapTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const getSessionTime = () => {
    if (sessionStatus !== "running" || !sessionStartTime) return "0:00.000";
    const elapsed = Date.now() - new Date(sessionStartTime).getTime();
    return formatTime(elapsed);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Tempo da Sessão</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {getSessionTime()}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Karts Ativos</h3>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {sessionStats?.activeKarts || 0}/{sessionStats?.totalKarts || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Melhor Volta</h3>
            <Trophy className="w-5 h-5 text-racing-yellow" />
          </div>
          <div className="text-2xl font-mono font-bold text-racing-yellow">
            {sessionStats?.bestLap ? formatLapTime(sessionStats.bestLap.time) : "--:--"}
          </div>
          {sessionStats?.bestLap && (
            <div className="text-xs text-gray-400 mt-1">
              Kart #{sessionStats.bestLap.kartNumber}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total de Voltas</h3>
            <Flag className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {sessionStats?.totalLaps || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
