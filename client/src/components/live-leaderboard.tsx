import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";

interface LiveLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  isLive: boolean;
}

export default function LiveLeaderboard({ leaderboard, isLive }: LiveLeaderboardProps) {
  const formatLapTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatGap = (gap: number | null) => {
    if (!gap || gap === 0) return "-";
    const seconds = gap / 1000;
    return `+${seconds.toFixed(3)}`;
  };

  const getDriverAbbreviation = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].substring(0, 3) + nameParts[1].substring(0, 3)).toUpperCase().substring(0, 3);
    }
    return name.substring(0, 3).toUpperCase();
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-racing-yellow";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-orange-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <Card className="bg-dark-surface border-dark-border h-[600px] flex flex-col">
      <CardHeader className="border-b border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Classificação ao Vivo
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <RefreshCw className={`w-4 h-4 ${isLive ? "animate-spin" : ""}`} />
            <span>{isLive ? "Atualização automática" : "Parado"}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto dark-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0">
              <tr className="text-xs font-medium text-gray-100 uppercase tracking-wider">
                <th className="px-2 py-2 text-left w-8">Pos</th>
                <th className="px-2 py-2 text-left w-20">Piloto</th>
                <th className="px-2 py-2 text-right w-20">Melhor Volta</th>
                <th className="px-2 py-2 text-right w-20">Última Volta</th>
                <th className="px-2 py-2 text-right w-16">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum dado de cronometragem disponível. Inicie a sessão para ver resultados ao vivo.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr 
                    key={entry.kartId} 
                    className="hover:bg-gray-800 transition-colors h-10"
                  >
                    <td className="px-2 py-1">
                      <span className={`text-sm font-bold ${getPositionColor(entry.position)}`}>
                        {entry.position}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-3 rounded-sm flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: entry.color }}
                        >
                          #{entry.kartNumber}
                        </div>
                        <span className="text-sm font-bold text-white uppercase">
                          {getDriverAbbreviation(entry.driverName)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-sm font-mono text-racing-green">
                        {entry.bestLap ? formatLapTime(entry.bestLap) : "--:--"}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-sm font-mono text-white">
                        {entry.lastLap ? formatLapTime(entry.lastLap) : "--:--"}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-sm font-mono text-white">
                        {formatGap(entry.gap)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
