import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Cloud,
  CloudRain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ArrowUpRight,
  Sun,
  Wind,
  Droplets,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Link } from "react-router";

export function DashboardPage() {
  // Mock data
  const policies = [
    {
      id: "WG-2024-001",
      type: "Agricultural",
      status: "Active",
      coverage: 150000,
      premium: 1250,
      expiry: "Dec 31, 2026",
      riskLevel: "Low",
    },
    {
      id: "WG-2024-002",
      type: "Event",
      status: "Active",
      coverage: 50000,
      premium: 450,
      expiry: "Apr 15, 2026",
      riskLevel: "Medium",
    },
    {
      id: "WG-2023-045",
      type: "Business",
      status: "Expired",
      coverage: 200000,
      premium: 1800,
      expiry: "Jan 20, 2026",
      riskLevel: "High",
    },
  ];

  const weatherData = [
    { date: "Mar 5", rainfall: 2.5, temp: 72, wind: 12 },
    { date: "Mar 6", rainfall: 0.8, temp: 75, wind: 8 },
    { date: "Mar 7", rainfall: 0, temp: 78, wind: 10 },
    { date: "Mar 8", rainfall: 1.2, temp: 73, wind: 15 },
    { date: "Mar 9", rainfall: 3.5, temp: 70, wind: 20 },
    { date: "Mar 10", rainfall: 2.0, temp: 68, wind: 18 },
    { date: "Mar 11", rainfall: 0.5, temp: 71, wind: 9 },
  ];

  const claimsData = [
    { month: "Oct", amount: 12000, count: 3 },
    { month: "Nov", amount: 8500, count: 2 },
    { month: "Dec", amount: 15000, count: 4 },
    { month: "Jan", amount: 5000, count: 1 },
    { month: "Feb", amount: 18000, count: 5 },
    { month: "Mar", amount: 10000, count: 2 },
  ];

  const recentClaims = [
    {
      id: "CLM-001",
      date: "Mar 1, 2026",
      type: "Heavy Rainfall",
      amount: 8500,
      status: "Approved",
    },
    {
      id: "CLM-002",
      date: "Feb 28, 2026",
      type: "Storm Damage",
      amount: 12000,
      status: "Processing",
    },
    {
      id: "CLM-003",
      date: "Feb 20, 2026",
      type: "Hail Damage",
      amount: 5500,
      status: "Approved",
    },
  ];

  const weatherAlerts = [
    {
      type: "warning",
      title: "Heavy Rain Expected",
      location: "Miami, FL",
      date: "Mar 12-14",
      severity: "Moderate",
    },
    {
      type: "info",
      title: "Temperature Drop",
      location: "Orlando, FL",
      date: "Mar 15",
      severity: "Low",
    },
  ];

  const stats = [
    {
      title: "Active Policies",
      value: "2",
      change: "+1",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Total Coverage",
      value: "$200K",
      change: "+$50K",
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Claims This Year",
      value: "17",
      change: "+5",
      icon: CheckCircle,
      color: "purple",
    },
    {
      title: "Weather Alerts",
      value: "2",
      change: "Active",
      icon: AlertTriangle,
      color: "orange",
    },
  ];

  return (
    <div className="min-h-screen bg-[#E8F0FA]">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back! Here's your weather insurance overview.
              </p>
            </div>
            <Button asChild>
              <Link to="/quote">Get New Quote</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg bg-${stat.color}-100`}
                  >
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl mb-4">Weather Alerts</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {weatherAlerts.map((alert, index) => (
                <Card
                  key={index}
                  className={`border-l-4 ${alert.type === "warning"
                      ? "border-l-orange-500 bg-orange-50"
                      : "border-l-blue-500 bg-blue-50"
                    }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${alert.type === "warning"
                            ? "bg-orange-100"
                            : "bg-blue-100"
                          }`}
                      >
                        {alert.type === "warning" ? (
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Cloud className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{alert.title}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Location: {alert.location}</p>
                          <p>Expected: {alert.date}</p>
                          <Badge
                            variant={
                              alert.severity === "Moderate"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-2"
                          >
                            {alert.severity} Severity
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Weather Forecast */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>7-Day Weather Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Rainfall (inches)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Temperature (°F)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle>Current Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <Sun className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                <div className="text-4xl font-bold mb-1">72°F</div>
                <div className="text-gray-600">Partly Cloudy</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <span className="font-semibold">65%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Wind Speed</span>
                  </div>
                  <span className="font-semibold">12 mph</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Precipitation</span>
                  </div>
                  <span className="font-semibold">20%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="policies" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="policies">My Policies</TabsTrigger>
            <TabsTrigger value="claims">Claims History</TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 mb-4 sm:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{policy.type} Insurance</h3>
                          <Badge
                            variant={
                              policy.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {policy.status}
                          </Badge>
                          <Badge
                            variant={
                              policy.riskLevel === "Low"
                                ? "secondary"
                                : policy.riskLevel === "Medium"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {policy.riskLevel} Risk
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Policy ID: {policy.id}</p>
                          <p>Coverage: ${policy.coverage.toLocaleString()}</p>
                          <p>Premium: ${policy.premium}/month</p>
                          <p>Expires: {policy.expiry}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {policy.status === "Active" && (
                          <Button size="sm" asChild>
                            <Link to="/claims">File Claim</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {claim.status === "Approved" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-orange-600" />
                          )}
                          <div>
                            <h4 className="font-semibold">{claim.type}</h4>
                            <div className="text-sm text-gray-600">
                              {claim.id} • {claim.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${claim.amount.toLocaleString()}
                          </div>
                          <Badge
                            variant={
                              claim.status === "Approved"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-1"
                          >
                            {claim.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/claims">
                      View All Claims
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Claims Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={claimsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Claims Count" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Claims (6mo)</span>
                      <span className="font-semibold">17</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid Out</span>
                      <span className="font-semibold">$68,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. Processing Time</span>
                      <span className="font-semibold">2.3 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
