import { useState } from "react";
import { toast } from "sonner";
import { Camera, MapPin, Plus, Send, Wine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

interface PostCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

interface WhiskyCheckIn {
  name: string;
  distillery: string;
  rating?: number;
}

export function PostCreationModal({ open, onOpenChange, onPostCreated }: PostCreationModalProps) {
  const { user } = useAuthSession();
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postType, setPostType] = useState<'general' | 'whisky_checkin'>('general');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  
  // Whisky check-in specific fields
  const [whiskyCheckIn, setWhiskyCheckIn] = useState<WhiskyCheckIn>({
    name: "",
    distillery: "",
    rating: undefined
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-whisky-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('user-whisky-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createPost = async () => {
    if (!user || !postContent.trim() || posting) return;
    
    setPosting(true);
    
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          setPosting(false);
          return;
        }
      }

      const postData = {
        user_id: user.id,
        content: postContent.trim(),
        post_type: postType,
        image_url: imageUrl
      };

      const { error } = await (supabase as any)
        .from('social_posts')
        .insert(postData);

      if (error) throw error;

      // If it's a whisky check-in, create a tasting note as well
      if (postType === 'whisky_checkin' && whiskyCheckIn.name && whiskyCheckIn.distillery) {
        // First, try to find existing whisky or create a user whisky
        const { error: userWhiskyError } = await (supabase as any)
          .from('user_whiskies')
          .insert({
            user_id: user.id,
            name: whiskyCheckIn.name,
            distillery: whiskyCheckIn.distillery,
            region: 'Unknown',
            location: 'Unknown',
            review_text: postContent.trim(),
            rating: whiskyCheckIn.rating,
            flavors: [],
            image_url: imageUrl
          });

        if (userWhiskyError) {
          console.warn('Could not create user whisky:', userWhiskyError);
        }
      }

      toast.success('Post created successfully!');
      resetForm();
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const resetForm = () => {
    setPostContent("");
    setPostType('general');
    setSelectedImage(null);
    setImagePreview("");
    setWhiskyCheckIn({
      name: "",
      distillery: "",
      rating: undefined
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post Type Selection */}
          <div>
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={(value: 'general' | 'whisky_checkin') => setPostType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Post</SelectItem>
                <SelectItem value="whisky_checkin">Whisky Check-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Whisky Check-in Fields */}
          {postType === 'whisky_checkin' && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Wine className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-sm">Whisky Details</span>
                </div>
                
                <div>
                  <Label htmlFor="whisky-name">Whisky Name</Label>
                  <Input
                    id="whisky-name"
                    placeholder="e.g., Lagavulin 16"
                    value={whiskyCheckIn.name}
                    onChange={(e) => setWhiskyCheckIn(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="distillery">Distillery</Label>
                  <Input
                    id="distillery"
                    placeholder="e.g., Lagavulin"
                    value={whiskyCheckIn.distillery}
                    onChange={(e) => setWhiskyCheckIn(prev => ({ ...prev, distillery: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rating">Rating (Optional)</Label>
                  <Select 
                    value={whiskyCheckIn.rating?.toString() || ""} 
                    onValueChange={(value) => setWhiskyCheckIn(prev => ({ 
                      ...prev, 
                      rating: value ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rate this whisky" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">⭐ 1 Star</SelectItem>
                      <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Content */}
          <div>
            <Label htmlFor="content">
              {postType === 'whisky_checkin' ? 'Tasting Notes' : 'What\'s on your mind?'}
            </Label>
            <Textarea
              id="content"
              placeholder={postType === 'whisky_checkin' 
                ? "Share your tasting experience..." 
                : "Share your whisky thoughts..."}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Image (Optional)</Label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload">
                    <Button variant="outline" className="w-full" asChild>
                      <div className="cursor-pointer">
                        <Camera className="w-4 h-4 mr-2" />
                        Add Photo
                      </div>
                    </Button>
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Post Type Badge */}
          {postType === 'whisky_checkin' && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Wine className="w-3 h-3" />
                <span>Whisky Check-in</span>
              </Badge>
              {whiskyCheckIn.name && (
                <Badge variant="outline">
                  {whiskyCheckIn.distillery} {whiskyCheckIn.name}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={posting || uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={createPost}
              disabled={
                !postContent.trim() || 
                posting || 
                uploading ||
                (postType === 'whisky_checkin' && (!whiskyCheckIn.name || !whiskyCheckIn.distillery))
              }
            >
              {posting || uploading ? (
                "Creating..."
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
  );
}