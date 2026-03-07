import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export function GetQuotePage() {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [coverageAmount, setCoverageAmount] = useState([50000]);
  const [formData, setFormData] = useState({
    insuranceType: "",
    businessName: "",
    location: "",
    industry: "",
  });

  const [quote, setQuote] = useState<{
    premium: number;
    riskLevel: string;
    weatherRisk: number;
  } | null>(null);

  const handleGenerateQuote = () => {
    // Simulate quote generation
    const randomPremium = Math.floor(Math.random() * 2000) + 500;
    const randomRisk = Math.floor(Math.random() * 40) + 20;
    const riskLevel =
      randomRisk < 30 ? "Low" : randomRisk < 50 ? "Medium" : "High";

    setQuote({
      premium: randomPremium,
      riskLevel,
      weatherRisk: randomRisk,
    });
    setStep(3);
    toast.success("Quote generated successfully!");
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.insuranceType ||
        !formData.businessName ||
        !formData.location
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    if (step === 2) {
      if (!startDate || !endDate) {
        toast.error("Please select coverage dates");
        return;
      }
      handleGenerateQuote();
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-[#E8F0FA] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Coverage Details" },
              { num: 3, label: "Your Quote" },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s.num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {s.num}
                  </div>
                  <span
                    className={`text-sm mt-2 hidden sm:block ${step >= s.num ? "text-blue-600" : "text-gray-600"
                      }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${step > s.num ? "bg-blue-600" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="insuranceType">
                  Type of Insurance <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, insuranceType: value })
                  }
                >
                  <SelectTrigger id="insuranceType">
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agricultural">
                      Agricultural Insurance
                    </SelectItem>
                    <SelectItem value="event">Event Insurance</SelectItem>
                    <SelectItem value="business">Business Insurance</SelectItem>
                    <SelectItem value="travel">Travel Insurance</SelectItem>
                    <SelectItem value="construction">
                      Construction Insurance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="businessName">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="location">
                  Location (City, State) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Miami, FL"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="events">Events & Hospitality</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="tourism">Tourism</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleNext} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Coverage Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Configure your coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>
                    Coverage Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>
                    Coverage End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Coverage Amount</Label>
                  <span className="text-sm font-semibold text-blue-600">
                    ${coverageAmount[0].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={coverageAmount}
                  onValueChange={setCoverageAmount}
                  min={10000}
                  max={1000000}
                  step={10000}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$10,000</span>
                  <span>$1,000,000</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Weather Conditions for {formData.location || "your location"}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Risk:</span>
                    <Badge variant="secondary" className="ml-2">
                      Moderate
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Next 30 days:</span>
                    <Badge variant="outline" className="ml-2">
                      60% Rain
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
                <Button onClick={handleNext} className="w-full">
                  Generate Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Quote Results */}
        {step === 3 && quote && (
          <div className="space-y-6">
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  Your Custom Quote
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    ${quote.premium}
                    <span className="text-2xl text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600">
                    Based on your coverage of ${coverageAmount[0].toLocaleString()}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Risk Level
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            quote.riskLevel === "Low"
                              ? "secondary"
                              : quote.riskLevel === "Medium"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {quote.riskLevel}
                        </Badge>
                        {quote.riskLevel === "Low" ? (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Weather Risk Score
                      </div>
                      <div className="text-2xl font-semibold">
                        {quote.weatherRisk}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Coverage Period
                      </div>
                      <div className="text-sm font-semibold">
                        {startDate && endDate
                          ? `${Math.ceil(
                            (endDate.getTime() - startDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                          )} days`
                          : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-3">Coverage Includes:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>
                        Protection against rain, snow, wind, and extreme
                        temperatures
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>24/7 weather monitoring and alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Automated claim processing (48-hour payout)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Dedicated support team</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Flexible policy adjustments</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Modify Coverage
                  </Button>
                  <Button
                    onClick={() =>
                      toast.success(
                        "Policy activated! Check your email for details."
                      )
                    }
                    className="w-full"
                  >
                    Activate Policy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policy Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business Name:</span>
                    <span className="font-medium">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance Type:</span>
                    <span className="font-medium capitalize">
                      {formData.insuranceType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage Amount:</span>
                    <span className="font-medium">
                      ${coverageAmount[0].toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">
                      {startDate ? format(startDate, "PPP") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">
                      {endDate ? format(endDate, "PPP") : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
