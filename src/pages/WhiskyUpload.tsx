import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Download } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";

interface WhiskyCSVRow {
  distillery: string;
  name: string;
  region: string;
  abv: number;
  lat: number;
  lng: number;
  expert_nose?: string;
  expert_palate?: string;
  expert_finish?: string;
  description?: string;
  image_url?: string;
  set_code?: string;
}

const WhiskyUploadContent = () => {
  const [csvContent, setCsvContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      "distillery",
      "name", 
      "region",
      "abv",
      "lat",
      "lng",
      "expert_nose",
      "expert_palate", 
      "expert_finish",
      "description",
      "image_url",
      "set_code"
    ];
    
    const exampleRow = [
      "Glenfiddich",
      "12 Year Old",
      "Speyside", 
      "40",
      "57.455",
      "-3.128",
      "Fresh pear and subtle oak",
      "Creamy vanilla with hints of honey",
      "Long and smooth with gentle spice",
      "The world's most awarded single malt Scotch whisky",
      "https://example.com/glenfiddich-12.jpg",
      "classic"
    ];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whisky_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): WhiskyCSVRow[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const requiredHeaders = ["distillery", "name", "region", "abv", "lat", "lng"];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const whiskies: WhiskyCSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const whisky: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (header === "abv" || header === "lat" || header === "lng") {
          whisky[header] = value ? parseFloat(value) : null;
        } else {
          whisky[header] = value || null;
        }
      });

      // Validate required fields
      if (!whisky.distillery || !whisky.name || !whisky.region) {
        throw new Error(`Row ${i + 1}: Missing required fields (distillery, name, or region)`);
      }

      if (whisky.abv === null || isNaN(whisky.abv)) {
        throw new Error(`Row ${i + 1}: Invalid ABV value`);
      }

      if (whisky.lat === null || isNaN(whisky.lat) || whisky.lng === null || isNaN(whisky.lng)) {
        throw new Error(`Row ${i + 1}: Invalid latitude or longitude`);
      }

      // Set default set_code if not provided
      if (!whisky.set_code) {
        whisky.set_code = "classic";
      }

      whiskies.push(whisky);
    }

    return whiskies;
  };

  const handleUpload = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste CSV content first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const whiskies = parseCSV(csvContent);
      
      toast({
        title: "Parsing successful",
        description: `Parsed ${whiskies.length} whiskies. Uploading to database...`,
      });

      const { data, error } = await supabase
        .from("whiskies")
        .insert(whiskies)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${data.length} whiskies to the database`,
      });

      setCsvContent("");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Whiskies - Admin Tool</title>
        <meta name="description" content="Administrative tool for bulk uploading whisky data via CSV" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Upload Whiskies</h1>
          <p className="text-xl text-muted-foreground">
            Bulk upload whisky data using CSV format
          </p>
        </div>

        <div className="grid gap-6">
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CSV Format Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for a successful upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Required Columns:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>distillery</strong> - Name of the distillery</li>
                  <li>• <strong>name</strong> - Name of the whisky expression</li>
                  <li>• <strong>region</strong> - Geographic region (e.g., Speyside, Islay)</li>
                  <li>• <strong>abv</strong> - Alcohol by volume percentage (number)</li>
                  <li>• <strong>lat</strong> - Latitude coordinate (decimal)</li>
                  <li>• <strong>lng</strong> - Longitude coordinate (decimal)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Optional Columns:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>expert_nose</strong> - Expert tasting notes for aroma</li>
                  <li>• <strong>expert_palate</strong> - Expert tasting notes for taste</li>
                  <li>• <strong>expert_finish</strong> - Expert tasting notes for finish</li>
                  <li>• <strong>description</strong> - General description or distillery story</li>
                  <li>• <strong>image_url</strong> - URL to bottle image</li>
                  <li>• <strong>set_code</strong> - Set classification (defaults to "classic")</li>
                </ul>
              </div>

              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                CSV Upload
              </CardTitle>
              <CardDescription>
                Paste your CSV content below and click upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your CSV content here..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !csvContent.trim()}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Upload Whiskies"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCsvContent("")}
                  disabled={isUploading}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const WhiskyUpload = () => {
  return (
    <AdminGuard>
      <WhiskyUploadContent />
    </AdminGuard>
  );
};

export default WhiskyUpload;