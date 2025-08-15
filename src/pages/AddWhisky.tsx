import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Star, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";

const REGIONS = [
  "Scotland",
  "Ireland", 
  "Japan",
  "USA",
  "Canada",
  "India",
  "Taiwan",
  "Australia",
  "France",
  "Germany",
  "England",
  "Wales",
  "Other"
];

const LOCATIONS = {
  Scotland: ["Speyside", "Highlands", "Islay", "Lowlands", "Campbeltown", "Islands"],
  Ireland: ["Ulster", "Munster", "Leinster", "Connacht"],
  Japan: ["Honshu", "Hokkaido", "Kyushu"],
  USA: ["Kentucky", "Tennessee", "New York", "California", "Texas", "Other"],
  Canada: ["Ontario", "Quebec", "British Columbia", "Alberta"],
  India: ["Goa", "Karnataka", "Haryana", "Punjab"],
  Taiwan: ["Yilan County"],
  Australia: ["Tasmania", "Victoria", "New South Wales"],
  France: ["Brittany", "Alsace", "Corsica"],
  Germany: ["Bavaria", "Baden-Württemberg"],
  England: ["England"],
  Wales: ["Wales"],
  Other: ["Other"]
};

const FLAVORS = [
  { key: "green_apple", label: "Green Apple" },
  { key: "vanilla", label: "Vanilla" },
  { key: "smoke", label: "Smoke" },
  { key: "peat", label: "Peat" },
  { key: "honey", label: "Honey" },
  { key: "spice", label: "Spice" },
  { key: "citrus", label: "Citrus" },
  { key: "chocolate", label: "Chocolate" },
  { key: "oak", label: "Oak" },
  { key: "caramel", label: "Caramel" },
  { key: "dried_fruit", label: "Dried Fruit" },
  { key: "floral", label: "Floral" },
  { key: "nutty", label: "Nutty" },
  { key: "pepper", label: "Pepper" },
  { key: "malt", label: "Malt" },
  { key: "tropical", label: "Tropical" },
  { key: "berries", label: "Berries" },
] as const;

const INTENSITY_AXES = [
  { key: "fruit", label: "Fruit" },
  { key: "floral", label: "Floral" },
  { key: "oak", label: "Oak" },
  { key: "smoke", label: "Smoke" },
  { key: "spice", label: "Spice" },
] as const;

const INTENSITY_LABELS = ["none", "", "medium", "", "pronounced"];

const formSchema = z.object({
  name: z.string().min(1, "Whisky name is required"),
  distillery: z.string().min(1, "Distillery is required"),
  region: z.string().min(1, "Region is required"),
  location: z.string().min(1, "Location is required"),
  review_text: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.number().min(1, "Rating is required").max(5),
  flavors: z.array(z.string()).min(1, "At least one flavor must be selected"),
  image: z.instanceof(File, { message: "Image is required" }),
});

type FormData = z.infer<typeof formSchema>;

const AddWhisky = () => {
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [intensityRatings, setIntensityRatings] = useState<Record<string, number>>({
    fruit: 2,
    floral: 2,
    oak: 2,
    smoke: 2,
    spice: 2,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      distillery: "",
      region: "",
      location: "",
      review_text: "",
      rating: 1,
      flavors: [],
    },
  });

  const selectedRegion = form.watch("region");

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('user-whisky-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('user-whisky-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const createWhiskyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error("User not authenticated");

      // Upload image first
      const imageUrl = await uploadImage(data.image);

      // Create whisky record
      const { data: whisky, error } = await supabase
        .from("user_whiskies")
        .insert({
          user_id: user.id,
          name: data.name,
          distillery: data.distillery,
          region: data.region,
          location: data.location,
          image_url: imageUrl,
          review_text: data.review_text,
          rating: data.rating,
          flavors: data.flavors,
          intensity_ratings: intensityRatings,
        })
        .select()
        .single();

      if (error) throw error;
      return whisky;
    },
    onSuccess: () => {
      toast.success("Whisky added successfully!");
      navigate("/explore");
    },
    onError: (error) => {
      toast.error("Failed to add whisky: " + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    createWhiskyMutation.mutate({
      ...data,
      flavors: selectedFlavors,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to add your own whisky.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Add Your Whisky - Dram Discoverer</title>
        <meta name="description" content="Add your own whisky with tasting notes and review." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/explore")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
            <h1 className="text-3xl font-bold">Add Your Whisky</h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Whisky Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Image Upload */}
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Whisky Image *</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                {imagePreview ? (
                                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-contain" />
                                ) : (
                                  <div>
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Upload whisky image</p>
                                  </div>
                                )}
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Whisky Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 12 Year Old Single Malt" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="distillery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distillery *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Glenfiddich" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REGIONS.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedRegion}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedRegion && LOCATIONS[selectedRegion as keyof typeof LOCATIONS]?.map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Right Column - Review & Tasting Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Review & Tasting Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rating */}
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Rating *</FormLabel>
                          <FormControl>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Button
                                  key={star}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="p-1"
                                  onClick={() => field.onChange(star)}
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= field.value
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Review Text */}
                    <FormField
                      control={form.control}
                      name="review_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Review *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your thoughts about this whisky..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Flavors */}
                    <div>
                      <FormLabel>Flavor Notes *</FormLabel>
                      <p className="text-sm text-muted-foreground mb-3">Select the flavors you taste</p>
                      <ToggleGroup 
                        type="multiple" 
                        value={selectedFlavors}
                        onValueChange={(value) => {
                          setSelectedFlavors(value);
                          form.setValue("flavors", value);
                        }}
                        className="flex flex-wrap justify-start gap-2"
                      >
                        {FLAVORS.map((flavor) => (
                          <ToggleGroupItem
                            key={flavor.key}
                            value={flavor.key}
                            className="text-xs"
                          >
                            {flavor.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      {form.formState.errors.flavors && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.flavors.message}
                        </p>
                      )}
                    </div>

                    {/* Intensity Ratings */}
                    <div>
                      <FormLabel>Intensity Ratings</FormLabel>
                      <p className="text-sm text-muted-foreground mb-4">Rate the intensity of each characteristic</p>
                      <div className="space-y-4">
                        {INTENSITY_AXES.map((axis) => (
                          <div key={axis.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{axis.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {INTENSITY_LABELS[intensityRatings[axis.key]]}
                              </span>
                            </div>
                            <Slider
                              value={[intensityRatings[axis.key]]}
                              onValueChange={([value]) =>
                                setIntensityRatings(prev => ({ ...prev, [axis.key]: value }))
                              }
                              max={4}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  className="w-full max-w-md"
                  disabled={createWhiskyMutation.isPending}
                >
                  {createWhiskyMutation.isPending ? "Adding Whisky..." : "Add Whisky"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default AddWhisky;