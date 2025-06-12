import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Sun } from "lucide-react";
import type { RecentLap } from "@shared/schema";

interface TimingControlsProps {
  recentLaps: RecentLap[];
  connectionStatus: "connected" | "disconnected" | "error";
}

export default function TimingControls({ recentLaps, connectionStatus }: TimingControlsProps) {
  const formatLapTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatGap = (gap: number | null) => {
    if (!gap || gap === 0) return null;
    const sign = gap > 0 ? "+" : "";
    return `${sign}${formatLapTime(Math.abs(gap))}`;
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-racing-green";
      case "disconnected":
        return "text-gray-500";
      case "error":
        return "text-racing-red";
      default:
        return "text-gray-500";
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      case "error":
        return "Erro";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Connection Status */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Conexão de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status do Decodificador</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected" ? "bg-racing-green" : "bg-gray-500"
              }`} />
              <span className={`text-sm font-medium ${getConnectionColor()}`}>
                {getConnectionStatus()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Formato de Dados</span>
            <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-white">
              JSON/TCP
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Última Atualização</span>
            <span className="text-sm font-mono text-white">
              Agora mesmo
            </span>
          </div>
          
          <div className="pt-2 border-t border-dark-border">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Endpoint: <span className="font-mono">POST /api/timing</span></div>
              <div>Protocol: <span className="font-mono">WebSocket + HTTP</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Lap Times */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Voltas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentLaps.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              Nenhuma volta recente registrada
            </div>
          ) : (
            recentLaps.map((lap, index) => (
              <div key={`${lap.kartId}-${index}`} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lap.color }}
                  />
                  <span className="font-mono font-bold text-sm">
                    #{lap.kartNumber}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-sm ${
                    lap.isPersonalBest ? "text-racing-green" : "text-white"
                  }`}>
                    {formatLapTime(lap.lapTime)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {lap.isPersonalBest ? "Melhor Pessoal" : 
                     lap.gapToBest ? formatGap(lap.gapToBest) : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Track Status */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Condições da Pista
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Clima</span>
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-racing-yellow" />
              <span className="text-sm text-white">Ensolarado</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Temperatura</span>
            <span className="text-sm font-mono text-white">24°C</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status da Pista</span>
            <span className="text-sm text-racing-green font-medium">Bandeira Verde</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Superfície</span>
            <span className="text-sm text-white">Seca</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
