import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Instagram, Facebook, MessageCircle, Copy, Check, Download, Image } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const generateShareImage = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas size (Instagram story size)
      canvas.width = 1080;
      canvas.height = 1920;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f0f23");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.strokeStyle = "rgba(255, 165, 0, 0.1)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 200 + i * 80, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 72px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("My Whisky Profile", canvas.width / 2, 280);

      // Whisky glass emoji
      ctx.font = "120px serif";
      ctx.fillText("🥃", canvas.width / 2, 450);

      // Draw radar chart
      const centerX = canvas.width / 2;
      const centerY = 800;
      const radius = 280;
      const flavors = ["Fruit", "Floral", "Oak", "Smoke", "Spice"];
      const values = [
        flavorProfile.fruit,
        flavorProfile.floral,
        flavorProfile.oak,
        flavorProfile.smoke,
        flavorProfile.spice,
      ];

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 5; ring++) {
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * (radius * ring) / 5;
          const y = centerY + Math.sin(angle) * (radius * ring) / 5;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw spokes
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.stroke();
      }

      // Draw data polygon
      ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
      ctx.strokeStyle = "#ffa500";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const index = i % 5;
        const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
        const value = values[index] / 10;
        const x = centerX + Math.cos(angle) * radius * value;
        const y = centerY + Math.sin(angle) * radius * value;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const labelRadius = radius + 60;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius + 12;
        ctx.fillText(flavors[i], x, y);
      }

      // Score cards
      const cardY = 1200;
      const cardWidth = 180;
      const cardGap = 20;
      const totalWidth = 5 * cardWidth + 4 * cardGap;
      const startX = (canvas.width - totalWidth) / 2;

      flavors.forEach((flavor, i) => {
        const x = startX + i * (cardWidth + cardGap);
        
        // Card background
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.roundRect(x, cardY, cardWidth, 140, 16);
        ctx.fill();

        // Score
        ctx.fillStyle = "#ffa500";
        ctx.font = "bold 48px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(values[i].toFixed(1), x + cardWidth / 2, cardY + 60);

        // Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "24px Inter, system-ui, sans-serif";
        ctx.fillText(flavor, x + cardWidth / 2, cardY + 110);
      });

      // Top flavors insight
      const topFlavors = getTopFlavors();
      ctx.fillStyle = "#ffffff";
      ctx.font = "36px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `I prefer ${topFlavors[0].toLowerCase()} & ${topFlavors[1].toLowerCase()} notes`,
        canvas.width / 2,
        1450
      );

      // Branding
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "28px Inter, system-ui, sans-serif";
      ctx.fillText("Discover your whisky profile at", canvas.width / 2, 1700);
      ctx.fillStyle = "#ffa500";
      ctx.font = "bold 32px Inter, system-ui, sans-serif";
      ctx.fillText(getShareUrl().replace("https://", ""), canvas.width / 2, 1750);

      // Convert to data URL
      const imageUrl = canvas.toDataURL("image/png");
      setGeneratedImageUrl(imageUrl);
      setShowImageDialog(true);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement("a");
    link.download = "my-whisky-profile.png";
    link.href = generatedImageUrl;
    link.click();
    toast.success("Image downloaded!");
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

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleInstagramShare = async () => {
    await generateShareImage();
    toast.info("Download the image and share it on Instagram!", { duration: 4000 });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Try to share with image if available
        if (generatedImageUrl) {
          const response = await fetch(generatedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "whisky-profile.png", { type: "image/png" });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "My Whisky Profile",
              text: getShareText(),
              files: [file],
            });
            return;
          }
        }
        
        // Fallback to text-only share
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Share your profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={generateShareImage} 
            className="gap-2 cursor-pointer"
            disabled={isGenerating}
          >
            <Image className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Create shareable image"}
          </DropdownMenuItem>
          
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
            Social Media
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleInstagramShare} className="gap-2 cursor-pointer">
            <Instagram className="h-4 w-4" />
            Instagram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFacebookShare} className="gap-2 cursor-pointer">
            <Facebook className="h-4 w-4" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2 cursor-pointer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            Copy text to clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Shareable Profile</DialogTitle>
            <DialogDescription>
              Download this image to share on Instagram, stories, or anywhere!
            </DialogDescription>
          </DialogHeader>
          
          {generatedImageUrl && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={generatedImageUrl} 
                  alt="Whisky Profile Card" 
                  className="w-full h-auto"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleDownloadImage} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
                {supportsNativeShare && (
                  <Button variant="outline" onClick={handleNativeShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareProfileButton;
