import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Target, Award, Heart, MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">About Us</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-4">About BuyBack Elite</h1>
          <p className="text-white/90 text-lg">
            India's most trusted platform for selling pre-owned Apple devices. We make selling your MacBooks and iPads simple, secure, and rewarding.
          </p>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Our Story</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            BuyBack Elite was founded with a simple mission: to provide Apple device owners with a hassle-free way to sell their pre-owned devices at the best possible prices.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            We understand that your Apple devices are valuable investments. That's why we've built a platform that offers transparent pricing, secure transactions, and doorstep pickup service across India.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our team of experts carefully evaluates each device to ensure you receive a fair and competitive price. With thousands of successful transactions, we've become India's go-to platform for Apple device buyback.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To revolutionize the pre-owned Apple device market by providing a seamless, transparent, and rewarding selling experience for every customer.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To become India's #1 trusted platform for Apple device buyback, known for our integrity, customer service, and commitment to sustainability.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Why Choose BuyBack Elite?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Best Prices</h3>
                <p className="text-sm text-gray-500">We offer the highest prices in the market for your Apple devices</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Free Pickup</h3>
                <p className="text-sm text-gray-500">Doorstep pickup service at your convenience, completely free</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Instant Payment</h3>
                <p className="text-sm text-gray-500">Get paid instantly via UPI or bank transfer upon pickup</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Process</h3>
                <p className="text-sm text-gray-500">Your data is safe with us. We ensure complete data wipe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 lg:p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">5000+</p>
              <p className="text-gray-400 text-sm">Devices Bought</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">₹2Cr+</p>
              <p className="text-gray-400 text-sm">Paid to Sellers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-gray-400 text-sm">Cities Covered</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4.8★</p>
              <p className="text-gray-400 text-sm">Customer Rating</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">contact@buybackelite.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">+91 8595611340</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">Shop No. 157, 1st Floor, The Great India Place, Noida</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Working Hours</p>
                  <p className="font-medium text-gray-900">Mon - Sat: 9 AM - 8 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
