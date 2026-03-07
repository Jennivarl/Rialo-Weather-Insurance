import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { X } from "lucide-react";
import { CloudRain } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, payoutMethod: string) => void;
}

export function AuthModal({ open, onOpenChange, onSignIn }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onSignIn(email, payoutMethod);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white border-[#e0dcd4] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#1a1714] to-[#2a2420] p-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633119641005-7187adf29b4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJhaW4lMjBzdG9ybXxlbnwxfHx8fDE3NzI2NTU2NTl8MA&ixlib=rb-4.1.0&q=80&w=1080')] bg-cover bg-center"></div>
          </div>
          <DialogHeader className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/30">
                  <CloudRain className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-[22px] font-bold text-white">
                  Welcome Back
                </DialogTitle>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <p className="text-[14px] text-gray-300">
              Sign in to manage your weather insurance
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/20 focus-visible:ring-offset-0 focus-visible:border-[#0EA5E9] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="payout"
              className="text-[11px] font-bold text-[#6b6b6b] uppercase tracking-wide"
            >
              Preferred Payout Method
            </Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger
                id="payout"
                className="bg-[#fafaf9] border-[#e0dcd4] text-[14px] px-4 py-3 h-auto rounded-[10px] focus:ring-2 focus:ring-[#0EA5E9]/20 focus:ring-offset-0 focus:border-[#0EA5E9] transition-all"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e0dcd4] rounded-[10px]">
                <SelectItem value="bank" className="rounded-[6px]">💳 Bank Account (ACH/Wire)</SelectItem>
                <SelectItem value="paypal" className="rounded-[6px]">🅿️ PayPal</SelectItem>
                <SelectItem value="bitcoin" className="rounded-[6px]">₿ Bitcoin</SelectItem>
                <SelectItem value="usdc" className="rounded-[6px]">💵 USDC Stablecoin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0EA5E9] text-white font-bold text-[14px] px-6 py-4 rounded-[10px] h-auto transition-all hover:shadow-lg hover:shadow-[#0EA5E9]/30 active:scale-[0.98]"
          >
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e0dcd4]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-[#999999]">
                Demo: Any email/password works
              </span>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}