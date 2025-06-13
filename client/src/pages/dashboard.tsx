import { useEffect, useState, useRef } from "react";
import HeaderBar from "@/components/header-bar";
import RaceOverview from "@/components/race-overview";
import LiveLeaderboard from "@/components/live-leaderboard";
import TimingControls from "@/components/timing-controls";
import DebugConsole from "@/components/debug-console";
import AddKartModal from "@/components/add-kart-modal";
import { useRaceData } from "@/hooks/use-race-data";
import { connectWebSocket } from "@/lib/websocket";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [addKartModalOpen, setAddKartModalOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const lastServerTime = useRef(0);
  const lastServerTimestamp = useRef(Date.now());
  const frozenTime = useRef<number | null>(null);
  const isResetting = useRef(false);

  // Handle session status changes
  useEffect(() => {
    if (currentSession?.status === 'stopped') {
      // Freeze the timer when stopped
      if (frozenTime.current === null && sessionStats?.sessionTime !== undefined && !isResetting.current) {
        frozenTime.current = sessionStats.sessionTime;
        setDisplayTime(sessionStats.sessionTime);
      }
    } else if (currentSession?.status === 'running') {
      // Unfreeze when running again
      frozenTime.current = null;
      isResetting.current = false;
    } else if (currentSession?.status === 'ready') {
      // Reset state when session is reset
      frozenTime.current = null;
      setDisplayTime(0);
      isResetting.current = false;
    }
  }, [currentSession?.status, sessionStats?.sessionTime]);

  // Update display time when server data changes (only if not frozen and not resetting)
  useEffect(() => {
    if (sessionStats?.sessionTime !== undefined && frozenTime.current === null && !isResetting.current) {
      if (currentSession?.status === 'running') {
        lastServerTime.current = sessionStats.sessionTime;
        lastServerTimestamp.current = Date.now();
        setDisplayTime(sessionStats.sessionTime);
      }
    }
  }, [sessionStats?.sessionTime, currentSession?.status]);

  // Smooth timer interpolation at 60fps (only when running and not frozen and not resetting)
  useEffect(() => {
    if (currentSession?.status !== 'running' || frozenTime.current !== null || isResetting.current) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastServerTimestamp.current;
      const interpolatedTime = lastServerTime.current + elapsed;
      setDisplayTime(interpolatedTime);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [currentSession?.status, frozenTime.current]);

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
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      <HeaderBar 
        session={currentSession}
        onStartSession={() => updateSessionStatus(currentSession?.id || 1, "running")}
        onStopSession={() => updateSessionStatus(currentSession?.id || 1, "stopped")}
        onResetSession={() => resetSession(currentSession?.id || 1)}
        onAddKart={() => setAddKartModalOpen(true)}
      />
      {/* Broadcast Layout with Chroma Key Center */}
      <main className="relative h-[calc(100vh-4rem)] overflow-hidden">
        {/* Chroma Key Background for Live Feed */}
        <div className="absolute inset-0 bg-green-500" style={{ backgroundColor: '#00FF00' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-black font-bold text-2xl opacity-50">
              <div>ÁREA PARA FEED AO VIVO</div>
              <div className="text-lg mt-2">Chroma Key: #00FF00</div>
            </div>
          </div>
        </div>

        {/* Top Stats Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex justify-between items-center mt-[-14px] mb-[-14px]">
            <div className="bg-dark-surface rounded-lg px-4 py-2 border border-dark-border text-center">
              <div className="text-sm text-gray-400">Tempo</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-mono text-racing-green">
                  {(() => {
                    const ms = displayTime;
                    const totalSeconds = Math.floor(ms / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    const milliseconds = Math.floor(ms % 1000);
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
                  })()}
                </div>
                <button
                  onClick={() => {
                    // Set reset flag to prevent server data from updating display
                    isResetting.current = true;
                    // Clear all timer states immediately
                    frozenTime.current = null;
                    lastServerTime.current = 0;
                    lastServerTimestamp.current = Date.now();
                    setDisplayTime(0);
                    // Reset session on backend
                    resetSession(currentSession?.id || 1);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Resetar Timer"
                >
                  <RefreshCw className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="bg-dark-surface rounded-lg px-4 py-2 border border-dark-border text-center">
              <div className="text-sm text-gray-400">Voltas</div>
              <div className="text-xl font-mono text-racing-green">
                {Math.min((sessionStats?.totalLaps || 0) + 1, 20)}/20
              </div>
            </div>
            
            <div className="bg-dark-surface rounded-lg px-4 py-2 border border-dark-border text-center">
              <div className="text-sm text-gray-400">Karts Ativos</div>
              <div className="text-xl font-mono text-racing-green">
                {sessionStats?.activeKarts || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Left Side - Leaderboard */}
        <div className={`absolute left-4 top-20 w-80 z-10 ${
          consoleCollapsed ? 'bottom-20' : 'bottom-32'
        }`}>
          <div className="h-full bg-dark-surface rounded-lg border border-dark-border overflow-hidden text-[12px] pl-[10px] pr-[10px] pt-[10px] pb-[10px] ml-[0px] mr-[0px] mt-[11px] mb-[11px] font-extralight">
            <LiveLeaderboard 
              leaderboard={leaderboard || []}
              isLive={currentSession?.status === "running"}
            />
          </div>
        </div>

        {/* Collapsible Right Sidebar */}
        <div className={`absolute top-24 bottom-20 z-10 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'right-0 w-12' : 'right-4 w-80'
        }`}>
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-dark-surface border border-dark-border rounded-l-lg p-2 hover:bg-gray-700 transition-colors z-20"
          >
            {sidebarCollapsed ? 
              <ChevronLeft className="w-4 h-4 text-gray-400" /> : 
              <ChevronRight className="w-4 h-4 text-gray-400" />
            }
          </button>

          {/* Sidebar Content */}
          <div className="h-full bg-dark-surface rounded-lg border border-dark-border overflow-hidden transition-all duration-300 opacity-100 mt-[-8px] mb-[-8px]">
            {!sidebarCollapsed && (
              <div className="h-full flex flex-col gap-4 p-4 mt-[14px] mb-[14px]">
                {/* Timing Controls */}
                <div className="flex-1 bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
                  <TimingControls 
                    recentLaps={recentLaps || []}
                    connectionStatus="connected"
                  />
                </div>
                
                {/* Track Conditions */}
                <div className="bg-dark-surface rounded-lg border border-dark-border p-4">
                  <div className="mb-3 text-center text-[18px] font-semibold text-[#ffffff]">Condições da Pista</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Clima</span>
                      <span className="text-gray-200">☀️ Ensolarado</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperatura</span>
                      <span className="text-gray-200">24°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status da Pista</span>
                      <span className="text-racing-green">Bandeira Verde</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Superfície</span>
                      <span className="text-gray-200">Seca</span>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="bg-dark-surface rounded-lg border border-dark-border p-4 text-center">
                  <div className="text-sm font-medium text-gray-300 mb-2 text-left">Decoder Milliard ZW62 </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-racing-green rounded-full animate-pulse"></div>
                    <span className="text-racing-green font-medium">Conectado</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-left">UDP Port: 9999</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Bottom Console */}
        <div className={`absolute left-4 right-4 z-10 transition-all duration-300 ease-in-out ${
          consoleCollapsed ? 'bottom-0 h-12' : 'bottom-4 h-32'
        }`}>
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setConsoleCollapsed(!consoleCollapsed)}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-dark-surface border border-dark-border rounded-t-lg px-4 py-2 hover:bg-gray-700 transition-colors z-20"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Configurações</span>
              {consoleCollapsed ? 
                <ChevronLeft className="w-3 h-3 text-gray-400 rotate-90" /> : 
                <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
              }
            </div>
          </button>

          {/* Console Content */}
          <div className={`h-full bg-dark-surface rounded-lg border border-dark-border overflow-hidden transition-all duration-300 ${
            consoleCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            {!consoleCollapsed && (
              <DebugConsole 
                sessionId={currentSession?.id || 1}
                isSessionRunning={currentSession?.status === "running"}
                onAddKart={() => setAddKartModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Mobile floating actions */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 lg:hidden z-20">
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
      {/* Add Kart Modal */}
      <AddKartModal 
        open={addKartModalOpen}
        onOpenChange={setAddKartModalOpen}
      />
    </div>
  );
}
