import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["/api/tags"],
    enabled: isAuthenticated,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, voteType }: { postId: number; voteType: 'up' | 'down' }) => {
      await apiRequest("POST", `/api/posts/${postId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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
        description: "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (postId: number, voteType: 'up' | 'down') => {
    voteMutation.mutate({ postId, voteType });
  };

  const filteredPosts = posts.filter((post: any) => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || 
      post.tags?.some((tag: any) => tag.name === selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getTagColor = (tagName: string) => {
    const colors = {
      'Anxiety': 'bg-green-100 text-green-700',
      'Depression': 'bg-purple-100 text-purple-700',
      'Stress': 'bg-blue-100 text-blue-700',
      'Mindfulness': 'bg-yellow-100 text-yellow-700',
      'Self-Care': 'bg-pink-100 text-pink-700',
      'Therapy': 'bg-indigo-100 text-indigo-700',
    };
    return colors[tagName as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
            <Input 
              className="pl-10"
              placeholder="Search posts, topics, or discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Topic Tags */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <Button
            variant={selectedTag === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag("")}
            data-testid="tag-all"
          >
            All Topics
          </Button>
          {tags.map((tag: any) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(selectedTag === tag.name ? "" : tag.name)}
              className="whitespace-nowrap"
              data-testid={`tag-${tag.name.toLowerCase()}`}
            >
              {tag.name}
            </Button>
          ))}
        </div>

        {/* Community Posts */}
        {postsLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-16 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-4 block">forum</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag 
                  ? "Try adjusting your search or filters"
                  : "Be the first to share your thoughts with the community"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-${post.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-primary"
                        onClick={() => handleVote(post.id, 'up')}
                        disabled={voteMutation.isPending}
                        data-testid={`button-upvote-${post.id}`}
                      >
                        <span className="material-symbols-outlined">arrow_upward</span>
                      </Button>
                      <span className="font-bold text-sm" data-testid={`votes-${post.id}`}>{post.votes || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-destructive"
                        onClick={() => handleVote(post.id, 'down')}
                        disabled={voteMutation.isPending}
                        data-testid={`button-downvote-${post.id}`}
                      >
                        <span className="material-symbols-outlined">arrow_downward</span>
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-foreground" data-testid={`title-${post.id}`}>
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground mt-1" data-testid={`excerpt-${post.id}`}>
                        {post.excerpt || post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                          <span data-testid={`comments-${post.id}`}>{post.commentCount || 0} Comments</span>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            {post.tags.map((tag: any) => (
                              <Badge 
                                key={tag.id} 
                                variant="secondary" 
                                className={getTagColor(tag.name)}
                                data-testid={`tag-badge-${tag.name.toLowerCase()}`}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <span data-testid={`time-${post.id}`}>{getTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
