import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Search, Grid, List, Trash2, Edit, Eye, Tag, FileImage } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  alt_text: string;
  category: string;
  tags: string[];
  usage_count: number;
  created_at: string;
}

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading } = useQuery({
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
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const uploads = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `admin/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("whisky-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Add to media library
        const { error: dbError } = await supabase
          .from("media_library")
          .insert({
            filename: fileName,
            original_name: file.name,
            file_path: filePath,
            bucket_name: "whisky-images",
            file_size: file.size,
            mime_type: file.type,
            category: "general",
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploads);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
      toast({ title: "Images uploaded successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(item.bucket_name)
        .remove([item.file_path]);

      if (storageError) throw storageError;

      // Mark as inactive in database
      const { error: dbError } = await supabase
        .from("media_library")
        .update({ is_active: false })
        .eq("id", item.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
      toast({ title: "Image deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Delete failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const getImageUrl = (item: MediaItem) => {
    const { data } = supabase.storage
      .from(item.bucket_name)
      .getPublicUrl(item.file_path);
    return data.publicUrl;
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(mediaItems.map(item => item.category)))];

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Manage your whisky images and media</p>
          </div>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectTrigger className="w-full sm:w-48">
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

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getImageUrl(item)}
                    alt={item.alt_text || item.original_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="secondary" onClick={() => setSelectedImage(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{item.original_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <img
                              src={getImageUrl(item)}
                              alt={item.alt_text || item.original_name}
                              className="w-full h-auto max-h-96 object-contain"
                            />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Size:</span> {(item.file_size / 1024 / 1024).toFixed(2)} MB
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {item.category}
                              </div>
                              <div>
                                <span className="font-medium">Usage:</span> {item.usage_count} times
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {item.mime_type}
                              </div>
                            </div>
                            {item.tags.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {item.tags.map(tag => (
                                  <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{item.original_name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">{item.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.usage_count} uses
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(item)}
                        alt={item.alt_text || item.original_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.original_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(item.file_size / 1024 / 1024).toFixed(2)} MB • {item.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.usage_count} uses</Badge>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => setSelectedImage(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !isLoading && (
          <Card className="text-center p-12">
            <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No images found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Upload your first images to get started"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            )}
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}