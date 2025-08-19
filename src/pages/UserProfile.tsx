import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/FollowButton";
import { formatDistanceToNow } from "date-fns";

interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

interface UserPost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  post_type: string;
}

interface UserTastingNote {
  id: string;
  content: string;
  rating?: number;
  created_at: string;
  whisky: {
    name: string;
    distillery: string;
  };
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthSession();
  const navigate = useNavigate();
  const { stats, loading: followLoading } = useFollow(userId);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [tastingNotes, setTastingNotes] = useState<UserTastingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'tastings'>('posts');

  useEffect(() => {
    if (!userId) {
      navigate('/feed');
      return;
    }
    fetchUserProfile();
    fetchUserActivity();
  }, [userId, navigate]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      navigate('/feed');
    }
  };

  const fetchUserActivity = async () => {
    if (!userId) return;

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await (supabase as any)
        .from('social_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch tasting notes with whisky info
      const { data: tastingData, error: tastingError } = await supabase
        .from('tasting_notes')
        .select(`
          id,
          note,
          rating,
          created_at,
          whiskies (
            name,
            distillery
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tastingError) throw tastingError;
      
      const formattedTastingNotes = (tastingData || []).map(note => ({
        id: note.id,
        content: note.note || '',
        rating: note.rating,
        created_at: note.created_at,
        whisky: {
          name: (note.whiskies as any)?.name || 'Unknown',
          distillery: (note.whiskies as any)?.distillery || 'Unknown'
        }
      }));

      setTastingNotes(formattedTastingNotes);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast.error('Failed to load user activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-32 h-6 bg-muted rounded"></div>
                  <div className="w-24 h-4 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button onClick={() => navigate('/feed')}>
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile.display_name} | Dram Discoverer</title>
        <meta name="description" content={`View ${profile.display_name}'s whisky profile and activity`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                    <AvatarFallback className="text-2xl">
                      {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
                    <p className="text-muted-foreground mb-4">@{profile.username}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{stats.followerCount} followers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{stats.followingCount} following</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatTimeAgo(profile.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <FollowButton userId={userId!} />
              </div>
            </CardContent>
          </Card>

          {/* Activity Tabs */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('posts')}
            >
              Posts ({posts.length})
            </Button>
            <Button
              variant={activeTab === 'tastings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tastings')}
            >
              Tastings ({tastingNotes.length})
            </Button>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            {activeTab === 'posts' && (
              <>
                {posts.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground">
                        {profile.display_name} hasn't shared any posts yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{profile.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt="Post image"
                            className="w-full max-h-96 object-cover rounded-lg"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}

            {activeTab === 'tastings' && (
              <>
                {tastingNotes.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No tasting notes yet</h3>
                      <p className="text-muted-foreground">
                        {profile.display_name} hasn't shared any tasting notes yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tastingNotes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{profile.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(note.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg mb-4">
                          <h4 className="font-semibold mb-2">
                            {note.whisky.distillery} {note.whisky.name}
                          </h4>
                          {note.rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium">Rating: {note.rating}/5</span>
                            </div>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}