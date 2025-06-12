import { useEffect } from "react";
import HeaderBar from "@/components/header-bar";
import RaceOverview from "@/components/race-overview";
import LiveLeaderboard from "@/components/live-leaderboard";
import TimingControls from "@/components/timing-controls";
import DebugConsole from "@/components/debug-console";
import { useRaceData } from "@/hooks/use-race-data";
import { connectWebSocket } from "@/lib/websocket";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function Dashboard() {
  const { 
    currentSession, 
    leaderboard, 
    sessionStats, 
    recentLaps,
    updateSessionStatus,
    resetSession,
    isLoading 
  } = useRaceData();

  useEffect(() => {
    if (currentSession) {
      connectWebSocket(currentSession.id);
    }
  }, [currentSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      <HeaderBar 
        session={currentSession}
        onStartSession={() => updateSessionStatus(currentSession?.id || 1, "running")}
        onStopSession={() => updateSessionStatus(currentSession?.id || 1, "stopped")}
        onResetSession={() => resetSession(currentSession?.id || 1)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RaceOverview 
          sessionStats={sessionStats}
          sessionStartTime={currentSession?.startTime}
          sessionStatus={currentSession?.status || "stopped"}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[600px]">
          <div className="lg:col-span-2">
            <LiveLeaderboard 
              leaderboard={leaderboard || []}
              isLive={currentSession?.status === "running"}
            />
          </div>
          
          <div className="space-y-6">
            <TimingControls 
              recentLaps={recentLaps || []}
              connectionStatus="connected"
            />
          </div>
        </div>

        <DebugConsole 
          sessionId={currentSession?.id || 1}
          isSessionRunning={currentSession?.status === "running"}
        />

        {/* Mobile floating actions */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 md:hidden">
          <button 
            onClick={() => {
              if (currentSession?.status === "running") {
                updateSessionStatus(currentSession.id, "stopped");
              } else {
                updateSessionStatus(currentSession?.id || 1, "running");
              }
            }}
            className="w-12 h-12 bg-racing-red hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            {currentSession?.status === "running" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => resetSession(currentSession?.id || 1)}
            className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
