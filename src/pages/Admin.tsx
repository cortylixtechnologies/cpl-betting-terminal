import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { Shield, CheckCircle } from "lucide-react";

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const [matches, setMatches] = useState<Tables<"matches">[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("matches").select("*").order("created_at");
      setMatches(data ?? []);
    };
    fetch();
  }, []);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const updateStatus = async (matchId: string, status: "UPCOMING" | "LIVE" | "FINISHED") => {
    const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
    if (error) return toast.error(error.message);
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status } : m)));
    toast.success(`MATCH STATUS → ${status}`);
  };

  const settleBets = async (matchId: string, winner: string) => {
    // Set winner on match
    const { error: matchErr } = await supabase
      .from("matches")
      .update({ winner, status: "FINISHED" as const })
      .eq("id", matchId);
    if (matchErr) return toast.error(matchErr.message);

    // Get all pending bets for this match
    const { data: bets } = await supabase
      .from("bets")
      .select("*")
      .eq("match_id", matchId)
      .eq("status", "PENDING");

    if (!bets) return;

    for (const bet of bets) {
      const won = bet.team_picked === winner;
      // Update bet status
      await supabase
        .from("bets")
        .update({ status: won ? ("WON" as const) : ("LOST" as const) })
        .eq("id", bet.id);

      // Credit winners
      if (won) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("user_id", bet.user_id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ balance: profile.balance + bet.potential_payout })
            .eq("user_id", bet.user_id);
        }
      }
    }

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, winner, status: "FINISHED" as const } : m))
    );
    toast.success(`BETS SETTLED — WINNER: ${winner}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 scanline">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-primary text-glow-cyan tracking-[0.2em]">ADMIN PANEL</h1>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">
                  {match.match_code}: {match.team_a} vs {match.team_b}
                </CardTitle>
                <Badge>{match.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">STATUS:</span>
                <Select
                  value={match.status}
                  onValueChange={(v) => updateStatus(match.id, v as any)}
                >
                  <SelectTrigger className="w-40 bg-muted border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                    <SelectItem value="LIVE">LIVE</SelectItem>
                    <SelectItem value="FINISHED">FINISHED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!match.winner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => settleBets(match.id, match.team_a)}
                    className="border-accent/30 text-accent hover:bg-accent/10"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {match.team_a} WINS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => settleBets(match.id, match.team_b)}
                    className="border-secondary/30 text-secondary hover:bg-secondary/10"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {match.team_b} WINS
                  </Button>
                </div>
              )}

              {match.winner && (
                <div className="text-accent text-glow-green font-bold">WINNER: {match.winner}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
