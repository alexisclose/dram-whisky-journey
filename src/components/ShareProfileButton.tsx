import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Share2, 
  Download, 
  Copy, 
  Check,
  Mail,
  MessageCircle,
  Link2
} from "lucide-react";
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

// Social platform icons as SVG components
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const ShareProfileButton = ({ flavorProfile, username }: ShareProfileButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const getTopFlavors = () => {
    const entries = Object.entries(flavorProfile) as [keyof FlavorProfile, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([flavor]) => flavor.charAt(0).toUpperCase() + flavor.slice(1));
  };

  const getShareText = () => {
    const topFlavors = getTopFlavors();
    return `🥃 My Whisky Profile: I prefer ${topFlavors[0].toLowerCase()} and ${topFlavors[1].toLowerCase()} notes! Discover yours at`;
  };

  const getShareUrl = () => {
    return typeof window !== "undefined" ? window.location.origin : "";
  };

  const generateShareImage = async () => {
    if (generatedImageUrl) return; // Already generated
    
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

      // Add decorative circles
      ctx.strokeStyle = "rgba(255, 165, 0, 0.08)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 150 + i * 100, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("My Whisky Profile", canvas.width / 2, 280);

      // Whisky glass emoji
      ctx.font = "140px serif";
      ctx.fillText("🥃", canvas.width / 2, 480);

      // Draw radar chart
      const centerX = canvas.width / 2;
      const centerY = 820;
      const radius = 300;
      const flavors = ["Fruit", "Floral", "Oak", "Smoke", "Spice"];
      const values = [
        flavorProfile.fruit,
        flavorProfile.floral,
        flavorProfile.oak,
        flavorProfile.smoke,
        flavorProfile.spice,
      ];

      // Draw grid rings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
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
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      }

      // Draw data polygon with glow
      ctx.shadowColor = "rgba(255, 165, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(255, 165, 0, 0.25)";
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
      ctx.shadowBlur = 0;

      // Draw labels
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const labelRadius = radius + 70;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius + 14;
        ctx.fillText(flavors[i], x, y);
      }

      // Score cards row
      const cardY = 1240;
      const cardWidth = 170;
      const cardGap = 16;
      const totalWidth = 5 * cardWidth + 4 * cardGap;
      const startX = (canvas.width - totalWidth) / 2;

      flavors.forEach((flavor, i) => {
        const x = startX + i * (cardWidth + cardGap);
        
        // Card background
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.roundRect(x, cardY, cardWidth, 130, 16);
        ctx.fill();

        // Score
        ctx.fillStyle = "#ffa500";
        ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(values[i].toFixed(1), x + cardWidth / 2, cardY + 55);

        // Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "22px system-ui, -apple-system, sans-serif";
        ctx.fillText(flavor, x + cardWidth / 2, cardY + 100);
      });

      // Top flavors insight
      const topFlavors = getTopFlavors();
      ctx.fillStyle = "#ffffff";
      ctx.font = "38px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `I prefer ${topFlavors[0].toLowerCase()} & ${topFlavors[1].toLowerCase()} notes`,
        canvas.width / 2,
        1480
      );

      // Divider line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 200, 1560);
      ctx.lineTo(canvas.width / 2 + 200, 1560);
      ctx.stroke();

      // Branding
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Discover your whisky profile", canvas.width / 2, 1680);
      ctx.fillStyle = "#ffa500";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(getShareUrl().replace("https://", "").replace("http://", ""), canvas.width / 2, 1740);

      // Convert to data URL
      const imageUrl = canvas.toDataURL("image/png");
      setGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image when dialog opens
  useEffect(() => {
    if (isOpen && !generatedImageUrl) {
      generateShareImage();
    }
  }, [isOpen]);

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement("a");
    link.download = "my-whisky-profile.png";
    link.href = generatedImageUrl;
    link.click();
    toast.success("Image downloaded!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${getShareText()} ${getShareUrl()}`);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToInstagram = () => {
    handleDownloadImage();
    toast.info("Image downloaded! Open Instagram to share it.", { duration: 4000 });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Check out my Whisky Profile!");
    const body = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    
    try {
      if (generatedImageUrl) {
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], "whisky-profile.png", { type: "image/png" });
        
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "My Whisky Profile",
            text: getShareText(),
            files: [file],
          });
          return;
        }
      }
      
      await navigator.share({
        title: "My Whisky Profile",
        text: getShareText(),
        url: getShareUrl(),
      });
    } catch {
      // User cancelled
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const socialButtons = [
    { icon: <InstagramIcon />, label: "Instagram", onClick: shareToInstagram, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
    { icon: <WhatsAppIcon />, label: "WhatsApp", onClick: shareToWhatsApp, color: "bg-[#25D366]" },
    { icon: <FacebookIcon />, label: "Facebook", onClick: shareToFacebook, color: "bg-[#1877F2]" },
    { icon: <TwitterIcon />, label: "X", onClick: shareToTwitter, color: "bg-black" },
    { icon: <TelegramIcon />, label: "Telegram", onClick: shareToTelegram, color: "bg-[#0088cc]" },
    { icon: <LinkedInIcon />, label: "LinkedIn", onClick: shareToLinkedIn, color: "bg-[#0A66C2]" },
    { icon: <Mail className="h-5 w-5" />, label: "Email", onClick: shareViaEmail, color: "bg-gray-600" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Message", onClick: handleNativeShare, color: "bg-green-600", hidden: !supportsNativeShare },
  ];

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-center">Share Your Profile</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-4 space-y-4">
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden border bg-muted aspect-[9/16] max-h-[320px]">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : generatedImageUrl ? (
                <img 
                  src={generatedImageUrl} 
                  alt="Whisky Profile Card" 
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* Download Button */}
            <Button 
              onClick={handleDownloadImage} 
              className="w-full gap-2" 
              disabled={!generatedImageUrl}
            >
              <Download className="h-4 w-4" />
              Save Image
            </Button>

            {/* Social Share Grid */}
            <div className="grid grid-cols-4 gap-3">
              {socialButtons.filter(b => !b.hidden).map((button) => (
                <button
                  key={button.label}
                  onClick={button.onClick}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-transform hover:scale-105 active:scale-95 ${button.color} text-white`}
                >
                  {button.icon}
                  <span className="text-[10px] font-medium">{button.label}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareProfileButton;
