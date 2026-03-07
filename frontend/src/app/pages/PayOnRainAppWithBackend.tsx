import { useState, useEffect } from "react";
import { RialoLogo } from "../components/RialoLogo";
import { AuthModal } from "../components/AuthModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle, CloudRain, Droplets, MapPin, DollarSign, TrendingUp, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/api";

interface PolicyData {
  city: string;
  threshold: string;
  payout: string;
}

interface WeatherData {
  location: string;
  rainfall: number;
  threshold: number;
  condition: string;
  temperature: string;
  triggered: boolean;
}

interface PayoutData {
  transactionId: string;
  amount: number;
  status: string;
}

export function PayOnRainAppWithBackend() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; payoutMethod: string } | null>(null);
  const [policyData, setPolicyData] = useState<PolicyData>({
    city: "",
    threshold: "",
    payout: "",
  });
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [policyCreated, setPolicyCreated] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('payonrain_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSignIn = (email: string, payoutMethod: string) => {
    const userData = { email, payoutMethod };
    setUser(userData);
    localStorage.setItem('payonrain_user', JSON.stringify(userData));
    toast.success("Welcome! You're signed in.");
  };

  const handleNewPolicy = () => {
    setPolicyData({ city: "", threshold: "", payout: "" });
    setPolicyId(null);
    setPolicyCreated(false);
    setWeatherData(null);
    setPayoutData(null);
    setPayoutConfirmed(false);
    toast.success("Ready to create a new policy!");
  };

  const handleCreatePolicy = async () => {
    if (!policyData.city || !policyData.threshold || !policyData.payout) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Call your Rust backend API
      const response = await apiClient.createPolicy({
        city: policyData.city,
        threshold: parseFloat(policyData.threshold),
        payout: parseFloat(policyData.payout),
      });

      setPolicyId(response.id);
      setPolicyCreated(true);
      toast.success("🎉 Policy created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create policy");
      console.error("Create policy error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckWeather = async () => {
    if (!policyId) {
      toast.error("No active policy found");
      return;
    }

    setIsLoading(true);
    try {
      // Call your Rust backend API
      const response = await apiClient.checkWeather(policyId);

      setWeatherData({
        location: response.location,
        rainfall: response.rainfall,
        threshold: response.threshold,
        condition: response.condition,
        temperature: response.temperature,
        triggered: response.triggered,
      });

      if (response.triggered) {
        toast.success("✅ Conditions met! Payout eligible.");
      } else {
        toast.info("Threshold not met yet. Check again later.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check weather");
      console.error("Check weather error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayout = async () => {
    if (!weatherData?.triggered || !policyId || !user) {
      return;
    }

    setIsLoading(true);
    try {
      // Call your Rust backend API
      const response = await apiClient.processPayout({
        policy_id: policyId,
        payout_method: user.payoutMethod,
      });

      setPayoutData({
        transactionId: response.transaction_id,
        amount: response.amount,
        status: response.status,
      });
      setPayoutConfirmed(true);
      toast.success("💰 Payout processed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process payout");
      console.error("Process payout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPayoutMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      bank: "Bank Account",
      paypal: "PayPal",
      bitcoin: "Bitcoin",
      usdc: "USDC",
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-[#E8F0FA]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#e0dcd4] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#0EA5E9] opacity-10 blur-xl rounded-full"></div>
              <RialoLogo size={36} className="text-[#0EA5E9] relative" />
            </div>
            <div>
              <span className="text-[22px] font-bold text-[#0EA5E9] block leading-none">
                PayOnRain
              </span>
              <span className="text-[10px] text-[#0EA5E9] uppercase tracking-wide">
                by Rialo
              </span>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-[12px] text-[#6b6b6b]">Signed in as</div>
                <div className="text-[14px] font-semibold text-[#1a1714]">{user.email}</div>
              </div>
              {policyCreated && (
                <Button
                  onClick={handleNewPolicy}
                  className="bg-white border-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white font-bold text-[13px] px-4 py-2 rounded-[8px] h-auto transition-all"
                >
                  New Policy
                </Button>
              )}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center text-white font-bold">
                {user.email[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-[#0EA5E9] hover:bg-[#0284c7] text-white font-bold text-[14px] px-6 py-2.5 rounded-[8px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/20 active:scale-[0.98]"
            >
              Sign In
            </Button>
          )}
          {user && (
            <Button
              onClick={() => {
                setUser(null);
                localStorage.removeItem('payonrain_user');
                handleNewPolicy();
                toast.success("Signed out.");
              }}
              className="hidden sm:inline-flex bg-gray-100 hover:bg-gray-200 text-[#1a1714] font-bold text-[13px] px-4 py-2.5 rounded-[8px] h-auto transition-all"
            >
              Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      {!user && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1714] via-[#2a2420] to-[#1a1714] text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1760774710019-311be09683cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWluJTIwY2xvdWRzJTIwd2VhdGhlciUyMHBhdHRlcm58ZW58MXx8fHwxNzcyNjU1NjU5fDA&ixlib=rb-4.1.0&q=80&w=1080')] bg-cover bg-center"></div>
          </div>
          <div className="relative max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 bg-[#0EA5E9]/20 border border-[#0EA5E9]/30 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
              <span className="text-[12px] font-semibold text-[#7dd3fc]">Weather Insurance Made Simple</span>
            </div>
            <h1 className="text-[42px] md:text-[56px] font-bold mb-6 leading-tight">
              Get Paid When It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#7dd3fc]">Rains</span>
            </h1>
            <p className="text-[18px] md:text-[20px] text-gray-300 max-w-[600px] mx-auto mb-8">
              Protect your business from unpredictable weather. Set your threshold, and get automatic payouts when conditions are met.
            </p>
            <Button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[16px] px-8 py-4 rounded-[10px] h-auto transition-all hover:shadow-xl hover:shadow-[#0EA5E9]/30 active:scale-[0.98]"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 md:py-12">
        {/* Progress Indicator */}
        {user && (
          <div className="mb-10">
            <div className="flex items-center justify-between max-w-[600px] mx-auto">
              {[
                { num: 1, label: "Create Policy", active: true },
                { num: 2, label: "Check Weather", active: policyCreated },
                { num: 3, label: "Get Payout", active: payoutConfirmed },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[16px] transition-all duration-300 ${step.active
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] text-white shadow-lg shadow-[#0EA5E9]/30"
                        : "bg-white border-2 border-[#e0dcd4] text-[#999999]"
                        }`}
                    >
                      {step.num}
                    </div>
                    <span
                      className={`text-[12px] mt-2 font-semibold ${step.active ? "text-[#0EA5E9]" : "text-[#999999]"
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${idx === 0 && policyCreated || idx === 1 && payoutConfirmed
                        ? "bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8]"
                        : "bg-[#e0dcd4]"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Step 1: Create Policy */}
          <Card
            className={`bg-white border-2 rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-300 ${!user
              ? "opacity-40 pointer-events-none border-[#e0dcd4]"
              : policyCreated
                ? "border-[#0EA5E9]/30"
                : "border-[#e0dcd4] hover:border-[#0EA5E9]/50"
              }`}
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                  <CloudRain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#0EA5E9] uppercase tracking-wider mb-1">
                    Step 1
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1a1714]">
                    Create Your Policy
                  </h2>
                </div>
              </div>

              <p className="text-[14px] text-[#6b6b6b] mb-6">
                Set your coverage parameters and get instant protection.
              </p>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="city"
                    className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    City / Location
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Nairobi, London, Miami"
                    value={policyData.city}
                    onChange={(e) =>
                      setPolicyData({ ...policyData, city: e.target.value })
                    }
                    disabled={isLoading || policyCreated}
                    className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="threshold"
                    className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide flex items-center gap-2"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Rain Threshold (mm)
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="50"
                    value={policyData.threshold}
                    onChange={(e) =>
                      setPolicyData({ ...policyData, threshold: e.target.value })
                    }
                    disabled={isLoading || policyCreated}
                    className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50"
                  />
                  <p className="text-[11px] text-[#999999]">
                    You'll get paid if rainfall exceeds this amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="payout"
                    className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide flex items-center gap-2"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Payout Amount (USD)
                  </Label>
                  <Input
                    id="payout"
                    type="number"
                    placeholder="500"
                    value={policyData.payout}
                    onChange={(e) =>
                      setPolicyData({ ...policyData, payout: e.target.value })
                    }
                    disabled={isLoading || policyCreated}
                    className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50"
                  />
                </div>

                <Button
                  onClick={handleCreatePolicy}
                  disabled={policyCreated || isLoading}
                  className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[14px] px-6 py-4 rounded-[10px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : policyCreated ? "✓ Policy Created" : "Create Policy"}
                </Button>

                {policyCreated && (
                  <div className="mt-6 bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] border-2 border-[#0EA5E9]/30 rounded-[12px] p-5 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-[#0EA5E9]" />
                      <span className="text-[13px] font-bold text-[#0EA5E9] uppercase tracking-wide">
                        Active Policy
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Location</div>
                        <div className="font-bold text-[#1a1714]">{policyData.city}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Threshold</div>
                        <div className="font-bold text-[#1a1714]">{policyData.threshold} mm</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 col-span-2">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Payout Amount</div>
                        <div className="text-[20px] font-bold text-[#0EA5E9]">${policyData.payout} USD</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Check Weather */}
          <Card
            className={`bg-white border-2 rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-300 ${!policyCreated
              ? "opacity-40 pointer-events-none border-[#e0dcd4]"
              : weatherData?.triggered
                ? "border-[#7dd3fc]/50"
                : "border-[#e0dcd4] hover:border-[#0EA5E9]/50"
              }`}
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#0EA5E9] uppercase tracking-wider mb-1">
                    Step 2
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1a1714]">
                    Check Weather
                  </h2>
                </div>
              </div>

              <p className="text-[14px] text-[#6b6b6b] mb-6">
                We'll check real-time weather data. If conditions are met, payout processes immediately.
              </p>

              <Button
                onClick={handleCheckWeather}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[14px] px-6 py-4 rounded-[10px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/30 active:scale-[0.98] mb-5 disabled:opacity-50"
              >
                {isLoading ? "Checking..." : "Check Weather Now"}
              </Button>

              {weatherData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`rounded-[12px] p-5 border-2 ${weatherData.triggered
                    ? "bg-gradient-to-br from-[#e0f2fe] to-[#f0f9ff] border-[#7dd3fc]"
                    : "bg-gradient-to-br from-[#fef2f2] to-[#fee2e2] border-[#f87171]/30"
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#6b6b6b]" />
                        <span className="text-[14px] font-bold text-[#1a1714]">
                          {weatherData.location}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-[#6b6b6b]">
                        {weatherData.temperature}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Rainfall</div>
                        <div className={`text-[20px] font-bold ${weatherData.triggered ? "text-[#0EA5E9]" : "text-[#f87171]"
                          }`}>
                          {weatherData.rainfall} mm
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Threshold</div>
                        <div className="text-[20px] font-bold text-[#1a1714]">
                          {weatherData.threshold} mm
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 p-3 rounded-lg ${weatherData.triggered
                      ? "bg-[#7dd3fc]/20"
                      : "bg-[#f87171]/10"
                      }`}>
                      {weatherData.triggered ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-[#0EA5E9]" />
                          <span className="text-[13px] font-bold text-[#0EA5E9]">
                            ✓ Conditions Met - Payout Eligible!
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-[#f87171]" />
                          <span className="text-[13px] font-bold text-[#f87171]">
                            Threshold Not Met
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {weatherData?.triggered && !payoutConfirmed && (
                    <Button
                      onClick={handleConfirmPayout}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#7dd3fc] to-[#0EA5E9] hover:from-[#38bdf8] hover:to-[#0284c7] text-white font-bold text-[14px] px-6 py-4 rounded-[10px] h-auto transition-all hover:shadow-lg hover:shadow-[#7dd3fc]/30 active:scale-[0.98] animate-pulse disabled:opacity-50"
                    >
                      {isLoading ? "Processing..." : "💰 Process Payout Now"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 3: Payout Confirmation - Full Width */}
        {payoutConfirmed && payoutData && (
          <Card className="mt-8 bg-white border-2 border-[#7dd3fc] rounded-[16px] shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7dd3fc] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-[#7dd3fc]/30">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#0EA5E9] uppercase tracking-wider mb-1">
                    Step 3 — Completed
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1a1714]">
                    Payout Confirmed
                  </h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Success Message */}
                <div className="flex flex-col justify-center items-center text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#38bdf8] flex items-center justify-center mb-6 animate-in zoom-in duration-700 shadow-2xl shadow-[#7dd3fc]/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-[28px] font-bold text-[#0EA5E9] mb-3">
                    ${payoutData.amount} USD
                  </h3>
                  <p className="text-[16px] text-[#6b6b6b] mb-2">
                    Successfully sent to
                  </p>
                  <p className="text-[14px] font-semibold text-[#1a1714]">
                    {user && getPayoutMethodLabel(user.payoutMethod)}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 bg-[#f0f9ff] px-4 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse"></div>
                    <span className="text-[12px] font-semibold text-[#0EA5E9]">
                      {payoutData.status}
                    </span>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-gradient-to-br from-[#1a1714] to-[#2a2420] text-white rounded-[12px] p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#7dd3fc]" />
                    </div>
                    <span className="text-[14px] font-bold text-white">
                      Transaction Details
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-start py-2">
                      <span className="text-[12px] text-gray-400">Transaction ID</span>
                      <span className="text-[11px] font-mono text-[#7dd3fc] text-right">
                        {payoutData.transactionId}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-[12px] text-gray-400">Recipient</span>
                      <span className="text-[12px] font-mono text-white text-right truncate max-w-[200px]">
                        {user?.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-[12px] text-gray-400">Amount</span>
                      <span className="text-[14px] font-bold text-[#7dd3fc] text-right">
                        ${payoutData.amount} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-[12px] text-gray-400">Payout Method</span>
                      <span className="text-[12px] text-white text-right">
                        {user && getPayoutMethodLabel(user.payoutMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-[12px] text-gray-400">Processing Fee</span>
                      <span className="text-[12px] text-[#7dd3fc] font-semibold text-right">
                        Free
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2 pt-4 border-t border-white/10">
                      <span className="text-[12px] text-gray-400">Confirmation</span>
                      <a
                        href="#"
                        className="text-[12px] text-[#7dd3fc] hover:text-[#38bdf8] text-right flex items-center gap-1 transition-colors"
                      >
                        View Email
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onSignIn={handleSignIn}
      />
    </div>
  );
}
