import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Swords, Zap } from "lucide-react";

interface Props {
  match: Tables<"matches">;
}

export default function MatchCard({ match }: Props) {
  const { user, refreshProfile } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<"a" | "b" | null>(null);
  const [stake, setStake] = useState("");
  const [placing, setPlacing] = useState(false);

  const odds = selectedTeam === "a" ? match.odds_a : selectedTeam === "b" ? match.odds_b : 0;
  const payout = Number(stake) * odds;

  const statusColor: Record<string, string> = {
    UPCOMING: "bg-secondary text-secondary-foreground",
    LIVE: "bg-accent text-accent-foreground animate-pulse-glow",
    FINISHED: "bg-muted text-muted-foreground",
  };

  const placeBet = async () => {
    if (!user || !selectedTeam || !stake) return;
    setPlacing(true);
    try {
      const stakeNum = Number(stake);
      if (stakeNum <= 0) throw new Error("Invalid stake");

      // Check balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      if (!profile || profile.balance < stakeNum) throw new Error("INSUFFICIENT FUNDS");

      // Deduct balance
      const { error: balErr } = await supabase
        .from("profiles")
        .update({ balance: profile.balance - stakeNum })
        .eq("user_id", user.id);
      if (balErr) throw balErr;

      // Place bet
      const { error: betErr } = await supabase.from("bets").insert({
        user_id: user.id,
        match_id: match.id,
        team_picked: selectedTeam === "a" ? match.team_a : match.team_b,
        stake: stakeNum,
        potential_payout: payout,
      });
      if (betErr) throw betErr;

      toast.success(`BET PLACED — ${payout.toFixed(0)} TSH POTENTIAL PAYOUT`);
      setStake("");
      setSelectedTeam(null);
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const canBet = match.status !== "FINISHED";

  return (
    <Card className="glow-cyan border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className={statusColor[match.status]}>{match.status}</Badge>
          <span className="text-xs text-muted-foreground font-mono">{match.match_code}</span>
        </div>
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <span className="text-primary">{match.team_a}</span>
          <Swords className="w-4 h-4 text-muted-foreground" />
          <span className="text-secondary">{match.team_b}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canBet && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedTeam === "a" ? "default" : "outline"}
                onClick={() => setSelectedTeam("a")}
                className="flex flex-col h-auto py-2"
              >
                <span className="text-xs">{match.team_a}</span>
                <span className="font-bold text-lg">{match.odds_a}x</span>
              </Button>
              <Button
                variant={selectedTeam === "b" ? "default" : "outline"}
                onClick={() => setSelectedTeam("b")}
                className="flex flex-col h-auto py-2"
              >
                <span className="text-xs">{match.team_b}</span>
                <span className="font-bold text-lg">{match.odds_b}x</span>
              </Button>
            </div>

            {selectedTeam && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="STAKE (TSH)"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="bg-muted border-primary/30"
                />
                {Number(stake) > 0 && (
                  <div className="text-sm text-accent text-glow-green font-bold text-center">
                    POTENTIAL PAYOUT: {payout.toFixed(0)} TSH
                  </div>
                )}
                <Button onClick={placeBet} disabled={placing || !stake} className="w-full font-bold tracking-widest">
                  <Zap className="w-4 h-4" />
                  {placing ? "PROCESSING..." : "PLACE BET"}
                </Button>
              </div>
            )}
          </>
        )}
        {match.status === "FINISHED" && match.winner && (
          <div className="text-center text-accent text-glow-green font-bold">
            WINNER: {match.winner}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
