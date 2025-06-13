import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddKartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KART_COLORS = [
  { value: "#FF0000", label: "Vermelho" },
  { value: "#00FF00", label: "Verde" },
  { value: "#0000FF", label: "Azul" },
  { value: "#FFFF00", label: "Amarelo" },
  { value: "#FF8800", label: "Laranja" },
  { value: "#8800FF", label: "Roxo" },
  { value: "#00FFFF", label: "Ciano" },
  { value: "#FF00FF", label: "Magenta" },
  { value: "#808080", label: "Cinza" },
  { value: "#FFC0CB", label: "Rosa" },
  { value: "#A52A2A", label: "Marrom" },
  { value: "#000000", label: "Preto" },
];

export default function AddKartModal({ open, onOpenChange }: AddKartModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [kartNumber, setKartNumber] = useState(1);
  const [driverName, setDriverName] = useState("");
  const [transponderId, setTransponderId] = useState("");
  const [color, setColor] = useState("#FF0000");

  const addKartMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/karts", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Falha ao adicionar kart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/karts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Kart adicionado com sucesso",
        description: "O kart foi registrado e está pronto para corrida.",
      });
      setKartNumber(1);
      setDriverName("");
      setTransponderId("");
      setColor("#FF0000");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar kart",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !transponderId.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    addKartMutation.mutate({
      kartNumber,
      driverName: driverName.trim(),
      transponderId: transponderId.trim(),
      color,
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-dark-surface border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar Novo Kart</DialogTitle>
          <DialogDescription className="text-gray-400">
            Registre um novo kart no sistema de telemetria. Certifique-se de que o número do kart e o ID do transponder são únicos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Número do Kart
            </label>
            <Input
              type="number"
              placeholder="1"
              value={kartNumber}
              onChange={(e) => setKartNumber(parseInt(e.target.value) || 1)}
              className="bg-gray-800 border-dark-border text-white"
              min="1"
              max="999"
            />
            <p className="text-gray-500 text-xs mt-1">
              Número visível no kart (1-999)
            </p>
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Nome do Piloto
            </label>
            <Input
              placeholder="João Silva"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="bg-gray-800 border-dark-border text-white"
            />
            <p className="text-gray-500 text-xs mt-1">
              Nome que aparecerá no leaderboard
            </p>
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              ID do Transponder
            </label>
            <Input
              placeholder="TXP001"
              value={transponderId}
              onChange={(e) => setTransponderId(e.target.value)}
              className="bg-gray-800 border-dark-border text-white"
            />
            <p className="text-gray-500 text-xs mt-1">
              ID único do transponder Milliard ZW62
            </p>
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Cor do Kart
            </label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="bg-gray-800 border-dark-border text-white">
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-dark-border">
                {KART_COLORS.map((kartColor) => (
                  <SelectItem key={kartColor.value} value={kartColor.value}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ backgroundColor: kartColor.value }}
                      />
                      <span className="text-white">{kartColor.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-gray-500 text-xs mt-1">
              Cor para identificação visual no leaderboard
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-dark-border text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addKartMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addKartMutation.isPending ? "Adicionando..." : "Adicionar Kart"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}