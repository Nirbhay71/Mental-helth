import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = () => {
    window.location.href = "/api/login";
  };

  if (isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-primary/10">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-lg border border-border shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-foreground">self_improvement</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">Mindful</h1>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Welcome Back</h2>
              <p className="text-muted-foreground text-center">Enter your credentials to access your account.</p>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">email</span>
                <Input 
                  className="pl-10" 
                  placeholder="Email" 
                  type="email"
                  data-testid="input-email"
                />
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">lock</span>
                <Input 
                  className="pl-10" 
                  placeholder="Password" 
                  type="password"
                  data-testid="input-password"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember-me" data-testid="checkbox-remember" />
                  <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="text-sm text-primary hover:text-primary/80" data-testid="link-forgot-password">
                  Forgot Password?
                </Button>
              </div>
              <Button 
                onClick={handleAuth} 
                className="w-full"
                data-testid="button-login"
              >
                Log In
              </Button>
            </div>
            
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold text-primary hover:text-primary/80" 
                onClick={() => setIsLogin(false)}
                data-testid="link-signup"
              >
                Sign Up
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-10 py-4">
        <div className="flex items-center gap-3 text-foreground">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-foreground">self_improvement</span>
          </div>
          <h1 className="text-xl font-bold">Mindful</h1>
        </div>
        <nav className="flex items-center gap-8">
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#" data-testid="link-home">Home</a>
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#" data-testid="link-about">About</a>
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#" data-testid="link-community">Community</a>
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#" data-testid="link-resources">Resources</a>
        </nav>
        <Button 
          onClick={() => setIsLogin(true)}
          variant="secondary"
          data-testid="button-login-header"
        >
          Log In
        </Button>
      </header>

      <main className="flex flex-1 justify-center items-center py-12 px-4">
        <Card className="w-full max-w-md shadow-lg border border-border animate-fade-in">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">Create an account</h2>
              <p className="mt-2 text-sm text-muted-foreground">Join our community for mental well-being.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">mail</span>
                  <Input 
                    id="email" 
                    className="pl-10" 
                    placeholder="you@example.com" 
                    type="email"
                    data-testid="input-register-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">lock</span>
                  <Input 
                    id="password" 
                    className="pl-10" 
                    placeholder="••••••••" 
                    type="password"
                    data-testid="input-register-password"
                  />
                </div>
                <p className="text-xs text-accent flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> 
                  Password is strong.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">lock_reset</span>
                  <Input 
                    id="confirm-password" 
                    className="pl-10" 
                    placeholder="••••••••" 
                    type="password"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAuth} 
                className="w-full"
                data-testid="button-signup"
              >
                Sign Up
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-medium text-primary hover:underline" 
                    onClick={() => setIsLogin(true)}
                    data-testid="link-login"
                  >
                    Log in
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
