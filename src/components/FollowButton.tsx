import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { useFollow } from "@/hooks/useFollow";
import { useAuthSession } from "@/hooks/useAuthSession";

interface FollowButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function FollowButton({ userId, variant = "default", size = "default" }: FollowButtonProps) {
  const { user } = useAuthSession();
  const { stats, following, toggleFollow } = useFollow(userId);

  // Don't show follow button for own profile
  if (!user || user.id === userId) {
    return null;
  }

  return (
    <Button
      variant={stats.isFollowing ? "outline" : variant}
      size={size}
      onClick={toggleFollow}
      disabled={following}
      className="flex items-center space-x-2"
    >
      {stats.isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}