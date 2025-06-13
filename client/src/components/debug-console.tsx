import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Radio, TestTube, Trash2, UserMinus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RemoveKartModal from "./remove-kart-modal";
import RaceReportGenerator from "./race-report-generator";

interface DebugConsoleProps {
  sessionId: number;
  isSessionRunning: boolean;
  onAddKart?: () => void;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export default function DebugConsole({ sessionId, isSessionRunning, onAddKart }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [decoderIp, setDecoderIp] = useState("");
  const [dataFormat, setDataFormat] = useState("json");
  const [removeKartModalOpen, setRemoveKartModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clearAllKarts = useMutation({
    mutationFn: async () => {
      addLog("Iniciando remoção de todos os karts...", "info");
      const response = await apiRequest("DELETE", "/api/karts/clear");
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/karts"] });
      toast({
        title: "Karts removidos",
        description: "Todos os karts foram removidos com sucesso.",
      });
      addLog("Todos os karts foram removidos do sistema", "success");
    },
    onError: (error: any) => {
      console.error("Clear karts error:", error);
      const errorMessage = error?.message || error?.error || "Falha ao remover os karts.";
      toast({
        title: "Erro ao remover karts",
        description: errorMessage,
        variant: "destructive",
      });
      addLog(`Erro ao remover karts: ${errorMessage}`, "error");
    },
  });

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString("en-US", { 
      hour12: false, 
      fractionalSecondDigits: 3 
    });
    
    setLogs(prev => [{
      timestamp,
      message,
      type
    }, ...prev.slice(0, 9)]); // Keep only last 10 entries
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);



  const testConnection = () => {
    if (!decoderIp) {
      addLog("Please enter decoder IP address", "warning");
      return;
    }
    
    addLog(`Testing connection to ${decoderIp}...`, "info");
    // In a real implementation, this would test the actual connection
    setTimeout(() => {
      addLog(`Connection test failed: Not implemented`, "warning");
    }, 1000);
  };

  const startDataCapture = () => {
    addLog("Starting data capture from decoder...", "info");
    // In a real implementation, this would initiate live data capture
    setTimeout(() => {
      addLog("Data capture: Ready for decoder input", "success");
    }, 500);
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-racing-green";
      case "warning":
        return "text-racing-yellow";
      case "error":
        return "text-racing-red";
      default:
        return "text-blue-400";
    }
  };

  useEffect(() => {
    // Add initial log entries
    addLog("Debug console initialized", "success");
    addLog("WebSocket connection established", "info");
    if (isSessionRunning) {
      addLog("Session is running - ready for timing data", "success");
    } else {
      addLog("Session stopped - start session to receive data", "warning");
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-dark-surface">
      {/* Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Controls - Left Side */}
        <div className="w-96 p-4 border-r border-dark-border flex-shrink-0">
          <div className="flex flex-wrap gap-3 items-center mt-[6px] mb-[6px] ml-[23px] mr-[23px]">
            {onAddKart && (
              <button
                onClick={onAddKart}
                className="inline-flex items-center px-4 py-2 font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors w-36 justify-center text-[12px]"
              >
                <Plus className="w-3 h-3 mr-2" />
                Adicionar Kart
              </button>
            )}
            
            <button
              onClick={() => setRemoveKartModalOpen(true)}
              className="inline-flex items-center px-4 py-2 font-medium rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors w-36 justify-center text-[12px]"
            >
              <UserMinus className="w-3 h-3 mr-2" />
              Remover Kart
            </button>
            
            <button
              onClick={() => clearAllKarts.mutate()}
              disabled={clearAllKarts.isPending}
              className="inline-flex items-center px-4 py-2 font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors w-36 justify-center text-[12px]"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              {clearAllKarts.isPending ? "Removendo..." : "Resetar Karts"}
            </button>
            
            <button
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors w-36 justify-center text-[12px]"
            >
              <FileText className="w-3 h-3 mr-2" />
              Gerar Relatório
            </button>
          </div>
        </div>
        
        {/* Decoder Integration - Center */}
        <div className="w-80 p-4 border-r border-dark-border flex-shrink-0 mt-[8px] mb-[8px]">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="IP:Porta do Decodificador"
                value={decoderIp}
                onChange={(e) => setDecoderIp(e.target.value)}
                className="flex-1 h-8 text-sm bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                onClick={testConnection}
                size="sm"
                className="bg-gray-600 hover:bg-gray-700 text-white h-8 px-3"
              >
                <TestTube className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select value={dataFormat} onValueChange={setDataFormat}>
                <SelectTrigger className="h-8 text-sm bg-gray-800 border-gray-600 text-white flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="json">JSON TCP</SelectItem>
                  <SelectItem value="csv">CSV Serial</SelectItem>
                  <SelectItem value="http">HTTP POST</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={startDataCapture}
                size="sm"
                className="bg-racing-red hover:bg-red-700 text-white h-8 px-4"
              >
                <Radio className="w-3 h-3 mr-2" />
                Capturar
              </Button>
            </div>
          </div>
        </div>
        
        {/* Activity Log - Right Side */}
        <div className="flex-1 p-4">
          <div 
            ref={logContainerRef}
            className="bg-gray-900 border border-gray-700 rounded h-full overflow-y-auto font-mono text-xs p-3"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">Aguardando atividade...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.type === "error" ? "text-red-400" :
                    log.type === "warning" ? "text-yellow-400" :
                    log.type === "success" ? "text-green-400" :
                    "text-gray-300"
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Remove Kart Modal */}
      <RemoveKartModal 
        open={removeKartModalOpen} 
        onOpenChange={setRemoveKartModalOpen} 
      />
      {/* Race Report Generator Modal */}
      <RaceReportGenerator 
        open={reportModalOpen} 
        onOpenChange={setReportModalOpen} 
        sessionId={sessionId}
      />
    </div>
  );
}
