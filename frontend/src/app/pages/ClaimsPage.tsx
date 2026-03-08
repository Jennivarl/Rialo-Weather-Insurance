import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  CalendarIcon,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function ClaimsPage() {
  const [incidentDate, setIncidentDate] = useState<Date>();
  const [formData, setFormData] = useState({
    policyId: "",
    claimType: "",
    estimatedDamage: "",
    description: "",
  });

  const handleSubmitClaim = () => {
    if (
      !formData.policyId ||
      !formData.claimType ||
      !incidentDate ||
      !formData.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Claim submitted successfully! We'll review it within 24 hours.");
    // Reset form
    setFormData({
      policyId: "",
      claimType: "",
      estimatedDamage: "",
      description: "",
    });
    setIncidentDate(undefined);
  };

  const claims = [
    {
      id: "CLM-2026-001",
      date: "Mar 1, 2026",
      policyId: "WG-2024-001",
      type: "Heavy Rainfall",
      amount: 8500,
      status: "Approved",
      description: "Crop damage due to excessive rainfall (5.2 inches in 24 hours)",
      processedDate: "Mar 3, 2026",
    },
    {
      id: "CLM-2026-002",
      date: "Feb 28, 2026",
      policyId: "WG-2024-002",
      type: "Storm Damage",
      amount: 12000,
      status: "Processing",
      description: "Event cancellation due to severe thunderstorm",
      processedDate: null,
    },
    {
      id: "CLM-2026-003",
      date: "Feb 20, 2026",
      policyId: "WG-2024-001",
      type: "Hail Damage",
      amount: 5500,
      status: "Approved",
      description: "Hail damage to greenhouse structures",
      processedDate: "Feb 22, 2026",
    },
    {
      id: "CLM-2026-004",
      date: "Feb 15, 2026",
      policyId: "WG-2024-002",
      type: "High Winds",
      amount: 3200,
      status: "Processing",
      description: "Wind damage to outdoor equipment",
      processedDate: null,
    },
    {
      id: "CLM-2025-089",
      date: "Jan 10, 2026",
      policyId: "WG-2024-001",
      type: "Freeze Damage",
      amount: 15000,
      status: "Denied",
      description: "Crop loss due to unexpected frost",
      processedDate: "Jan 12, 2026",
      denialReason: "Temperature did not meet policy threshold",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Processing":
        return <Clock className="w-5 h-5 text-orange-600" />;
      case "Denied":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "Processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "Denied":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F0FA]">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl mb-2">Claims Management</h1>
          <p className="text-gray-600">
            Submit new claims or track existing ones
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="submit">Submit Claim</TabsTrigger>
            <TabsTrigger value="history">Claims History</TabsTrigger>
          </TabsList>

          {/* Submit New Claim */}
          <TabsContent value="submit">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>File a New Claim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="policyId">
                      Select Policy <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.policyId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, policyId: value })
                      }
                    >
                      <SelectTrigger id="policyId">
                        <SelectValue placeholder="Choose your policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WG-2024-001">
                          WG-2024-001 - Agricultural Insurance
                        </SelectItem>
                        <SelectItem value="WG-2024-002">
                          WG-2024-002 - Event Insurance
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="claimType">
                      Type of Weather Event <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.claimType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, claimType: value })
                      }
                    >
                      <SelectTrigger id="claimType">
                        <SelectValue placeholder="Select weather event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heavy-rain">Heavy Rainfall</SelectItem>
                        <SelectItem value="storm">Storm Damage</SelectItem>
                        <SelectItem value="hail">Hail Damage</SelectItem>
                        <SelectItem value="wind">High Winds</SelectItem>
                        <SelectItem value="freeze">Freeze/Frost</SelectItem>
                        <SelectItem value="heat">Extreme Heat</SelectItem>
                        <SelectItem value="snow">Snow/Ice</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>
                      Date of Incident <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {incidentDate ? (
                            format(incidentDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={incidentDate}
                          onSelect={setIncidentDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="estimatedDamage">
                      Estimated Damage Amount
                    </Label>
                    <Input
                      id="estimatedDamage"
                      type="number"
                      placeholder="Enter amount in USD"
                      value={formData.estimatedDamage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDamage: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Detailed Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the incident and the damage caused..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Supporting Documents</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Photos, receipts, weather reports (Max 10MB each)
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSubmitClaim} className="w-full" size="lg">
                    Submit Claim
                  </Button>
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Claims Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Required Documents
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
                      <li>Photos of damage</li>
                      <li>Weather reports from incident date</li>
                      <li>Receipts or estimates for repairs</li>
                      <li>Police/incident reports (if applicable)</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Processing Time
                    </h4>
                    <p className="text-sm text-gray-600">
                      Most claims are reviewed within 24-48 hours. Complex cases
                      may take up to 7 business days.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      Fast Track Eligible
                    </h4>
                    <p className="text-sm text-gray-600">
                      Claims under $5,000 with complete documentation qualify for
                      automated processing and same-day approval.
                    </p>
                  </div>

                  <div className="pt-4 border-t bg-blue-50 -mx-6 -mb-6 p-4 rounded-b-lg">
                    <p className="text-sm">
                      <strong>Need help?</strong>
                      <br />
                      Call our 24/7 claims hotline at{" "}
                      <span className="text-blue-600">1-800-WEATHER</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Claims History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Claims History</CardTitle>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Claims</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(claim.status)}
                            <div>
                              <h3 className="font-semibold">{claim.type}</h3>
                              <p className="text-sm text-gray-600">
                                Claim ID: {claim.id} • Policy: {claim.policyId}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {claim.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Incident Date:</span>{" "}
                              {claim.date}
                            </div>
                            {claim.processedDate && (
                              <div>
                                <span className="text-gray-500">
                                  Processed Date:
                                </span>{" "}
                                {claim.processedDate}
                              </div>
                            )}
                          </div>

                          {claim.status === "Denied" && claim.denialReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                              <strong className="text-red-700">
                                Denial Reason:
                              </strong>{" "}
                              {claim.denialReason}
                            </div>
                          )}
                        </div>

                        <div className="text-right lg:min-w-[150px]">
                          <div className="text-2xl font-bold mb-2">
                            ${claim.amount.toLocaleString()}
                          </div>
                          {getStatusBadge(claim.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-gray-600">Total Claims</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">3</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">2</div>
                      <div className="text-sm text-gray-600">Processing</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        $34.2K
                      </div>
                      <div className="text-sm text-gray-600">Total Paid</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
