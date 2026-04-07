import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Trophy, Shield, Gamepad2, Wallet } from "lucide-react";

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const navLink = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold tracking-wider transition-all ${
        location.pathname === to
          ? "text-primary glow-cyan bg-primary/10"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <nav className="border-b border-primary/20 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-primary text-glow-cyan tracking-[0.2em]">CPL</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink("/", "MATCHES", <Gamepad2 className="w-4 h-4" />)}
          {navLink("/leaderboard", "LEADERBOARD", <Trophy className="w-4 h-4" />)}
          {isAdmin && navLink("/admin", "ADMIN", <Shield className="w-4 h-4" />)}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-accent/30 bg-accent/10">
            <Wallet className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm text-glow-green">
              {profile?.balance?.toLocaleString() ?? "0"} TSH
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{profile?.username}</span>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-destructive hover:text-destructive/80">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
