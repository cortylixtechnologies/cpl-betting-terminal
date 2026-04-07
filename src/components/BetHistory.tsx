import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

export default function BetHistory() {
  const { user } = useAuth();
  const [bets, setBets] = useState<(Tables<"bets"> & { matches: Tables<"matches"> | null })[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bets")
        .select("*, matches(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBets((data as any) ?? []);
    };
    fetch();

    const channel = supabase
      .channel("my-bets")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statusStyle: Record<string, string> = {
    PENDING: "bg-secondary text-secondary-foreground",
    WON: "bg-accent text-accent-foreground",
    LOST: "bg-destructive text-destructive-foreground",
  };

  if (bets.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-primary text-glow-cyan tracking-widest">YOUR BETS</h2>
      <div className="rounded-lg border border-primary/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20">
              <TableHead className="text-primary">MATCH</TableHead>
              <TableHead className="text-primary">TEAM</TableHead>
              <TableHead className="text-primary">STAKE</TableHead>
              <TableHead className="text-primary">PAYOUT</TableHead>
              <TableHead className="text-primary">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => (
              <TableRow key={bet.id} className="border-primary/10">
                <TableCell className="font-mono text-sm">{bet.matches?.match_code ?? "—"}</TableCell>
                <TableCell>{bet.team_picked}</TableCell>
                <TableCell>{bet.stake.toLocaleString()} TSH</TableCell>
                <TableCell>{bet.potential_payout.toLocaleString()} TSH</TableCell>
                <TableCell>
                  <Badge className={statusStyle[bet.status]}>{bet.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
