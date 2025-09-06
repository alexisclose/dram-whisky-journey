import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Upload, Search } from "lucide-react";

interface AdminImageOverlayProps {
  src: string;
  alt?: string;
  className?: string;
  onImageChange?: (newUrl: string) => void;
  children?: React.ReactNode;
}

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  bucket_name: string;
  category: string;
  alt_text: string;
}

export function AdminImageOverlay({ 
  src, 
  alt, 
  className = "", 
  onImageChange,
  children 
}: AdminImageOverlayProps) {
  const { isAdmin } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update currentSrc when src prop changes
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const { data: mediaItems = [] } = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: showModal,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be logged in to upload images");
      }

      console.log("User authenticated:", user.id);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `admin/${fileName}`;

      console.log("Uploading file:", fileName);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("whisky-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded to storage, now adding to database");

      // Add to media library using admin function to bypass RLS
      const { data: result, error: dbError } = await supabase
        .rpc('admin_insert_media', {
          p_filename: fileName,
          p_original_name: file.name,
          p_file_path: filePath,
          p_bucket_name: "whisky-images",
          p_file_size: file.size,
          p_mime_type: file.type,
          p_category: "general",
          p_user_id: user.id
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log("Successfully inserted into database with ID:", result);
      
      // Return a media item structure for the UI
      return {
        id: result,
        filename: fileName,
        file_path: filePath,
        bucket_name: "whisky-images",
        category: "general",
        alt_text: null,
        original_name: file.name
      };
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
      const newUrl = getImageUrl(newItem);
      setCurrentSrc(newUrl);
      onImageChange?.(newUrl);
      setShowModal(false);
      toast({ title: "Image uploaded and replaced successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getImageUrl = (item: MediaItem) => {
    const { data } = supabase.storage
      .from(item.bucket_name)
      .getPublicUrl(item.file_path);
    return data.publicUrl;
  };

  const handleImageSelect = (item: MediaItem) => {
    const newUrl = getImageUrl(item);
    setCurrentSrc(newUrl);
    onImageChange?.(newUrl);
    setShowModal(false);
    toast({ title: "Image replaced successfully" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(mediaItems.map(item => item.category)))];

  if (!isAdmin) {
    return children || <img src={currentSrc} alt={alt} className={className} />;
  }

  return (
    <>
      <div className="relative group">
        {children || <img src={currentSrc} alt={alt} className={className} />}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Replace Image
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Replace Image</DialogTitle>
            <DialogDescription>
              Choose an existing image from the media library or upload a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload New"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="cursor-pointer group relative aspect-square overflow-hidden rounded-lg border hover:border-primary transition-colors"
                  onClick={() => handleImageSelect(item)}
                >
                  <img
                    src={getImageUrl(item)}
                    alt={item.alt_text || item.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary">
                      Select
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                    {item.original_name}
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No images found. Try adjusting your search or upload a new image.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}