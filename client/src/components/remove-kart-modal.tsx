import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import type { Kart } from "@shared/schema";

interface RemoveKartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RemoveKartModal({ open, onOpenChange }: RemoveKartModalProps) {
  const [selectedKartId, setSelectedKartId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: karts, isLoading } = useQuery<Kart[]>({
    queryKey: ["/api/karts"],
    enabled: open,
  });

  const removeKart = useMutation({
    mutationFn: (kartId: number) => apiRequest("DELETE", `/api/karts/${kartId}`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/karts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Kart removido",
        description: "Kart removido com sucesso.",
      });
      onOpenChange(false);
      setSelectedKartId("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover kart",
        description: error.message || "Falha ao remover o kart.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKartId) {
      toast({
        title: "Seleção necessária",
        description: "Por favor, selecione um kart para remover.",
        variant: "destructive",
      });
      return;
    }
    removeKart.mutate(parseInt(selectedKartId));
  };

  const activeKarts = karts?.filter(kart => kart.isActive) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-dark-surface border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Remover Kart
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Selecionar Kart
            </label>
            {isLoading ? (
              <div className="text-gray-400 text-sm">Carregando karts...</div>
            ) : activeKarts.length === 0 ? (
              <div className="text-gray-400 text-sm">Nenhum kart ativo encontrado</div>
            ) : (
              <Select value={selectedKartId} onValueChange={setSelectedKartId}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Escolha um kart para remover" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedKartId("");
              }}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedKartId || removeKart.isPending || activeKarts.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {removeKart.isPending ? "Removendo..." : "Remover Kart"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}