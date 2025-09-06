import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function MyPosts() {
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

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts/my"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/my"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
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
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (postId: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(postId);
    }
  };

  const openCreatePostModal = () => {
    const event = new CustomEvent('openCreatePostModal');
    window.dispatchEvent(event);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return "1 week ago";
    return `${diffInWeeks} weeks ago`;
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

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Posts</h1>
          <Button 
            onClick={openCreatePostModal}
            className="flex items-center gap-2"
            data-testid="button-new-post"
          >
            <span className="material-symbols-outlined">add</span>
            New Post
          </Button>
        </div>
        
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
                    <div className="w-16 h-8 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-4 block">description</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Share your thoughts and experiences with the community
              </p>
              <Button onClick={openCreatePostModal} data-testid="button-create-first-post">
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-${post.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-primary"
                        disabled
                      >
                        <span className="material-symbols-outlined">arrow_upward</span>
                      </Button>
                      <span className="font-bold text-sm" data-testid={`votes-${post.id}`}>{post.votes || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-destructive"
                        disabled
                      >
                        <span className="material-symbols-outlined">arrow_downward</span>
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-bold text-foreground" data-testid={`title-${post.id}`}>
                            {post.title}
                          </h2>
                          <p className="text-muted-foreground mt-1" data-testid={`excerpt-${post.id}`}>
                            {post.excerpt || post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-edit-${post.id}`}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-destructive"
                            onClick={() => handleDelete(post.id, post.title)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${post.id}`}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </Button>
                        </div>
                      </div>
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
                                data-testid={`tag-${tag.name.toLowerCase()}`}
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
