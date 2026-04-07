import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MatchCard from "@/components/MatchCard";
import BetHistory from "@/components/BetHistory";
import type { Tables } from "@/integrations/supabase/types";
import { Gamepad2 } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Tables<"matches">[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("matches").select("*").order("created_at");
      setMatches(data ?? []);
    };
    fetch();

    const channel = supabase
      .channel("matches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8 scanline">
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-primary text-glow-cyan tracking-[0.2em]">ACTIVE MATCHES</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>

      {user && <BetHistory />}
    </div>
  );
}
