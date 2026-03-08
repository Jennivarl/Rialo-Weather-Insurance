import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Cloud,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function HomePage() {
  const features = [
    {
      icon: Shield,
      title: "Comprehensive Coverage",
      description:
        "Protect against rain, snow, wind, and extreme temperatures with customizable policies.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description:
        "Monitor weather patterns and risk levels with our advanced forecasting system.",
    },
    {
      icon: Clock,
      title: "Fast Claims",
      description:
        "Automated claim processing with payouts in as little as 48 hours.",
    },
    {
      icon: Users,
      title: "Expert Support",
      description:
        "24/7 dedicated support from weather insurance specialists.",
    },
  ];

  const insuranceTypes = [
    {
      icon: Cloud,
      title: "Agricultural Insurance",
      description: "Protect your crops and livestock from adverse weather.",
      image:
        "https://images.unsplash.com/photo-1688320243376-69b68a8f656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMGZhcm0lMjBmaWVsZHxlbnwxfHx8fDE3NzI1Nzc4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Users,
      title: "Event Insurance",
      description: "Safeguard outdoor events from weather cancellations.",
      image:
        "https://images.unsplash.com/photo-1521008457384-77bfd9b41e01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5ueSUyMGJsdWUlMjBza3klMjB3ZWF0aGVyfGVufDF8fHx8MTc3MjY1NDEwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: TrendingUp,
      title: "Business Insurance",
      description: "Protect revenue from weather-related disruptions.",
      image:
        "https://images.unsplash.com/photo-1696861270495-7f35c35c3273?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGluc3VyYW5jZSUyMGhhbmRzaGFrZXxlbnwxfHx8fDE3NzI2NTQxMDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Policies" },
    { value: "$50M+", label: "Claims Paid" },
    { value: "98%", label: "Customer Satisfaction" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1755119902734-813259581ae5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9ybSUyMGNsb3VkcyUyMHdlYXRoZXIlMjBkcmFtYXRpY3xlbnwxfHx8fDE3NzI2NTQxMDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Storm clouds"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
              Weather Insurance
              <br />
              <span className="text-blue-200">Made Simple</span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8">
              Protect your business from unpredictable weather. Get covered in
              minutes with our AI-powered risk assessment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/quote" className="text-lg">
                  Get a Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                <Link to="/dashboard" className="text-lg">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">
              Why Choose WeatherGuard?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced technology meets comprehensive coverage to protect what
              matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-500 transition-colors">
                <CardContent className="p-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">
              Coverage for Every Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tailored insurance solutions for different industries and events.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {insuranceTypes.map((type, index) => (
              <Card key={index} className="overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow">
                <div className="h-48 overflow-hidden">
                  <ImageWithFallback
                    src={type.image}
                    alt={type.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                      <type.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl">{type.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <Link
                    to="/quote"
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">
              Get Covered in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl mb-3">Enter Details</h3>
              <p className="text-gray-600">
                Tell us about your business, location, and coverage needs.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl mb-3">Get Instant Quote</h3>
              <p className="text-gray-600">
                Our AI analyzes weather data to provide accurate pricing.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl mb-3">Activate Coverage</h3>
              <p className="text-gray-600">
                Review, customize, and activate your policy instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Weather Coverage Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">
              Protection Against All Weather Events
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: CloudRain, label: "Heavy Rain", color: "blue" },
              { icon: CloudSnow, label: "Snow & Ice", color: "cyan" },
              { icon: Wind, label: "High Winds", color: "gray" },
              { icon: Sun, label: "Extreme Heat", color: "orange" },
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className={`bg-${item.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                </div>
                <p className="font-medium">{item.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl mb-6">
            Ready to Protect Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get a personalized quote in minutes. No commitment required.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/quote" className="text-lg">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
