import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Download, X, CheckCircle, RefreshCw } from "lucide-react";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Progress } from "@/components/ui/progress";

interface WhiskyCSVRow {
  WhiskyName: string;
  Distillery: string;
  Region: string;
  Location: string;
  "Region, Location": string;
  ImageURL?: string;
  "Overview incl expert tasting notes"?: string;
  ExpertScore_Fruit?: number;
  ExpertScore_Floral?: number;
  ExpertScore_Spice?: number;
  ExpertScore_Smoke?: number;
  ExpertScore_Oak?: number;
  "Pairs well with A"?: string;
  "Pairs well with B"?: string;
  "Pairs well with C"?: string;
  set_code?: string;
}

const WhiskyUploadContent = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replaceMode, setReplaceMode] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ inserted: number; updated: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadCSVTemplate = () => {
    const headers = [
      "WhiskyName",
      "Distillery", 
      "Region",
      "Location",
      "Region, Location",
      "ImageURL",
      "Overview incl expert tasting notes",
      "ExpertScore_Fruit", 
      "ExpertScore_Floral",
      "ExpertScore_Spice",
      "ExpertScore_Smoke",
      "ExpertScore_Oak",
      "Pairs well with A",
      "Pairs well with B",
      "Pairs well with C",
      "set_code"
    ];
    
    const exampleRow = [
      "12 Year Old",
      "Glenfiddich",
      "Speyside", 
      "Dufftown, Scotland",
      "Speyside, Dufftown",
      "https://example.com/glenfiddich-12.jpg",
      "The world's most awarded single malt with fresh pear, subtle oak, creamy vanilla and honey notes",
      "7",
      "5",
      "4",
      "2",
      "6",
      "Dark chocolate",
      "Grilled salmon",
      "Highland cheese",
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

  const downloadTSVTemplate = () => {
    const headers = [
      "WhiskyName",
      "Distillery", 
      "Region",
      "Location",
      "Region, Location",
      "ImageURL",
      "Overview incl expert tasting notes",
      "ExpertScore_Fruit", 
      "ExpertScore_Floral",
      "ExpertScore_Spice",
      "ExpertScore_Smoke",
      "ExpertScore_Oak",
      "Pairs well with A",
      "Pairs well with B",
      "Pairs well with C",
      "set_code"
    ];
    
    const exampleRow = [
      "12 Year Old",
      "Glenfiddich",
      "Speyside", 
      "Dufftown, Scotland",
      "Speyside, Dufftown",
      "https://example.com/glenfiddich-12.jpg",
      "The world's most awarded single malt with fresh pear, subtle oak, creamy vanilla and honey notes",
      "7",
      "5",
      "4",
      "2",
      "6",
      "Dark chocolate",
      "Grilled salmon",
      "Highland cheese",
      "classic"
    ];

    const tsvContent = [headers.join("\t"), exampleRow.join("\t")].join("\n");
    const blob = new Blob([tsvContent], { type: "text/tab-separated-values" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whisky_template.tsv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseDelimitedFile = (fileContent: string, fileName: string): WhiskyCSVRow[] => {
    const lines = fileContent.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("File must have at least a header row and one data row");
    }

    // Determine delimiter based on file extension
    const delimiter = fileName.toLowerCase().endsWith('.tsv') ? '\t' : ',';
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ""));
    const requiredHeaders = ["WhiskyName", "Distillery", "Region", "Location"];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const whiskies: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ""));
      const whisky: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (header.startsWith("ExpertScore_")) {
          whisky[header.toLowerCase().replace("expertscore_", "expert_score_")] = value ? parseInt(value) : null;
        } else if (header === "WhiskyName") {
          whisky.name = value || null;
        } else if (header === "Distillery") {
          whisky.distillery = value || null;
        } else if (header === "Region") {
          whisky.region = value || null;
        } else if (header === "Location") {
          whisky.location = value || null;
        } else if (header === "Region, Location") {
          whisky.region_location = value || null;
        } else if (header === "ImageURL") {
          whisky.image_url = value || null;
        } else if (header === "Overview incl expert tasting notes") {
          whisky.overview = value || null;
        } else if (header === "Pairs well with A") {
          whisky.pairs_well_with_a = value || null;
        } else if (header === "Pairs well with B") {
          whisky.pairs_well_with_b = value || null;
        } else if (header === "Pairs well with C") {
          whisky.pairs_well_with_c = value || null;
        } else {
          whisky[header.toLowerCase()] = value || null;
        }
      });

      // Validate required fields
      if (!whisky.distillery || !whisky.name || !whisky.region) {
        throw new Error(`Row ${i + 1}: Missing required fields (WhiskyName, Distillery, or Region)`);
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
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.tsv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV (.csv) or TSV (.tsv) file",
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
        description: "Please select a CSV or TSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStats(null);

    try {
      setUploadProgress(20);
      const csvContent = await readFileContent(selectedFile);
      
      setUploadProgress(40);
      const whiskies = parseDelimitedFile(csvContent, selectedFile.name);
      
      setUploadProgress(60);
      toast({
        title: "Parsing successful",
        description: `Parsed ${whiskies.length} whiskies. ${replaceMode ? 'Upserting' : 'Uploading'} to database...`,
      });

      setUploadProgress(80);
      
      if (replaceMode) {
        // Use upsert to handle duplicates by updating existing records
        const { data, error } = await supabase
          .from("whiskies")
          .upsert(whiskies as any[], {
            onConflict: 'distillery,name',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          throw error;
        }

        // Get statistics (simplified - actual counts would need additional queries)
        setUploadStats({ inserted: data.length, updated: 0 });
        
        setUploadProgress(100);
        toast({
          title: "Update successful",
          description: `Successfully processed ${data.length} whiskies (updated existing records with matching distillery/name)`,
        });
      } else {
        // Regular insert operation
        const { data, error } = await supabase
          .from("whiskies")
          .insert(whiskies as any[])
          .select();

        if (error) {
          throw error;
        }

        setUploadStats({ inserted: data.length, updated: 0 });
        
        setUploadProgress(100);
        toast({
          title: "Upload successful",
          description: `Successfully uploaded ${data.length} new whiskies to the database`,
        });
      }

      clearFile();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: replaceMode ? "Update failed" : "Upload failed",
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
                CSV/TSV Format Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for a successful upload using CSV (comma-separated) or TSV (tab-separated) formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Required Columns:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>WhiskyName</strong> - Name of the whisky expression</li>
                  <li>• <strong>Distillery</strong> - Name of the distillery</li>
                  <li>• <strong>Region</strong> - Geographic region (e.g., Speyside, Islay)</li>
                  <li>• <strong>Location</strong> - Specific location of the distillery</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Optional Columns:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Region, Location</strong> - Combined region and location</li>
                  <li>• <strong>ImageURL</strong> - URL to bottle image</li>
                  <li>• <strong>Overview incl expert tasting notes</strong> - Description and expert notes</li>
                  <li>• <strong>ExpertScore_Fruit</strong> - Expert fruit score (1-10)</li>
                  <li>• <strong>ExpertScore_Floral</strong> - Expert floral score (1-10)</li>
                  <li>• <strong>ExpertScore_Spice</strong> - Expert spice score (1-10)</li>
                  <li>• <strong>ExpertScore_Smoke</strong> - Expert smoke score (1-10)</li>
                  <li>• <strong>ExpertScore_Oak</strong> - Expert oak score (1-10)</li>
                  <li>• <strong>Pairs well with A</strong> - First pairing suggestion</li>
                  <li>• <strong>Pairs well with B</strong> - Second pairing suggestion</li>
                  <li>• <strong>Pairs well with C</strong> - Third pairing suggestion</li>
                  <li>• <strong>set_code</strong> - Set classification (defaults to "classic")</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadCSVTemplate} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button onClick={downloadTSVTemplate} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download TSV Template
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="replace-mode"
                    checked={replaceMode}
                    onCheckedChange={setReplaceMode}
                  />
                  <Label htmlFor="replace-mode" className="text-sm">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Replace Mode: Update existing whiskies with matching distillery/name
                    </span>
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {replaceMode 
                    ? "Will update existing records and insert new ones. Use this to replace your current data."
                    : "Will only insert new records. Duplicate distillery/name combinations will cause errors."
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                CSV/TSV File Upload
              </CardTitle>
              <CardDescription>
                Select or drag & drop a CSV or TSV file to upload whisky data
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
                  accept=".csv,.tsv"
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
                      {isDragOver ? "Drop your CSV/TSV file here" : "Choose a CSV or TSV file or drag & drop"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Maximum file size: 5MB • Supports CSV and TSV formats
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
                      First few lines of your file
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