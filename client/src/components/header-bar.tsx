import { FlagIcon, Play, Square, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@shared/schema";
import kartRacingPath from "@assets/image_1749778709365.png";

interface HeaderBarProps {
  session?: Session;
  onStartSession: () => void;
  onStopSession: () => void;
  onResetSession: () => void;
  onAddKart?: () => void;
}

export default function HeaderBar({ 
  session, 
  onStartSession, 
  onStopSession, 
  onResetSession,
  onAddKart 
}: HeaderBarProps) {
  const isRunning = session?.status === "running";
  
  return (
    <header className="bg-dark-surface border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src={kartRacingPath} 
                alt="Kart Racing" 
                className="h-10 w-auto rounded-md shadow-md opacity-90 transition-opacity duration-300 hover:opacity-100"
              />
              <FlagIcon className="text-racing-red w-6 h-6" />
              <h1 className="text-xl font-bold">Telemetria de Corrida</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-gray-400">Sessão:</span>
              <span className="font-mono text-racing-green">
                {session?.name === "Sessão de Treino" ? "Treino" : (session?.name || "Nenhuma")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isRunning ? "bg-racing-green animate-pulse" : "bg-gray-500"
              }`} />
              <span className="text-sm font-medium">
                {isRunning ? "AO VIVO" : "PARADO"}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={onStartSession}
                disabled={isRunning}
                size="sm"
                className="bg-[#004f1c] hover:bg-green-600 text-white font-medium"
              >
                <Play className="w-4 h-4 mr-1" />
                Iniciar
              </Button>
              <Button
                onClick={onStopSession}
                disabled={!isRunning}
                size="sm"
                className="bg-racing-red hover:bg-red-700 text-white font-medium"
              >
                <Square className="w-4 h-4 mr-1" />
                Parar
              </Button>
              <Button
                onClick={onResetSession}
                size="sm"
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
