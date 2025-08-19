import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart, MessageCircle, User, Calendar, Star, Plus, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  item_id: string;
  item_type: 'social_post' | 'tasting_note';
  user_id: string;
  username: string;
  display_name: string;
  content: string;
  whisky_name?: string;
  whisky_distillery?: string;
  rating?: number;
  image_url?: string;
  created_at: string;
  is_following: boolean;
  reaction_count: number;
  comment_count: number;
  user_reaction?: string;
}

export default function Feed() {
  const { user, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchFeed();
  }, [user, authLoading, navigate]);

  const fetchFeed = async () => {
    if (!user) return;
    
    try {
      // Try to use the get_user_feed function first
      const { data, error } = await (supabase as any).rpc('get_user_feed', {
        _user_id: user.id,
        _limit: 20,
        _offset: 0
      });

      if (error) {
        console.error('Feed function error:', error);
        // Fall back to basic posts query
        const { data: posts, error: postsError } = await (supabase as any)
          .from('social_posts')
          .select(`
            id,
            user_id,
            content,
            image_url,
            created_at,
            profiles!inner(username, display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (postsError) throw postsError;

        const formattedPosts: FeedItem[] = (posts || []).map(post => ({
          item_id: post.id,
          item_type: 'social_post' as const,
          user_id: post.user_id,
          username: (post.profiles as any)?.username || 'unknown',
          display_name: (post.profiles as any)?.display_name || 'Unknown User',
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          is_following: false,
          reaction_count: 0,
          comment_count: 0
        }));

        setFeedItems(formattedPosts);
      } else {
        setFeedItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!user || !postContent.trim() || posting) return;
    
    setPosting(true);
    
    try {
      const { error } = await (supabase as any)
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: postContent.trim(),
          post_type: 'general'
        });

      if (error) throw error;

      toast.success('Post created!');
      setPostContent("");
      setShowPostDialog(false);
      fetchFeed(); // Refresh feed
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (itemId: string, itemType: string, currentReaction?: string) => {
    if (!user || reactingTo) return;
    
    setReactingTo(itemId);
    
    try {
      if (currentReaction) {
        // Remove reaction
        const { error } = await (supabase as any)
          .from('post_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', itemId)
          .eq('target_type', itemType);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await (supabase as any)
          .from('post_reactions')
          .insert({
            user_id: user.id,
            target_id: itemId,
            target_type: itemType,
            reaction_type: 'like'
          });
        
        if (error) throw error;
      }

      // Update local state
      setFeedItems(items => items.map(item => 
        item.item_id === itemId 
          ? {
              ...item,
              user_reaction: currentReaction ? undefined : 'like',
              reaction_count: currentReaction 
                ? Math.max(0, item.reaction_count - 1) 
                : item.reaction_count + 1
            }
          : item
      ));

      toast.success(currentReaction ? 'Reaction removed' : 'Reaction added');
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setReactingTo(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-1/4 h-4 bg-muted rounded"></div>
                      <div className="w-3/4 h-4 bg-muted rounded"></div>
                      <div className="w-1/2 h-4 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Feed | Dram Discoverer</title>
        <meta name="description" content="See what whisky enthusiasts are tasting and sharing" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Feed</h1>
            <p className="text-muted-foreground">
              Discover what the community is tasting and sharing
            </p>
            
            {/* Post Creation */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      What's on your mind about whisky?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Share your whisky thoughts..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPostDialog(false)}
                          disabled={posting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={createPost}
                          disabled={!postContent.trim() || posting}
                        >
                          {posting ? (
                            "Posting..."
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Post
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {feedItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share something about whisky! 
                </p>
                <Button onClick={() => setShowPostDialog(true)}>
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {feedItems.map((item) => (
                <Card key={item.item_id} className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* User Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" alt={item.display_name} />
                          <AvatarFallback>
                            {item.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{item.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{item.username} • {formatTimeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                      {item.is_following && (
                        <Badge variant="secondary" className="text-xs">
                          Following
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    {item.item_type === 'tasting_note' && item.whisky_name && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Tasted</span>
                        </div>
                        <h4 className="font-semibold">
                          {item.whisky_distillery} {item.whisky_name}
                        </h4>
                        {item.rating && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-4 h-4 fill-current text-amber-500" />
                            <span className="text-sm font-medium">{item.rating}/5</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    </div>

                    {item.image_url && (
                      <div className="mb-4">
                        <img 
                          src={item.image_url} 
                          alt="Post image"
                          className="w-full max-h-96 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center space-x-2 ${
                          item.user_reaction ? 'text-red-500' : ''
                        }`}
                        onClick={() => handleReaction(item.item_id, item.item_type, item.user_reaction)}
                        disabled={reactingTo === item.item_id}
                      >
                        <Heart className={`w-4 h-4 ${item.user_reaction ? 'fill-current' : ''}`} />
                        <span>{item.reaction_count}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.comment_count}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}