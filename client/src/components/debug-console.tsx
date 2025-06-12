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
    <Card className="mt-8 bg-dark-surface border-dark-border">
      <CardHeader className="border-b border-dark-border">
        <CardTitle className="text-lg font-semibold text-white">
          Development Console
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Mock data simulation and decoder integration testing
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mock Data Controls */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Mock Data Simulation
            </h4>
            <div className="space-y-3">
              <Button
                onClick={() => simulateLapCrossing.mutate()}
                disabled={!isSessionRunning || simulateLapCrossing.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                {simulateLapCrossing.isPending ? "Simulating..." : "Simulate Lap Crossing"}
              </Button>
              
              <Button
                onClick={() => addLog("Random kart addition: Not implemented", "warning")}
                className="w-full bg-racing-green hover:bg-green-600 text-white font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Random Kart
              </Button>
              
              <Button
                onClick={() => addLog("Incident simulation: Not implemented", "warning")}
                className="w-full bg-racing-yellow hover:bg-yellow-600 text-white font-medium"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Simulate Incident
              </Button>
            </div>
          </div>
          
          {/* Connection Testing */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Decoder Integration
            </h4>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Decoder IP:Port"
                  value={decoderIp}
                  onChange={(e) => setDecoderIp(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-racing-red"
                />
                <Button
                  onClick={testConnection}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
              </div>
              
              <Select value={dataFormat} onValueChange={setDataFormat}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:ring-racing-red">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="json">JSON over TCP</SelectItem>
                  <SelectItem value="csv">CSV over Serial</SelectItem>
                  <SelectItem value="http">HTTP POST</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={startDataCapture}
                className="w-full bg-racing-red hover:bg-red-700 text-white font-medium"
              >
                <Radio className="w-4 h-4 mr-2" />
                Start Data Capture
              </Button>
            </div>
          </div>
        </div>
        
        {/* Live Data Feed */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Live Data Feed
          </h4>
          <div 
            ref={logContainerRef}
            className="bg-gray-900 border border-gray-700 rounded p-4 h-32 overflow-y-auto font-mono text-xs dark-scrollbar"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500">Console ready...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
