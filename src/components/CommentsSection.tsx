import { useState, useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface CommentsSectionProps {
  targetId: string;
  targetType: string;
  commentCount: number;
  onCommentCountChange: (newCount: number) => void;
}

export function CommentsSection({ 
  targetId, 
  targetType, 
  commentCount, 
  onCommentCountChange 
}: CommentsSectionProps) {
  const { user } = useAuthSession();
  const { profile } = useUserProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchComments();
    }
  }, [expanded, targetId, targetType]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profiles separately for comments
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))].filter(Boolean) as string[];
      let profiles = [];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, first_name, last_name')
          .in('user_id', userIds);
        
        profiles = profilesData || [];
      }

      const enrichedComments = (data || []).map(comment => {
        const profile = profiles.find(p => p.user_id === comment.user_id);
        const displayName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.display_name || 'Unknown User';
        
        return {
          ...comment,
          profiles: {
            username: profile?.username || 'unknown',
            display_name: displayName,
            avatar_url: profile?.avatar_url
          }
        };
      });

      setComments(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim() || posting) return;

    setPosting(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comments')
        .insert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          content: newComment.trim()
        })
        .select('id, content, created_at, user_id')
        .single();

      if (error) throw error;

      // Get the user's profile for the new comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const displayName = profileData?.first_name && profileData?.last_name 
        ? `${profileData.first_name} ${profileData.last_name}`
        : profileData?.display_name || 'Unknown User';

      const enrichedComment = {
        ...data,
        profiles: {
          username: profileData?.username || 'unknown',
          display_name: displayName,
          avatar_url: profileData?.avatar_url
        }
      };

      setComments(prev => [...prev, enrichedComment]);
      setNewComment("");
      onCommentCountChange(commentCount + 1);
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentCountChange(Math.max(0, commentCount - 1));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>{commentCount}</span>
          <span className="text-xs">
            {commentCount === 0 ? 'Comment' : commentCount === 1 ? 'Comment' : 'Comments'}
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-4 space-y-4">
          {/* Comment Input */}
          {user && (
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" alt="You" />
                <AvatarFallback className="text-xs">
                  {profile?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={addComment}
                    disabled={!newComment.trim() || posting}
                    size="sm"
                  >
                    {posting ? (
                      "Posting..."
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-1/4 h-3 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No comments yet. {user ? 'Be the first to comment!' : 'Log in to comment.'}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={comment.profiles.avatar_url || ""} 
                      alt={comment.profiles.display_name} 
                    />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {comment.profiles.display_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              @{comment.profiles.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          {user && user.id === comment.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteComment(comment.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}