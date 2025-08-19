import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Users, TrendingUp, MapPin, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/FollowButton";
import { useNavigate } from "react-router-dom";

interface UserSuggestion {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  mutual_follows: number;
  taste_similarity: number;
}

interface TrendingPost {
  id: string;
  content: string;
  user_id: string;
  username: string;
  display_name: string;
  reaction_count: number;
  comment_count: number;
  created_at: string;
}

export default function Discover() {
  const { user, loading: authLoading } = useAuthSession();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchDiscoveryData();
  }, [user, authLoading, navigate]);

  const fetchDiscoveryData = async () => {
    if (!user) return;

    try {
      // Fetch user suggestions (simplified)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .neq('user_id', user.id)
        .limit(5);

      if (usersError) throw usersError;

      const formattedSuggestions: UserSuggestion[] = (usersData || []).map(profile => ({
        user_id: profile.user_id,
        username: profile.username || 'unknown',
        display_name: profile.display_name || 'Unknown User',
        avatar_url: profile.avatar_url,
        mutual_follows: 0,
        taste_similarity: Math.floor(Math.random() * 100) // Placeholder
      }));

      setSuggestions(formattedSuggestions);

      // Fetch trending posts (simplified)
      const { data: postsData, error: postsError } = await (supabase as any)
        .from('social_posts')
        .select(`
          id,
          content,
          user_id,
          created_at,
          profiles!inner(username, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      const formattedPosts: TrendingPost[] = (postsData || []).map(post => ({
        id: post.id,
        content: post.content,
        user_id: post.user_id,
        username: (post.profiles as any)?.username || 'unknown',
        display_name: (post.profiles as any)?.display_name || 'Unknown User',
        reaction_count: Math.floor(Math.random() * 20), // Placeholder
        comment_count: Math.floor(Math.random() * 10), // Placeholder
        created_at: post.created_at
      }));

      setTrendingPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching discovery data:', error);
      toast.error('Failed to load discovery data');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('user_id', user?.id || '')
        .limit(10);

      if (error) throw error;

      const formattedResults: UserSuggestion[] = (data || []).map(profile => ({
        user_id: profile.user_id,
        username: profile.username || 'unknown',
        display_name: profile.display_name || 'Unknown User',
        avatar_url: profile.avatar_url,
        mutual_follows: 0,
        taste_similarity: 0
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers();
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-6 w-32 bg-muted rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Discover | Dram Discoverer</title>
        <meta name="description" content="Discover new whisky enthusiasts and trending content" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discover</h1>
            <p className="text-muted-foreground">
              Find new whisky friends and explore trending content
            </p>
          </div>

          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                <Input
                  placeholder="Search by username or display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Search Results</h3>
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            className="cursor-pointer"
                            onClick={() => navigate(`/user/${user.user_id}`)}
                          >
                            <AvatarImage src={user.avatar_url || ""} alt={user.display_name} />
                            <AvatarFallback>
                              {user.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <FollowButton userId={user.user_id} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>People You May Know</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No suggestions available yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.user_id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            className="cursor-pointer"
                            onClick={() => navigate(`/user/${suggestion.user_id}`)}
                          >
                            <AvatarImage
                              src={suggestion.avatar_url || ""}
                              alt={suggestion.display_name}
                            />
                            <AvatarFallback>
                              {suggestion.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{suggestion.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{suggestion.username}
                            </p>
                            {suggestion.taste_similarity > 70 && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Similar taste profile
                              </Badge>
                            )}
                          </div>
                        </div>
                        <FollowButton userId={suggestion.user_id} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trending Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Trending Posts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendingPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No trending posts yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {trendingPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => navigate('/feed')}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-sm">{post.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            @{post.username}
                          </span>
                        </div>
                        <p className="text-sm mb-2 line-clamp-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.reaction_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{post.comment_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}