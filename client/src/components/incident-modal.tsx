import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Flag, Users, Car } from "lucide-react";
import type { Kart } from "@shared/schema";

interface IncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
}

const incidentTypes = [
  { value: "collision", label: "Colisão entre Karts", icon: Car, color: "text-red-500" },
  { value: "track_limits", label: "Limites de Pista", icon: Flag, color: "text-yellow-500" },
  { value: "unsafe_driving", label: "Pilotagem Perigosa", icon: AlertTriangle, color: "text-orange-500" },
  { value: "blocking", label: "Bloqueio/Obstrução", icon: Users, color: "text-blue-500" },
  { value: "mechanical", label: "Problema Mecânico", icon: Car, color: "text-gray-500" },
  { value: "other", label: "Outro", icon: AlertTriangle, color: "text-purple-500" }
];

export default function IncidentModal({ open, onOpenChange, sessionId }: IncidentModalProps) {
  const [selectedKartId, setSelectedKartId] = useState<string>("");
  const [incidentType, setIncidentType] = useState<string>("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: karts, isLoading } = useQuery<Kart[]>({
    queryKey: ["/api/karts"],
    enabled: open,
  });

  const reportIncident = useMutation({
    mutationFn: (incidentData: any) => apiRequest("POST", "/api/incidents", incidentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({
        title: "Incidente registrado",
        description: "O incidente foi registrado com sucesso.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar incidente",
        description: error.message || "Falha ao registrar o incidente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedKartId("");
    setIncidentType("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incidentType) {
      toast({
        title: "Tipo de incidente necessário",
        description: "Por favor, selecione o tipo de incidente.",
        variant: "destructive",
      });
      return;
    }

    const incidentData = {
      sessionId,
      kartId: selectedKartId ? parseInt(selectedKartId) : null,
      type: incidentType,
      description: description.trim() || null,
      timestamp: new Date().toISOString()
    };

    reportIncident.mutate(incidentData);
  };

  const activeKarts = karts?.filter(kart => kart.isActive) || [];
  const selectedIncidentType = incidentTypes.find(type => type.value === incidentType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-dark-surface border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Registrar Incidente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Tipo de Incidente *
            </label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Selecione o tipo de incidente" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {incidentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Kart Envolvido (Opcional)
            </label>
            {isLoading ? (
              <div className="text-gray-400 text-sm">Carregando karts...</div>
            ) : (
              <Select value={selectedKartId} onValueChange={setSelectedKartId}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione um kart (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="" className="text-white hover:bg-gray-700">
                    Nenhum kart específico
                  </SelectItem>
                  {activeKarts.map((kart) => (
                    <SelectItem
                      key={kart.id}
                      value={kart.id.toString()}
                      className="text-white hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: kart.color }}
                        />
                        <span>#{kart.kartNumber} - {kart.driverName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Descrição Adicional (Opcional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes do incidente..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/500 caracteres
            </div>
          </div>

          {selectedIncidentType && (
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <selectedIncidentType.icon className={`w-4 h-4 ${selectedIncidentType.color}`} />
                <span className="text-sm font-medium text-white">
                  {selectedIncidentType.label}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Este incidente será registrado com timestamp atual e ficará disponível para análise pós-corrida.
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!incidentType || reportIncident.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
            >
              {reportIncident.isPending ? "Registrando..." : "Registrar Incidente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}