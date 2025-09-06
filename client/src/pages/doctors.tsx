import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Doctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ["/api/doctors", selectedSpecialization],
    enabled: isAuthenticated,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ doctorId, message }: { doctorId: number; message: string }) => {
      await apiRequest("POST", `/api/doctors/${doctorId}/connect`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Connection request sent successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (doctorId: number, doctorName: string) => {
    const message = `Hi Dr. ${doctorName}, I would like to connect with you for mental health support.`;
    connectMutation.mutate({ doctorId, message });
  };

  const filteredDoctors = doctors.filter((doctor: any) => {
    const matchesSearch = !searchQuery || 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const getNextAvailable = (doctor: any) => {
    if (!doctor.isAvailable) return "Not available";
    if (!doctor.nextAvailable) return "Available now";
    
    const date = new Date(doctor.nextAvailable);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Find a Doctor</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our directory of registered doctors specializing in mental health. Request a connection or help directly from their profile.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
            <Input 
              className="pl-10"
              placeholder="Search doctors by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-doctors"
            />
          </div>
          <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
            <SelectTrigger className="w-64" data-testid="select-specialization">
              <SelectValue placeholder="All Specializations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specializations</SelectItem>
              <SelectItem value="Anxiety & Depression">Anxiety & Depression</SelectItem>
              <SelectItem value="Trauma & PTSD">Trauma & PTSD</SelectItem>
              <SelectItem value="Child & Adolescent">Child & Adolescent</SelectItem>
              <SelectItem value="Addiction & Recovery">Addiction & Recovery</SelectItem>
              <SelectItem value="Couples & Family">Couples & Family</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {doctorsLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                    <div className="h-8 bg-muted rounded w-full mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-4 block">group</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">No doctors found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedSpecialization 
                  ? "Try adjusting your search or filters"
                  : "No doctors are currently available"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor: any) => (
              <Card key={doctor.id} className="doctor-card overflow-hidden" data-testid={`doctor-${doctor.id}`}>
                <div className="h-48 w-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  {doctor.profileImageUrl ? (
                    <img 
                      src={doctor.profileImageUrl} 
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground" data-testid={`name-${doctor.id}`}>
                    {doctor.name}
                  </h3>
                  <p className="mt-1 text-sm text-primary" data-testid={`specialization-${doctor.id}`}>
                    {doctor.specialization}
                  </p>
                  <div className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Experience:</span>{" "}
                      <span data-testid={`experience-${doctor.id}`}>{doctor.experience} years</span>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Rating:</span>{" "}
                      <span data-testid={`rating-${doctor.id}`}>{formatRating(doctor.rating || 45)}/5.0</span>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Availability:</span>{" "}
                      <span data-testid={`availability-${doctor.id}`}>{getNextAvailable(doctor)}</span>
                    </p>
                  </div>
                  <Button 
                    className="mt-6 w-full"
                    onClick={() => handleConnect(doctor.id, doctor.name)}
                    disabled={connectMutation.isPending || !doctor.isAvailable}
                    data-testid={`button-connect-${doctor.id}`}
                  >
                    {connectMutation.isPending ? "Sending..." : "Request Connection"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
