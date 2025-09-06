import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { path: "/", icon: "home", label: "Home" },
    { path: "/my-posts", icon: "description", label: "My Posts" },
    { path: "/doctors", icon: "group", label: "Doctors" },
    { path: "/analytics", icon: "analytics", label: "Analytics" },
    { path: "/chatbot", icon: "smart_toy", label: "AI Assistant" },
  ];

  const openCreatePostModal = () => {
    const event = new CustomEvent('openCreatePostModal');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-card border-r border-border p-6 flex flex-col justify-between" data-testid="sidebar">
      <div className="flex flex-col gap-8">
        {/* Logo and Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-foreground">self_improvement</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Mindful Space</h1>
          </div>
          <p className="text-sm text-muted-foreground">Your mental health companion</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`sidebar-link flex items-center gap-3 px-4 py-2 rounded-md font-medium transition-colors justify-start ${
                  isActive 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => navigate(item.path)}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2">
        <Button 
          onClick={openCreatePostModal}
          className="flex items-center gap-3 px-4 py-2 rounded-md bg-accent text-accent-foreground font-medium border border-accent/20 hover:bg-accent/90 transition-colors justify-start"
          data-testid="button-create-post"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Create Post</span>
        </Button>
        
        {(user as User) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-3">
              {(user as User).profileImageUrl ? (
                <img 
                  src={(user as User).profileImageUrl!} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-primary-foreground">person</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
                  {(user as User).firstName && (user as User).lastName 
                    ? `${(user as User).firstName} ${(user as User).lastName}` 
                    : (user as User).email?.split('@')[0] || 'User'
                  }
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="user-email">
                  {(user as User).email}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-md text-muted-foreground hover:bg-muted font-medium transition-colors mt-2 justify-start"
          data-testid="button-logout"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
