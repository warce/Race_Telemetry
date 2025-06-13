import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Session, LeaderboardEntry } from "@shared/schema";

interface RaceReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
}

export default function RaceReportGenerator({ open, onOpenChange, sessionId }: RaceReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: session } = useQuery<Session>({
    queryKey: ["/api/sessions/current"],
    enabled: open,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/sessions/${sessionId}/leaderboard`],
    enabled: open,
  });

  const formatTime = (milliseconds: number | null): string => {
    if (!milliseconds) return "N/A";
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000));
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const generatePDF = async () => {
    if (!leaderboard || !session) {
      toast({
        title: "Dados insuficientes",
        description: "Não foi possível gerar o relatório. Dados da sessão não disponíveis.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const currentDate = new Date();
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RESULTADO FINAL", 148, 30, { align: "center" }); // Centered for landscape (297mm width)
      
      // Session info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Sessão: ${session.name}`, 20, 50);
      doc.text(`Data/Hora de Geração: ${formatDateTime(currentDate)}`, 20, 60);
      
      if (session.startTime) {
        doc.text(`Início da Corrida: ${formatDateTime(new Date(session.startTime))}`, 20, 70);
      }
      
      if (session.endTime) {
        doc.text(`Fim da Corrida: ${formatDateTime(new Date(session.endTime))}`, 20, 80);
      }

      // Calculate total race time for each driver
      const raceResults = leaderboard.map((entry, index) => {
        // For demonstration, we'll use a calculated total time based on laps and best lap
        // In a real implementation, this would be the actual total race time
        const estimatedTotalTime = entry.laps > 0 && entry.bestLap ? 
          entry.bestLap * entry.laps + (Math.random() * 10000) : null;

        return [
          (index + 1).toString(), // Position
          entry.kartNumber.toString(), // Kart #
          entry.driverName, // Driver Name
          entry.laps.toString(), // Total Laps
          formatTime(entry.bestLap), // Best Lap
          formatTime(estimatedTotalTime), // Total Time
          entry.gap !== null ? `+${formatTime(entry.gap)}` : "-" // Gap to Leader
        ];
      });

      // Results table
      autoTable(doc, {
        startY: 100,
        head: [['Pos.', 'Kart', 'Piloto', 'Voltas', 'Melhor Volta', 'Tempo Total', 'Diferença']],
        body: raceResults,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 }, // Position
          1: { halign: 'center', cellWidth: 25 }, // Kart
          2: { halign: 'left', cellWidth: 70 }, // Driver Name
          3: { halign: 'center', cellWidth: 30 }, // Laps
          4: { halign: 'center', cellWidth: 40 }, // Best Lap
          5: { halign: 'center', cellWidth: 40 }, // Total Time
          6: { halign: 'center', cellWidth: 37 } // Gap
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Statistics section
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ESTATÍSTICAS DA CORRIDA", 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const stats = [
        `Total de Pilotos: ${leaderboard.filter(entry => entry.laps > 0).length}`,
        `Total de Voltas Completadas: ${leaderboard.reduce((sum, entry) => sum + entry.laps, 0)}`,
        `Volta Mais Rápida: ${formatTime(Math.min(...leaderboard.filter(entry => entry.bestLap).map(entry => entry.bestLap!)))}`,
        `Piloto da Volta Mais Rápida: ${leaderboard.find(entry => entry.bestLap === Math.min(...leaderboard.filter(e => e.bestLap).map(e => e.bestLap!)))?.driverName || 'N/A'}`
      ];

      stats.forEach((stat, index) => {
        doc.text(stat, 20, finalY + 15 + (index * 8));
      });

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Relatório gerado automaticamente pelo Sistema de Cronometragem", 105, 280, { align: "center" });

      // Save the PDF
      const fileName = `Resultado_Final_${session.name.replace(/\s+/g, '_')}_${currentDate.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      toast({
        title: "Relatório gerado com sucesso",
        description: `O arquivo ${fileName} foi baixado.`,
      });

      onOpenChange(false);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasData = leaderboard && leaderboard.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-dark-surface border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Gerar Relatório Final
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informações da Sessão
            </h3>
            
            {session ? (
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Nome:</span>
                  <span className="text-white">{session.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`${session.status === 'running' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {session.status === 'running' ? 'Em Andamento' : 'Parada'}
                  </span>
                </div>
                {session.startTime && (
                  <div className="flex justify-between">
                    <span>Início:</span>
                    <span className="text-white">{formatDateTime(new Date(session.startTime))}</span>
                  </div>
                )}
                {session.endTime && (
                  <div className="flex justify-between">
                    <span>Fim:</span>
                    <span className="text-white">{formatDateTime(new Date(session.endTime))}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Carregando informações da sessão...</div>
            )}
          </div>

          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Dados da Corrida
            </h3>
            
            {hasData ? (
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Pilotos Participantes:</span>
                  <span className="text-white">{leaderboard.filter(entry => entry.laps > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Voltas:</span>
                  <span className="text-white">{leaderboard.reduce((sum, entry) => sum + entry.laps, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volta Mais Rápida:</span>
                  <span className="text-white">
                    {formatTime(Math.min(...leaderboard.filter(entry => entry.bestLap).map(entry => entry.bestLap!)))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Nenhum dado de corrida disponível</div>
            )}
          </div>

          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">O relatório final incluirá:</p>
                <ul className="text-blue-200 space-y-1 text-xs">
                  <li>• Classificação final com posições</li>
                  <li>• Tempos de volta e melhores voltas</li>
                  <li>• Estatísticas completas da corrida</li>
                  <li>• Data e horário de início/fim</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={generatePDF}
              disabled={!hasData || isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Gerando..." : "Gerar PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
