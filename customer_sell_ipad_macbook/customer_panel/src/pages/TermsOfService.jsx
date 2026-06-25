import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, AlertCircle, CheckCircle, XCircle, Scale, CreditCard, Truck } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          
          {/* Last Updated */}
          <p className="text-sm text-gray-500 mb-6">Last Updated: March 17, 2026</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service ("Terms") govern your use of the BuyBack Elite mobile application and website (collectively, the "Service") operated by BuyBack Elite ("we," "us," or "our").
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          {/* Eligibility */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Eligibility</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>You must be at least 18 years old to use our Service</li>
              <li>You must be the legal owner of the device you wish to sell</li>
              <li>You must have the legal right to sell the device</li>
              <li>You must provide accurate and complete information</li>
              <li>You must be a resident of India</li>
            </ul>
          </section>

          {/* Services */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              BuyBack Elite provides a platform for selling used Apple devices (MacBooks and iPads). Our services include:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Device evaluation and price estimation</li>
              <li>Doorstep pickup service</li>
              <li>Device inspection and verification</li>
              <li>Secure payment processing</li>
            </ul>
          </section>

          {/* Selling Process */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Selling Process</h2>
            </div>
            <ol className="list-decimal list-inside text-gray-600 space-y-3 ml-4">
              <li><strong>Submit Request:</strong> Provide accurate device details and photos</li>
              <li><strong>Receive Quote:</strong> We will provide a price estimate based on your information</li>
              <li><strong>Accept/Negotiate:</strong> You may accept, counter, or reject our offer</li>
              <li><strong>Schedule Pickup:</strong> Once agreed, schedule a convenient pickup time</li>
              <li><strong>Device Inspection:</strong> Our agent will verify the device condition</li>
              <li><strong>Payment:</strong> Receive payment upon successful verification</li>
            </ol>
          </section>

          {/* Pricing */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pricing & Payment</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>All prices are quoted in Indian Rupees (INR)</li>
              <li>Prices are based on device condition, model, and market value</li>
              <li>Final price may differ if actual condition differs from description</li>
              <li>Payment is made via UPI, bank transfer, or other approved methods</li>
              <li>Payment is processed within 24-48 hours of successful pickup</li>
            </ul>
          </section>

          {/* Device Requirements */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Device Requirements</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              To sell your device, it must meet the following requirements:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Device must be genuine Apple product</li>
              <li>Device must not be stolen or lost</li>
              <li>Device must not be blacklisted or under contract</li>
              <li>Find My iPhone/Mac must be disabled</li>
              <li>Device must be factory reset before pickup</li>
              <li>All accounts must be signed out</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">User Responsibilities</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide accurate and truthful information about your device</li>
              <li>Upload clear and recent photos of your device</li>
              <li>Be available at the scheduled pickup time</li>
              <li>Backup and erase all personal data before pickup</li>
              <li>Provide valid identification for verification</li>
              <li>Not engage in fraudulent activities</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Prohibited Activities</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Selling stolen or illegally obtained devices</li>
              <li>Providing false or misleading information</li>
              <li>Attempting to manipulate pricing or reviews</li>
              <li>Using the service for any illegal purpose</li>
              <li>Interfering with the proper functioning of the service</li>
              <li>Creating multiple accounts for fraudulent purposes</li>
            </ul>
          </section>

          {/* Cancellation */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cancellation Policy</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>You may cancel your sell request at any time before pickup</li>
              <li>Repeated cancellations may result in account restrictions</li>
              <li>We reserve the right to cancel requests that violate our terms</li>
              <li>No cancellation fees apply for legitimate cancellations</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Limitation of Liability</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, BuyBack Elite shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-600 leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in New Delhi, India, and the language of arbitration shall be English.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding shall be brought exclusively in the courts located in New Delhi, India.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700"><strong>BuyBack Elite</strong></p>
              <p className="text-gray-600">Website: <a href="https://buybackelite.com" className="text-primary-600 hover:underline">buybackelite.com</a></p>
              <p className="text-gray-600">Email: <a href="mailto:contact@buybackelite.com" className="text-primary-600 hover:underline">contact@buybackelite.com</a></p>
              <p className="text-gray-600">Phone: +91 8595611340</p>
              <p className="text-gray-600">Address: Shop No. 157, 1st Floor, The Great India Place, Noida</p>
            </div>
          </section>

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
