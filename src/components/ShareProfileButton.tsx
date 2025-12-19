import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Instagram, Facebook, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface FlavorProfile {
  fruit: number;
  floral: number;
  oak: number;
  smoke: number;
  spice: number;
}

interface ShareProfileButtonProps {
  flavorProfile: FlavorProfile;
  username?: string;
}

const ShareProfileButton = ({ flavorProfile, username }: ShareProfileButtonProps) => {
  const [copied, setCopied] = useState(false);

  const getTopFlavors = () => {
    const entries = Object.entries(flavorProfile) as [keyof FlavorProfile, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([flavor]) => flavor.charAt(0).toUpperCase() + flavor.slice(1));
  };

  const getShareText = () => {
    const topFlavors = getTopFlavors();
    const scores = Object.entries(flavorProfile)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v.toFixed(1)}`)
      .join(" | ");
    
    return `🥃 My Whisky Profile\n\nI prefer ${topFlavors[0].toLowerCase()} and ${topFlavors[1].toLowerCase()} notes!\n\n${scores}\n\nDiscover your whisky preferences at`;
  };

  const getShareUrl = () => {
    return typeof window !== "undefined" ? window.location.origin : "";
  };

  const handleCopyLink = async () => {
    const text = `${getShareText()} ${getShareUrl()}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getShareUrl());
    const quote = encodeURIComponent(getShareText());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleFacebookMessenger = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://www.facebook.com/dialog/send?link=${url}&app_id=966242223397117&redirect_uri=${encodeURIComponent(getShareUrl())}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct web sharing - guide user
    const text = getShareText();
    navigator.clipboard.writeText(`${text} ${getShareUrl()}`).then(() => {
      toast.success("Text copied! Open Instagram to share as a Story or DM", {
        duration: 4000,
      });
    }).catch(() => {
      toast.info("Copy your profile text and share it on Instagram");
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Whisky Profile",
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Profile
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Share your profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare} className="gap-2 cursor-pointer">
              <Share2 className="h-4 w-4" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Post
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={handleInstagramShare} className="gap-2 cursor-pointer">
          <Instagram className="h-4 w-4" />
          Instagram Story
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" />
          Facebook Post
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Message
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookMessenger} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" />
          Messenger
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          Copy to clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareProfileButton;
