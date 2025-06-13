import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";
import checkeredPatternPath from "@assets/image_1749741812532.png";

interface LiveLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  isLive: boolean;
}

export default function LiveLeaderboard({ leaderboard, isLive }: LiveLeaderboardProps) {
  const formatLapTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatGap = (gap: number | null) => {
    if (!gap || gap === 0) return "-";
    const seconds = gap / 1000;
    return `+${seconds.toFixed(3)}`;
  };

  const getDriverAbbreviation = (name: string, allDrivers: LeaderboardEntry[] = []) => {
    const generateAbbreviation = (driverName: string, suffix = '') => {
      const nameParts = driverName.split(' ');
      let abbrev = '';
      
      if (nameParts.length >= 2) {
        // Try: First 3 of first name + first 3 of last name, take first 3
        abbrev = (nameParts[0].substring(0, 3) + nameParts[1].substring(0, 3)).substring(0, 3);
      } else {
        // Single name: take first 3 letters
        abbrev = driverName.substring(0, 3);
      }
      
      return (abbrev + suffix).toUpperCase();
    };

    // Get base abbreviation
    let abbreviation = generateAbbreviation(name);
    
    // Check for conflicts with other drivers
    const otherDrivers = allDrivers.filter(driver => driver.driverName !== name);
    const existingAbbrevs = otherDrivers.map(driver => generateAbbreviation(driver.driverName));
    
    // If conflict exists, try alternatives
    let counter = 1;
    while (existingAbbrevs.includes(abbreviation)) {
      const nameParts = name.split(' ');
      
      if (counter === 1 && nameParts.length >= 2) {
        // Try: First 2 of first + first of last
        abbreviation = (nameParts[0].substring(0, 2) + nameParts[1].substring(0, 1)).toUpperCase();
      } else if (counter === 2 && nameParts.length >= 2) {
        // Try: First of first + first 2 of last
        abbreviation = (nameParts[0].substring(0, 1) + nameParts[1].substring(0, 2)).toUpperCase();
      } else if (counter === 3 && nameParts.length >= 3) {
        // Try: First + middle + last initial
        abbreviation = (nameParts[0].substring(0, 1) + nameParts[1].substring(0, 1) + nameParts[2].substring(0, 1)).toUpperCase();
      } else {
        // Add numeric suffix
        const suffix = (counter - 3).toString();
        abbreviation = generateAbbreviation(name).substring(0, 3 - suffix.length) + suffix;
      }
      counter++;
      
      // Safety break after 10 attempts
      if (counter > 10) break;
    }
    
    return abbreviation;
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-racing-yellow";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-orange-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <Card className="bg-dark-surface border-dark-border h-[700px] flex flex-col">
      <CardHeader 
        className="border-b border-gray-600 flex-shrink-0 bg-gradient-to-r from-gray-800 to-gray-700 relative overflow-hidden"
        style={{
          backgroundImage: `url(${checkeredPatternPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div 
          className="absolute inset-0 bg-gray-800/50"
          style={{
            backdropFilter: 'blur(0.3px)'
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <CardTitle className="font-['Rajdhani'] tracking-wide drop-shadow-lg text-center text-[#f3f4f6] text-[20px] font-extrabold">CLASSIFICAÇÃO</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm ${isLive ? 'bg-red-600/90 text-white animate-pulse shadow-lg' : 'bg-gray-600/90 text-gray-300'}`}>
              <RefreshCw className={`w-4 h-4 ${isLive ? "animate-spin" : ""}`} />
              <span>{isLive ? "AO VIVO" : "PARADA"}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        {/* Scrollable Table Section */}
        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0">
              <tr className="text-xs font-medium text-gray-100 uppercase tracking-wider">
                <th className="px-2 py-2 text-center w-8">Pos</th>
                <th className="px-2 py-2 text-center w-24">Piloto</th>
                <th className="px-2 py-2 text-center w-24">Volta</th>
                <th className="px-2 py-2 text-center w-20">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Nenhum dado de cronometragem disponível. Inicie a sessão para ver resultados ao vivo.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr 
                    key={entry.kartId} 
                    className={`hover:bg-gradient-to-r hover:from-gray-800/60 hover:to-gray-700/60 transition-all duration-300 h-12 ${
                      entry.position <= 3 ? 'bg-gradient-to-r from-gray-800/20 to-gray-700/20' : ''
                    }`}
                  >
                    <td className="px-2 py-1 text-center">
                      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold transition-all duration-300 ${
                        entry.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/50' :
                        entry.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg shadow-gray-400/50' :
                        entry.position === 3 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/50' :
                        'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                      }`}>
                        {entry.position}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center space-x-2">
                        <div 
                          className="w-5 h-4 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-md transition-transform duration-300 hover:scale-110"
                          style={{ backgroundColor: entry.color }}
                        >
                          #{entry.kartNumber}
                        </div>
                        <span className="text-sm font-bold text-white uppercase font-['Rajdhani'] tracking-wide">
                          {getDriverAbbreviation(entry.driverName, leaderboard)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-sm font-mono font-medium transition-colors duration-300 ${
                        entry.lastLap ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {entry.lastLap ? formatLapTime(entry.lastLap) : "--:--"}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className={`text-sm font-mono font-medium transition-colors duration-300 ${
                        entry.gap && entry.gap > 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {formatGap(entry.gap)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Fixed Best Lap Section */}
        <div className="flex-shrink-0 mx-4 border-t border-gray-600 pt-4 pb-4">
          <h3 className="text-white font-['Rajdhani'] tracking-wide mb-3 text-center text-[12px] font-bold">MELHOR  VOLTA</h3>
          {(() => {
            const fastestDriver = leaderboard.reduce((fastest, current) => {
              if (!current.bestLap) return fastest;
              if (!fastest || !fastest.bestLap || current.bestLap < fastest.bestLap) {
                return current;
              }
              return fastest;
            }, null as LeaderboardEntry | null);
            
            if (!fastestDriver || !fastestDriver.bestLap) {
              return (
                <div className="text-center text-gray-400 py-4">
                  Nenhuma volta registrada ainda
                </div>
              );
            }
            return (
              <div className="flex items-center justify-center space-x-4 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-lg p-4">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/50">
                  {fastestDriver.position}
                </div>
                <div 
                  className="w-6 h-5 rounded-md flex items-center justify-center text-[11px] font-bold text-white shadow-md"
                  style={{ backgroundColor: fastestDriver.color }}
                >
                  #{fastestDriver.kartNumber}
                </div>
                <span className="text-lg font-bold text-white uppercase font-['Rajdhani'] tracking-wide">
                  {getDriverAbbreviation(fastestDriver.driverName)}
                </span>
                <span className="text-xl font-mono font-bold text-yellow-400">
                  {formatLapTime(fastestDriver.bestLap)}
                </span>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
