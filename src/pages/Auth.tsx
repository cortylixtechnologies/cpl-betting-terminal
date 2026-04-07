import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Shield, Zap } from "lucide-react";

export default function Auth() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("ACCESS GRANTED");
      } else {
        await signUp(email, password, username);
        toast.success("ACCOUNT CREATED — 10,000 TSH CREDITED");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 scanline">
      <Card className="w-full max-w-md glow-cyan border-primary/30">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-primary animate-pulse-glow" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary text-glow-cyan tracking-widest">
            CPL TERMINAL
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "AUTHENTICATE TO ACCESS" : "REGISTER NEW OPERATIVE"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="CALLSIGN (username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-muted border-primary/30 text-foreground placeholder:text-muted-foreground"
              />
            )}
            <Input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted border-primary/30 text-foreground placeholder:text-muted-foreground"
            />
            <Input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted border-primary/30 text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" disabled={submitting} className="w-full font-bold tracking-widest">
              <Zap className="w-4 h-4" />
              {submitting ? "PROCESSING..." : isLogin ? "LOGIN" : "REGISTER"}
            </Button>
          </form>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="mt-4 w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {isLogin ? "NEW OPERATIVE? REGISTER HERE" : "ALREADY REGISTERED? LOGIN"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
