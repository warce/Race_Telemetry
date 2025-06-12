import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Plus, AlertTriangle, Radio, TestTube } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DebugConsoleProps {
  sessionId: number;
  isSessionRunning: boolean;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export default function DebugConsole({ sessionId, isSessionRunning }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [decoderIp, setDecoderIp] = useState("");
  const [dataFormat, setDataFormat] = useState("json");
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const simulateLapCrossing = useMutation({
    mutationFn: () => apiRequest("POST", "/api/simulate/lap-crossing"),
    onSuccess: () => {
      addLog("Simulated lap crossing completed", "success");
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Lap Simulated",
        description: "Random lap crossing has been simulated successfully",
      });
    },
    onError: (error) => {
      addLog(`Failed to simulate lap crossing: ${error.message}`, "error");
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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
      {/* Compact Header */}
      <div className="px-4 py-2 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Console de Desenvolvimento</h3>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Simulação</span>
            <span>•</span>
            <span>Integração</span>
          </div>
        </div>
      </div>
      
      {/* Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Controls - Left Side */}
        <div className="w-96 p-4 border-r border-dark-border flex-shrink-0">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => simulateLapCrossing.mutate()}
              disabled={!isSessionRunning || simulateLapCrossing.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Play className="w-3 h-3 mr-2" />
              {simulateLapCrossing.isPending ? "Simulando..." : "Simular Volta"}
            </button>
            
            <button
              onClick={() => addLog("Adição de kart: Não implementado", "warning")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <Plus className="w-3 h-3 mr-2" />
              Adicionar Kart
            </button>
            
            <button
              onClick={() => addLog("Simulação de incidente: Não implementado", "warning")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            >
              <AlertTriangle className="w-3 h-3 mr-2" />
              Simular Incidente
            </button>
          </div>
        </div>
        
        {/* Decoder Integration - Center */}
        <div className="w-80 p-4 border-r border-dark-border flex-shrink-0">
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
    </div>
  );
}
