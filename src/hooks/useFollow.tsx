import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "./useAuthSession";
import { toast } from "sonner";

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export function useFollow(targetUserId?: string) {
  const { user } = useAuthSession();
  const [stats, setStats] = useState<FollowStats>({
    followerCount: 0,
    followingCount: 0,
    isFollowing: false
  });
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    fetchFollowStats();
  }, [targetUserId, user]);

  const fetchFollowStats = async () => {
    if (!targetUserId) return;
    
    try {
      // Use type assertion to work around missing types
      const { count: followerCount } = await (supabase as any)
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      const { count: followingCount } = await (supabase as any)
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      let isFollowing = false;
      if (user && user.id !== targetUserId) {
        const { data } = await (supabase as any)
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();
        
        isFollowing = !!data;
      }

      setStats({
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        isFollowing
      });
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async () => {
    if (!user || !targetUserId || following || user.id === targetUserId) return;
    
    setFollowing(true);
    
    try {
      const { error } = await (supabase as any)
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        isFollowing: true,
        followerCount: prev.followerCount + 1
      }));

      toast.success('Following user');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowing(false);
    }
  };

  const unfollowUser = async () => {
    if (!user || !targetUserId || following || user.id === targetUserId) return;
    
    setFollowing(true);
    
    try {
      const { error } = await (supabase as any)
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        isFollowing: false,
        followerCount: Math.max(0, prev.followerCount - 1)
      }));

      toast.success('Unfollowed user');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    } finally {
      setFollowing(false);
    }
  };

  const toggleFollow = () => {
    if (stats.isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  return {
    stats,
    loading,
    following,
    followUser,
    unfollowUser,
    toggleFollow
  };
}