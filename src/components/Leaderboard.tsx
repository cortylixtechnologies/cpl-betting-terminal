import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_winnings: number;
  bets_won: number;
  total_bets: number;
  win_rate: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    // Get all settled bets with profiles
    const { data: bets } = await supabase
      .from("bets")
      .select("user_id, stake, potential_payout, status")
      .in("status", ["WON", "LOST"]);

    const { data: profiles } = await supabase.from("profiles").select("user_id, username");

    if (!bets || !profiles) {
      setLoading(false);
      return;
    }

    const profileMap = new Map(profiles.map((p) => [p.user_id, p.username]));

    // Aggregate by user
    const userStats = new Map<string, { winnings: number; won: number; total: number }>();
    for (const bet of bets) {
      const stats = userStats.get(bet.user_id) ?? { winnings: 0, won: 0, total: 0 };
      stats.total++;
      if (bet.status === "WON") {
        stats.winnings += bet.potential_payout - bet.stake;
        stats.won++;
      }
      userStats.set(bet.user_id, stats);
    }

    const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries())
      .map(([user_id, stats]) => ({
        user_id,
        username: profileMap.get(user_id) ?? "Unknown",
        total_winnings: stats.winnings,
        bets_won: stats.won,
        total_bets: stats.total,
        win_rate: stats.total > 0 ? (stats.won / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total_winnings - a.total_winnings)
      .slice(0, 20);

    setEntries(leaderboard);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, fetchLeaderboard)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400 animate-pulse-glow" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-foreground font-mono w-5 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-primary text-glow-cyan tracking-[0.2em]">LEADERBOARD</h1>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">LOADING DATA...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-primary/20 rounded-lg">
          NO SETTLED BETS YET — LEADERBOARD WILL POPULATE AFTER MATCHES FINISH
        </div>
      ) : (
        <div className="rounded-lg border border-primary/20 overflow-hidden glow-cyan">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 bg-primary/5">
                <TableHead className="text-primary w-16">RANK</TableHead>
                <TableHead className="text-primary">OPERATIVE</TableHead>
                <TableHead className="text-primary text-right">WINNINGS</TableHead>
                <TableHead className="text-primary text-right">WON</TableHead>
                <TableHead className="text-primary text-right">WIN RATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, i) => (
                <TableRow
                  key={entry.user_id}
                  className={`border-primary/10 ${i < 3 ? "bg-primary/5" : ""}`}
                >
                  <TableCell className="flex items-center justify-center">{rankIcon(i + 1)}</TableCell>
                  <TableCell className="font-bold">{entry.username}</TableCell>
                  <TableCell className="text-right font-bold text-accent text-glow-green">
                    {entry.total_winnings.toLocaleString()} TSH
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {entry.bets_won}/{entry.total_bets}
                  </TableCell>
                  <TableCell className="text-right text-sm">{entry.win_rate.toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
