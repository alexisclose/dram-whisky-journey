import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Download, X, CheckCircle } from "lucide-react";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Progress } from "@/components/ui/progress";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file (.csv)",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    try {
      const content = await readFileContent(file);
      const lines = content.trim().split('\n');
      setFilePreview(lines.slice(0, 6)); // Show first 6 lines as preview
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Failed to read the selected file",
        variant: "destructive",
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);
      const csvContent = await readFileContent(selectedFile);
      
      setUploadProgress(40);
      const whiskies = parseCSV(csvContent);
      
      setUploadProgress(60);
      toast({
        title: "Parsing successful",
        description: `Parsed ${whiskies.length} whiskies. Uploading to database...`,
      });

      setUploadProgress(80);
      const { data, error } = await supabase
        .from("whiskies")
        .insert(whiskies)
        .select();

      if (error) {
        throw error;
      }

      setUploadProgress(100);
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${data.length} whiskies to the database`,
      });

      clearFile();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
                CSV File Upload
              </CardTitle>
              <CardDescription>
                Select or drag & drop a CSV file to upload whisky data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? "border-primary bg-primary/5" 
                    : selectedFile 
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                    <div className="font-medium text-green-700 dark:text-green-400">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div className="font-medium">
                      {isDragOver ? "Drop your CSV file here" : "Choose a CSV file or drag & drop"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Maximum file size: 5MB
                    </div>
                  </div>
                )}
                
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* File Preview */}
              {filePreview.length > 0 && (
                <Card className="border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">File Preview</CardTitle>
                    <CardDescription className="text-xs">
                      First few lines of your CSV file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded p-3 font-mono text-xs overflow-x-auto">
                      {filePreview.map((line, index) => (
                        <div 
                          key={index} 
                          className={index === 0 ? "font-semibold text-primary" : ""}
                        >
                          {line}
                        </div>
                      ))}
                      {filePreview.length === 6 && (
                        <div className="text-muted-foreground italic">
                          ... and more rows
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Bar */}
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !selectedFile}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Upload Whiskies"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFile}
                  disabled={isUploading || !selectedFile}
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