import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CreatePostModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/my"] });
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      handleClose();
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
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('openCreatePostModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openCreatePostModal', handleOpenModal);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setTitle("");
    setContent("");
    setTags("");
    setIsAnonymous(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      tags: tagArray,
      isAnonymous,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <Card className="w-full max-w-2xl mx-4 animate-fade-in" data-testid="create-post-modal">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Create New Post</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            data-testid="button-close-modal"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                maxLength={255}
                data-testid="input-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, experiences, or questions..."
                rows={6}
                className="resize-none"
                data-testid="textarea-content"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., anxiety, stress, self-care)"
                data-testid="input-tags"
              />
              <p className="text-xs text-muted-foreground">
                Use tags to help others find your post
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymous" 
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                data-testid="checkbox-anonymous"
              />
              <Label htmlFor="anonymous" className="text-sm text-muted-foreground">
                Post anonymously
              </Label>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createPostMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createPostMutation.isPending}
                data-testid="button-create-post"
              >
                {createPostMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
