import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { RialoLogo } from "../components/RialoLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle, CloudRain, Droplets, MapPin, TrendingUp, AlertCircle, Sparkles, ExternalLink, Camera, X, Thermometer, Wind, Navigation, Copy } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../services/api";

interface PolicyData {
  city: string;
  threshold: string;
  payout: string;
  weatherType: 'rainfall' | 'temperature' | 'wind';
  triggerDirection: 'above' | 'below';
  coverageDays: 1 | 3 | 7;
  useCoordinates: boolean;
  lat: string;
  lon: string;
}

interface WeatherData {
  location: string;
  rainfall: number;
  threshold: number;
  condition: string;
  temperature: string;
  triggered: boolean;
  weather_type?: string;
  trigger_direction?: string;
  coverage_days?: number;
  unit?: string;
}

interface PayoutData {
  transactionId: string;
  amount: number;
  status: string;
  explorerUrl?: string | null;
}

interface HistoryItem {
  id: string;
  city: string;
  threshold: number;
  payout: number;
  status: string;
  txId: string;
  explorerUrl?: string | null;
  date: string;
}

export function PayOnRainAppWithBackend() {
  const { ready: privyReady, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const walletAddress = solanaWallet?.address;
  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;
  const emailAddress = user?.email?.address || '';
  const emailInitial = emailAddress ? emailAddress[0].toUpperCase() : (displayAddress ? displayAddress[0].toUpperCase() : '?');

  const [policyData, setPolicyData] = useState<PolicyData>({
    city: "",
    threshold: "",
    payout: "",
    weatherType: 'rainfall',
    triggerDirection: 'above',
    coverageDays: 1,
    useCoordinates: false,
    lat: "",
    lon: "",
  });
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [canonicalLocation, setCanonicalLocation] = useState<string | null>(null);
  const [policyCreated, setPolicyCreated] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [policyHistory, setPolicyHistory] = useState<HistoryItem[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem('payonrain_username') || '');
  const [pfpUrl, setPfpUrl] = useState(() => localStorage.getItem('payonrain_pfp') || '');
  const [walletBalance, setWalletBalance] = useState<{ sol: number; usdc: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fixed premium model: $2 premium → $10 payout (5×)
  const PREMIUM = 2;
  const PAYOUT = 10;

  // Auto-faucet + balance fetch on login
  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    // Fetch balance
    apiClient.getBalance(walletAddress).then(b => setWalletBalance(b)).catch(() => { });
    // Faucet: trigger once per wallet if not already done
    const faucetKey = `payonrain_fauceted_${walletAddress}`;
    if (!localStorage.getItem(faucetKey)) {
      apiClient.requestFaucet(walletAddress)
        .then(res => {
          if (res.success) {
            localStorage.setItem(faucetKey, 'true');
            toast.success('🎉 $10 USDC added to your wallet to get started!');
            apiClient.getBalance(walletAddress).then(b => setWalletBalance(b)).catch(() => { });
          }
        })
        .catch(err => {
          // 409 = already fauceted (mark locally so we don't retry)
          if (err.message?.includes('already used')) localStorage.setItem(faucetKey, 'true');
        });
    }
  }, [authenticated, walletAddress]);

  const handleNewPolicy = () => {
    if (policyId && policyData.city) {
      setPolicyHistory(prev => [...prev, {
        id: policyId,
        city: canonicalLocation || policyData.city,
        threshold: parseFloat(policyData.threshold) || 0,
        payout: parseFloat(policyData.payout) || 0,
        status: payoutConfirmed ? 'paid' : (weatherData?.triggered ? 'triggered' : 'active'),
        txId: payoutData?.transactionId || '',
        explorerUrl: payoutData?.explorerUrl,
        date: new Date().toLocaleDateString(),
      }]);
    }
    setPolicyData({ city: "", threshold: "", payout: "", weatherType: 'rainfall', triggerDirection: 'above', coverageDays: 1, useCoordinates: false, lat: "", lon: "" });
    setPolicyId(null);
    setCanonicalLocation(null);
    setPolicyCreated(false);
    setWeatherData(null);
    setPayoutData(null);
    setPayoutConfirmed(false);
    toast.success("Ready to create a new policy!");
  };

  const handleCreatePolicy = async () => {
    const cityOrCoords = policyData.useCoordinates ? (policyData.lat && policyData.lon) : policyData.city;
    if (!cityOrCoords || !policyData.threshold) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!walletAddress) {
      toast.error("Wallet not ready yet — please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Parameters<typeof apiClient.createPolicy>[0] = {
        city: policyData.useCoordinates ? `${policyData.lat},${policyData.lon}` : policyData.city,
        threshold: parseFloat(policyData.threshold),
        payout: PAYOUT,
        walletAddress,
        weather_type: policyData.weatherType,
        trigger_direction: policyData.triggerDirection,
        coverage_days: policyData.coverageDays,
      };
      if (policyData.useCoordinates) {
        payload.lat = parseFloat(policyData.lat);
        payload.lon = parseFloat(policyData.lon);
        payload.city = `${policyData.lat},${policyData.lon}`;
      }

      const response = await apiClient.createPolicy(payload);
      setPolicyId(response.id);
      if (response.location) setCanonicalLocation(response.location);
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
        weather_type: response.weather_type,
        trigger_direction: response.trigger_direction,
        coverage_days: response.coverage_days,
        unit: response.unit,
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
    if (!weatherData?.triggered || !policyId) {
      return;
    }

    setIsLoading(true);
    try {
      // Trigger on-chain USDC transfer via backend oracle
      const response = await apiClient.processPayout({
        policy_id: policyId,
        payout_method: 'usdc',
      });

      setPayoutData({
        transactionId: response.transaction_id,
        amount: response.amount,
        status: response.status,
        explorerUrl: response.solana_explorer_url,
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

  const getPayoutMethodLabel = (_method: string) => "USDC (Solana Devnet)";
  void getPayoutMethodLabel;

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

          {authenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-[13px] font-semibold text-[#1a1714]">
                  {username || emailAddress || "Account"}
                </div>
                <div className="text-[11px] font-mono text-[#6b6b6b]">
                  {displayAddress || "Setting up wallet..."}
                </div>
              </div>
              {policyCreated && (
                <Button
                  onClick={handleNewPolicy}
                  className="bg-white border-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white font-bold text-[13px] px-4 py-2 rounded-[8px] h-auto transition-all"
                >
                  New Policy
                </Button>
              )}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center text-white font-bold text-[14px] focus:outline-none hover:opacity-90 transition-opacity"
                >
                  {pfpUrl ? (
                    <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{emailInitial}</span>
                  )}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 bg-white border border-[#e0dcd4] rounded-[12px] shadow-xl p-4 w-[260px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-[#1a1714]">Profile</span>
                        <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center mb-4">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center text-white font-bold text-[22px] hover:opacity-80 transition-opacity group"
                        >
                          {pfpUrl ? (
                            <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span>{emailInitial}</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </button>
                        <span className="text-[11px] text-[#6b6b6b] mt-2">Click to change photo</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Email</label>
                          <div className="text-[13px] text-[#1a1714] bg-[#f5f5f4] px-3 py-2 rounded-lg truncate">{emailAddress || displayAddress || '—'}</div>
                        </div>
                        {walletAddress && (
                          <div>
                            <label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Wallet</label>
                            <div className="flex items-center gap-2 bg-[#f5f5f4] px-3 py-2 rounded-lg">
                              <span className="text-[12px] font-mono text-[#1a1714] flex-1 truncate">{displayAddress}</span>
                              <button onClick={() => { navigator.clipboard.writeText(walletAddress); toast.success('Copied!'); }} className="text-[#6b6b6b] hover:text-[#0EA5E9] shrink-0">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        {walletBalance && (
                          <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] border border-[#0EA5E9]/20 rounded-lg px-3 py-3">
                            <label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-2">Balances</label>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-[18px] font-bold text-[#0EA5E9]">${walletBalance.usdc.toFixed(2)}</div>
                                <div className="text-[10px] text-[#6b6b6b]">USDC</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[15px] font-bold text-[#1a1714]">{walletBalance.sol.toFixed(4)}</div>
                                <div className="text-[10px] text-[#6b6b6b]">SOL</div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Display Name</label>
                          <input
                            type="text"
                            placeholder="Your name"
                            value={username}
                            onChange={e => {
                              setUsername(e.target.value);
                              localStorage.setItem('payonrain_username', e.target.value);
                            }}
                            className="w-full text-[13px] bg-[#fafaf9] border border-[#e0dcd4] px-3 py-2 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Policies Created</label>
                          <div className="text-[13px] font-bold text-[#1a1714] bg-[#f5f5f4] px-3 py-2 rounded-lg">{policyHistory.length + (policyCreated ? 1 : 0)}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const url = ev.target?.result as string;
                      setPfpUrl(url);
                      localStorage.setItem('payonrain_pfp', url);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>
          ) : (
            <Button
              onClick={login}
              disabled={!privyReady}
              className="bg-[#0EA5E9] hover:bg-[#0284c7] text-white font-bold text-[14px] px-6 py-2.5 rounded-[8px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/20 active:scale-[0.98] disabled:opacity-50"
            >
              Sign In
            </Button>
          )}
          {authenticated && (
            <Button
              onClick={() => {
                logout();
                handleNewPolicy();
                toast.success("Disconnected.");
              }}
              className="hidden sm:inline-flex bg-gray-100 hover:bg-gray-200 text-[#1a1714] font-bold text-[13px] px-4 py-2.5 rounded-[8px] h-auto transition-all"
            >
              Disconnect
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      {!authenticated && (
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
              onClick={login}
              disabled={!privyReady}
              className="bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[16px] px-8 py-4 rounded-[10px] h-auto transition-all hover:shadow-xl hover:shadow-[#0EA5E9]/30 active:scale-[0.98] disabled:opacity-50"
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 md:py-12">
        {/* Progress Indicator */}
        {authenticated && (
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Step 1: Create Policy */}
          <Card
            className={`bg-white border-2 rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-300 ${!authenticated
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
                {/* Weather Type */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block">
                    Weather Type
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { val: 'rainfall', label: 'Rainfall', icon: <Droplets className="w-4 h-4" /> },
                      { val: 'temperature', label: 'Temp', icon: <Thermometer className="w-4 h-4" /> },
                      { val: 'wind', label: 'Wind', icon: <Wind className="w-4 h-4" /> },
                    ] as const).map(opt => (
                      <button
                        key={opt.val}
                        disabled={policyCreated}
                        onClick={() => setPolicyData(p => ({ ...p, weatherType: opt.val }))}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-[10px] text-[12px] font-semibold border-2 transition-all disabled:opacity-50 ${policyData.weatherType === opt.val ? 'border-[#0EA5E9] bg-[#f0f9ff] text-[#0EA5E9]' : 'border-[#e0dcd4] text-[#6b6b6b] hover:border-[#0EA5E9]/40'}`}
                      >
                        {opt.icon}{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      Location
                    </Label>
                    <button
                      disabled={policyCreated}
                      onClick={() => setPolicyData(p => ({ ...p, useCoordinates: !p.useCoordinates }))}
                      className="text-[11px] text-[#0EA5E9] font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <Navigation className="w-3 h-3" />
                      {policyData.useCoordinates ? 'Use city name' : 'Use GPS coords'}
                    </button>
                  </div>
                  {policyData.useCoordinates ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Latitude e.g. -1.28" value={policyData.lat}
                        onChange={e => setPolicyData(p => ({ ...p, lat: e.target.value }))}
                        disabled={isLoading || policyCreated}
                        className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50" />
                      <Input placeholder="Longitude e.g. 36.82" value={policyData.lon}
                        onChange={e => setPolicyData(p => ({ ...p, lon: e.target.value }))}
                        disabled={isLoading || policyCreated}
                        className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50" />
                    </div>
                  ) : (
                    <Input
                      id="city"
                      placeholder="e.g., Nairobi, London, Miami"
                      value={policyData.city}
                      onChange={e => setPolicyData({ ...policyData, city: e.target.value })}
                      disabled={isLoading || policyCreated}
                      className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50"
                    />
                  )}
                </div>

                {/* Trigger Direction + Threshold */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5" />
                    Trigger Condition
                  </Label>
                  <div className="flex gap-2">
                    <div className="grid grid-cols-2 gap-1">
                      {(['above', 'below'] as const).map(dir => (
                        <button key={dir}
                          disabled={policyCreated}
                          onClick={() => setPolicyData(p => ({ ...p, triggerDirection: dir }))}
                          className={`px-3 py-2 rounded-[8px] text-[12px] font-semibold border-2 transition-all disabled:opacity-50 ${policyData.triggerDirection === dir ? 'border-[#0EA5E9] bg-[#f0f9ff] text-[#0EA5E9]' : 'border-[#e0dcd4] text-[#6b6b6b] hover:border-[#0EA5E9]/40'}`}
                        >
                          {dir === 'above' ? '↑ Above' : '↓ Below'}
                        </button>
                      ))}
                    </div>
                    <Input
                      id="threshold"
                      type="number"
                      placeholder={policyData.weatherType === 'rainfall' ? '50' : policyData.weatherType === 'temperature' ? '35' : '60'}
                      value={policyData.threshold}
                      onChange={e => setPolicyData({ ...policyData, threshold: e.target.value })}
                      disabled={isLoading || policyCreated}
                      className="flex-1 bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all disabled:opacity-50"
                    />
                  </div>
                  <p className="text-[11px] text-[#999999]">
                    {policyData.weatherType === 'rainfall' ? 'mm of rain' : policyData.weatherType === 'temperature' ? '°C temperature' : 'km/h wind speed'}
                    {' '}{policyData.triggerDirection === 'above' ? 'exceeds' : 'drops below'} this value
                  </p>
                </div>

                {/* Coverage Period */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide block">
                    Coverage Period
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 3, 7] as const).map(d => (
                      <button key={d}
                        disabled={policyCreated}
                        onClick={() => setPolicyData(p => ({ ...p, coverageDays: d }))}
                        className={`py-2 rounded-[8px] text-[12px] font-semibold border-2 transition-all disabled:opacity-50 ${policyData.coverageDays === d ? 'border-[#0EA5E9] bg-[#f0f9ff] text-[#0EA5E9]' : 'border-[#e0dcd4] text-[#6b6b6b] hover:border-[#0EA5E9]/40'}`}
                      >
                        {d} Day{d > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Premium + Payout callout */}
                <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] border border-[#0EA5E9]/30 rounded-[10px] px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-0.5">Premium</div>
                    <div className="text-[18px] font-bold text-[#1a1714]">${PREMIUM}.00</div>
                  </div>
                  <div className="text-[#94a3b8] text-[20px] font-light">→</div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-0.5">If Triggered</div>
                    <div className="text-[18px] font-bold text-[#0EA5E9]">${PAYOUT}.00 USDC</div>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePolicy}
                  disabled={policyCreated || isLoading}
                  className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[14px] px-6 py-4 rounded-[10px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : policyCreated ? "✓ Policy Created" : `Pay $${PREMIUM} & Create Policy`}
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
                        <div className="font-bold text-[#1a1714]">{canonicalLocation || policyData.city}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Threshold</div>
                        <div className="font-bold text-[#1a1714]">
                          {policyData.triggerDirection === 'above' ? '↑' : '↓'} {policyData.threshold}
                          {policyData.weatherType === 'rainfall' ? 'mm' : policyData.weatherType === 'temperature' ? '°C' : 'km/h'}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Type</div>
                        <div className="font-bold text-[#1a1714] capitalize">{policyData.weatherType}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Period</div>
                        <div className="font-bold text-[#1a1714]">{policyData.coverageDays} day{policyData.coverageDays > 1 ? 's' : ''}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 col-span-2">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Payout if Triggered</div>
                        <div className="text-[20px] font-bold text-[#0EA5E9]">${PAYOUT} USDC</div>
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
                        <div className="text-[11px] text-[#6b6b6b] mb-1 capitalize">{weatherData.weather_type || 'Rainfall'}</div>
                        <div className={`text-[20px] font-bold ${weatherData.triggered ? "text-[#0EA5E9]" : "text-[#f87171]"}`}>
                          {weatherData.rainfall} {weatherData.unit || 'mm'}
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-[11px] text-[#6b6b6b] mb-1">Threshold</div>
                        <div className="text-[20px] font-bold text-[#1a1714]">
                          {weatherData.trigger_direction === 'below' ? '↓' : '↑'} {weatherData.threshold} {weatherData.unit || 'mm'}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] mb-2">
                        <span className="text-[#6b6b6b]">Current: <strong className={weatherData.triggered ? "text-[#0EA5E9]" : "text-[#1a1714]"}>{weatherData.rainfall}{weatherData.unit || 'mm'}</strong></span>
                        <span className="text-[#6b6b6b]">Trigger: <strong className="text-[#1a1714]">{weatherData.trigger_direction === 'below' ? '↓' : '↑'}{weatherData.threshold}{weatherData.unit || 'mm'}</strong></span>
                      </div>
                      <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${weatherData.triggered
                            ? "bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8]"
                            : "bg-gradient-to-r from-[#94a3b8] to-[#64748b]"
                            }`}
                          style={{ width: `${Math.min(100, (weatherData.rainfall / weatherData.threshold) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#999] mt-1">
                        <span>0{weatherData.unit || 'mm'}</span>
                        <span className={weatherData.triggered ? "text-[#0EA5E9] font-semibold" : ""}>⚡ {weatherData.threshold}{weatherData.unit || 'mm'}</span>
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

          {/* Step 3: Get Payout */}
          <Card
            className={`bg-white border-2 rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-300 ${!weatherData?.triggered
              ? "opacity-40 pointer-events-none border-[#e0dcd4]"
              : payoutConfirmed
                ? "border-[#7dd3fc]/50"
                : "border-[#e0dcd4] hover:border-[#0EA5E9]/50"
              }`}
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${payoutConfirmed ? "bg-gradient-to-br from-[#7dd3fc] to-[#38bdf8] shadow-[#7dd3fc]/20" : "bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] shadow-[#0EA5E9]/20"}`}>
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#0EA5E9] uppercase tracking-wider mb-1">
                    Step 3
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1a1714]">
                    {payoutConfirmed ? "Payout Confirmed" : "Get Payout"}
                  </h2>
                </div>
              </div>

              {!payoutConfirmed ? (
                <p className="text-[14px] text-[#6b6b6b]">
                  Once weather conditions are met, your payout will be processed automatically via USDC on Solana.
                </p>
              ) : payoutData && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#38bdf8] flex items-center justify-center mb-3 shadow-xl shadow-[#7dd3fc]/30 animate-in zoom-in duration-700">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-[34px] font-bold text-[#0EA5E9] leading-none">${payoutData.amount}</div>
                    <div className="text-[14px] text-[#6b6b6b] mt-1">USD · USDC · Solana Devnet</div>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-[#f0f9ff] px-3 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                      <span className="text-[11px] font-semibold text-[#0EA5E9]">{payoutData.status}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1a1714] to-[#2a2420] rounded-[10px] p-4 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] text-gray-400 shrink-0">Tx ID</span>
                      <span className="text-[10px] font-mono text-[#7dd3fc] text-right break-all">{payoutData.transactionId}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] text-gray-400 shrink-0">Recipient</span>
                      <span className="text-[11px] font-mono text-[#7dd3fc]">{displayAddress || "—"}</span>
                    </div>
                    {payoutData.explorerUrl && (
                      <div className="pt-2 border-t border-white/10">
                        <a href={payoutData.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#7dd3fc] hover:text-white flex items-center gap-1 transition-colors">
                          View on Solana Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleNewPolicy}
                    className="w-full bg-white border-2 border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white font-bold text-[13px] px-4 py-2.5 rounded-[8px] h-auto transition-all"
                  >
                    + New Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Policy Monitor */}
        {policyCreated && (
          <div className="mt-8 bg-white border-2 border-[#0EA5E9]/25 rounded-[16px] shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${payoutConfirmed ? "bg-[#38bdf8]" : "bg-[#0EA5E9] animate-pulse"
                  }`} />
                <h3 className="text-[15px] font-bold text-[#1a1714]">Active Policy Monitor</h3>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${payoutConfirmed
                ? "bg-[#e0f2fe] text-[#0EA5E9]"
                : weatherData?.triggered
                  ? "bg-amber-100 text-amber-600"
                  : "bg-[#f0f9ff] text-[#0EA5E9]"
                }`}>
                {payoutConfirmed ? "✓ Paid Out" : weatherData?.triggered ? "⚡ Triggered" : "● Monitoring"}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#fafaf9] border border-[#e0dcd4] rounded-[10px] p-4">
                <div className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-1">Location</div>
                <div className="text-[15px] font-bold text-[#1a1714]">{canonicalLocation || policyData.city}</div>
              </div>
              <div className="bg-[#fafaf9] border border-[#e0dcd4] rounded-[10px] p-4">
                <div className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-1">Trigger</div>
                <div className="text-[15px] font-bold text-[#1a1714]">
                  {policyData.triggerDirection === 'above' ? '↑' : '↓'} {policyData.threshold}
                  {policyData.weatherType === 'rainfall' ? 'mm' : policyData.weatherType === 'temperature' ? '°C' : 'km/h'}
                  {' · '}<span className="capitalize text-[13px]">{policyData.weatherType}</span>
                </div>
              </div>
              <div className="bg-[#f0f9ff] border border-[#0EA5E9]/20 rounded-[10px] p-4">
                <div className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-1">Potential Payout</div>
                <div className="text-[15px] font-bold text-[#0EA5E9]">${PAYOUT} USDC</div>
              </div>
            </div>

            {weatherData ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-bold text-[#6b6b6b] uppercase tracking-wide">Weather Tracking</span>
                  <span className="text-[12px] text-[#6b6b6b]">{weatherData.location} · {weatherData.temperature}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px] text-[#6b6b6b]">
                    Current {weatherData.weather_type || 'rainfall'}: <strong className={`text-[16px] ${weatherData.triggered ? "text-[#0EA5E9]" : "text-[#1a1714]"}`}>{weatherData.rainfall}{weatherData.unit || 'mm'}</strong>
                  </span>
                  <span className="text-[14px] text-[#6b6b6b]">
                    Trigger: <strong className="text-[16px] text-[#1a1714]">{weatherData.trigger_direction === 'below' ? '↓' : '↑'}{weatherData.threshold}{weatherData.unit || 'mm'}</strong>
                  </span>
                </div>
                <div className="w-full h-5 bg-[#e0f2fe] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${weatherData.triggered
                      ? "bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8]"
                      : "bg-gradient-to-r from-[#94a3b8] to-[#64748b]"
                      }`}
                    style={{ width: `${Math.min(100, (weatherData.rainfall / weatherData.threshold) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#999] mt-1.5">
                  <span>0{weatherData.unit || 'mm'}</span>
                  <span className={weatherData.triggered ? "font-bold text-[#0EA5E9]" : ""}>
                    ⚡ Trigger at {weatherData.trigger_direction === 'below' ? '↓' : ''}{weatherData.threshold}{weatherData.unit || 'mm'}{weatherData.triggered ? " — Met!" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#e0dcd4] rounded-[12px] py-5 text-center">
                <CloudRain className="w-6 h-6 text-[#c0c0c0] mx-auto mb-2" />
                <p className="text-[13px] text-[#6b6b6b]">Click <strong>Check Weather Now</strong> in Step 2 to see live tracking</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Policy History */}
      {authenticated && policyHistory.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 md:px-10 pb-12">
          <h3 className="text-[18px] font-bold text-[#1a1714] mb-5 flex items-center gap-2">
            <span>My Policy History</span>
            <span className="bg-[#0EA5E9] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{policyHistory.length}</span>
          </h3>
          <div className="space-y-3">
            {policyHistory.map(item => (
              <div key={item.id} className="bg-white border border-[#e0dcd4] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[11px] text-[#6b6b6b] mb-0.5">Location</div>
                    <div className="text-[14px] font-bold text-[#1a1714]">{item.city}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6b6b6b] mb-0.5">Threshold</div>
                    <div className="text-[14px] font-bold text-[#1a1714]">{item.threshold} mm</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6b6b6b] mb-0.5">Payout</div>
                    <div className="text-[14px] font-bold text-[#0EA5E9]">${item.payout} USD</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6b6b6b] mb-0.5">Date</div>
                    <div className="text-[14px] text-[#1a1714]">{item.date}</div>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${item.status === 'paid' ? 'bg-[#dcfce7] text-[#16a34a]' :
                    item.status === 'triggered' ? 'bg-[#fef9c3] text-[#ca8a04]' :
                      'bg-[#f1f5f9] text-[#475569]'
                    }`}>{item.status.toUpperCase()}</span>
                  {item.txId && (
                    <a
                      href={item.explorerUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-[#0EA5E9] hover:underline truncate max-w-[180px]"
                    >
                      {item.txId.slice(0, 8)}...{item.txId.slice(-6)}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
