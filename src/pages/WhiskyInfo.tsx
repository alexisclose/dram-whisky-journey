import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, ChevronDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminImageOverlay } from "@/components/AdminImageOverlay";

const WhiskyInfo = () => {
  const { id } = useParams<{ id: string }>();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/whisky-info/${id}` : `/whisky-info/${id}`;

  const { data: whisky, isLoading } = useQuery({
    queryKey: ["whisky-info", id],
    queryFn: async () => {
      if (!id) throw new Error("Whisky ID is required");
      
      const { data, error } = await supabase
        .from("whiskies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading the story...
        </div>
      </div>
    );
  }

  if (!whisky) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center">The whisky tale you're seeking has yet to be written.</p>
        <Button asChild variant="outline">
          <Link to="/my-tasting-box">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Collection
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>The Story of {whisky.distillery} {whisky.name}</title>
        <meta name="description" content={`Discover the provenance and story behind ${whisky.distillery} ${whisky.name} from ${whisky.region}. An immersive journey through craft, tradition, and terroir.`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Fixed Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <Button asChild variant="ghost" size="sm" className="bg-background/80 backdrop-blur-sm border border-border/50">
          <Link to="/my-tasting-box">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Part 1: The Hook - Full Screen Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {whisky.image_url ? (
            <div className="relative w-full h-full">
              <AdminImageOverlay
                src={whisky.image_url}
                alt=""
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80 pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-muted/30 via-muted/50 to-muted/80" />
          )}
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">
              {whisky.region}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-4 tracking-tight">
              {whisky.distillery}
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light">
              {whisky.name}
            </h2>
          </div>
          
          {/* Evocative Quote */}
          <div className="max-w-2xl mx-auto">
            <blockquote className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed text-foreground/90 italic">
              "From the ancient mists of {whisky.region}, where tradition meets innovation, a legend emerges."
            </blockquote>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Part 2: The Journey - Story Chapters */}
      <section className="bg-background">
        {/* Chapter 1: The Inspiration */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="text-sm tracking-[0.2em] uppercase text-primary font-medium">Chapter I</span>
                <h3 className="text-3xl md:text-4xl font-light mb-6 mt-2">The Inspiration</h3>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    In the heart of {whisky.region}, where ancient traditions flow like the mountain streams, 
                    the vision for {whisky.name} was born. This wasn't merely about creating another expression—it was about 
                    capturing the very essence of a place steeped in centuries of whisky-making heritage.
                  </p>
                  <p>
                    {whisky.overview ? whisky.overview : `The master distillers at ${whisky.distillery} sought to honor the terroir of ${whisky.region}, 
                    allowing the unique character of the land to speak through every drop.`}
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                  <AdminImageOverlay
                    src={whisky.image_url || "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop"}
                    alt="The inspiration behind the whisky"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 2: The Craft */}
        <div className="py-20 px-6 bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-1">
                <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                  <AdminImageOverlay
                    src="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=600&fit=crop"
                    alt="Craft and artistry of whisky making"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="order-2">
                <span className="text-sm tracking-[0.2em] uppercase text-primary font-medium">Chapter II</span>
                <h3 className="text-3xl md:text-4xl font-light mb-6 mt-2">The Craft</h3>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    Every element of {whisky.name} speaks to the meticulous artistry that defines {whisky.distillery}. 
                    From the careful selection of ingredients to the patient guidance through each stage of creation, 
                    this whisky embodies generations of accumulated wisdom.
                  </p>
                  <p>
                    The copper stills breathe life into the spirit, while ancient techniques merge seamlessly with 
                    modern precision. Each decision in the process is deliberate, purposeful, and steeped in respect 
                    for the craft.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 3: The Maturation */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="text-sm tracking-[0.2em] uppercase text-primary font-medium">Chapter III</span>
                <h3 className="text-3xl md:text-4xl font-light mb-6 mt-2">The Maturation</h3>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    Time becomes the silent alchemist in the story of {whisky.name}. Within the embrace of carefully 
                    selected oak, the spirit undergoes its profound transformation, drawing character from wood that 
                    has witnessed decades of seasonal change.
                  </p>
                  <p>
                    The unique climate of {whisky.region} plays its part—each season leaving its mark, each year 
                    adding layers of complexity that no rushing can achieve. This is patience rewarded, 
                    time honored, and tradition preserved.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                  <AdminImageOverlay
                    src="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=600&fit=crop"
                    alt="Maturation process in oak barrels"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 3: The Home - Distillery & Terroir */}
      <section className="py-20 px-6 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-light mb-12">
            Forged in {whisky.region}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h4 className="text-2xl font-light">The Terroir</h4>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {whisky.location ? `Nestled in ${whisky.location}, within the renowned ${whisky.region} region, ` : `In the heart of ${whisky.region}, `}
                {whisky.distillery} draws from the unique characteristics of its environment. The local climate, 
                water sources, and natural surroundings all contribute to the distinctive profile that makes 
                this whisky unmistakably from this place.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-2xl font-light">The Philosophy</h4>
              <p className="text-lg leading-relaxed text-muted-foreground">
                At {whisky.distillery}, whisky-making is more than a craft—it's a responsibility to preserve 
                and honor the traditions of {whisky.region}. Every bottle of {whisky.name} carries forward 
                the legacy of master distillers who understood that true excellence comes from patience, 
                precision, and profound respect for the art.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Part 4: The Legacy - Final CTA */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            {whisky.image_url && (
              <div className="max-w-md mx-auto mb-8">
                <AdminImageOverlay
                  src={whisky.image_url}
                  alt={`${whisky.distillery} ${whisky.name}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            
            <h3 className="text-3xl md:text-4xl font-light mb-6">
              The Story Lives On
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground mb-8 max-w-2xl mx-auto">
              Every story deserves its moment of discovery. The tale of {whisky.name} has been told—now it's time 
              to experience it. Your palate will be the final chapter in this narrative, adding your own 
              impressions to the legacy of {whisky.distillery}.
            </p>
          </div>
          
          <Button asChild size="lg" className="px-8 py-6 text-lg">
            <Link to={`/tasting/${whisky.id}`}>
              <Play className="mr-2 h-5 w-5" />
              Begin Your Tasting Journey
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default WhiskyInfo;