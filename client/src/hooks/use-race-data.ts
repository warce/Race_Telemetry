import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Session, LeaderboardEntry, SessionStats, RecentLap } from "@shared/schema";

export function useRaceData() {
  const queryClient = useQueryClient();

  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/sessions/current"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: [`/api/sessions/${currentSession?.id}/leaderboard`],
    enabled: !!currentSession?.id,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const { data: sessionStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/sessions/${currentSession?.id}/stats`],
    enabled: !!currentSession?.id,
    refetchInterval: 1000, // Refresh every second
  });

  const { data: recentLaps, isLoading: recentLapsLoading } = useQuery({
    queryKey: [`/api/sessions/${currentSession?.id}/recent-laps`],
    enabled: !!currentSession?.id,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const updateSessionStatusMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: number; status: string }) =>
      apiRequest("PATCH", `/api/sessions/${sessionId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${currentSession?.id}/stats`] });
    },
  });

  const resetSessionMutation = useMutation({
    mutationFn: (sessionId: number) =>
      apiRequest("POST", `/api/sessions/${sessionId}/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${currentSession?.id}/leaderboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${currentSession?.id}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${currentSession?.id}/recent-laps`] });
    },
  });

  const updateSessionStatus = (sessionId: number, status: string) => {
    updateSessionStatusMutation.mutate({ sessionId, status });
  };

  const resetSession = (sessionId: number) => {
    resetSessionMutation.mutate(sessionId);
  };

  const isLoading = sessionLoading || leaderboardLoading || statsLoading || recentLapsLoading;

  return {
    currentSession: currentSession as Session | undefined,
    leaderboard: leaderboard as LeaderboardEntry[] | undefined,
    sessionStats: sessionStats as SessionStats | undefined,
    recentLaps: recentLaps as RecentLap[] | undefined,
    updateSessionStatus,
    resetSession,
    isLoading,
    isUpdating: updateSessionStatusMutation.isPending || resetSessionMutation.isPending,
  };
}
