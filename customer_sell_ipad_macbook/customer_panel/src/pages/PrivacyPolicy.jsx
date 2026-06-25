import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Trash2, Mail } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">Privacy Policy</h1>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to BuyBack Elite ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Name:</strong> To identify you and personalize your experience</li>
              <li><strong>Email Address:</strong> For account creation, communication, and notifications</li>
              <li><strong>Phone Number:</strong> For pickup coordination and customer support</li>
              <li><strong>Address:</strong> For device pickup scheduling</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Device Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Device Type:</strong> MacBook or iPad model information</li>
              <li><strong>Device Condition:</strong> Physical and functional condition details</li>
              <li><strong>Device Photos:</strong> Images of your device for evaluation</li>
              <li><strong>IMEI/Serial Number:</strong> For device verification and fraud prevention</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Device type and operating system</li>
              <li>IP address and browser type</li>
              <li>App usage data and analytics</li>
              <li>Location data (only when you grant permission for pickup)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Process your device sell requests and provide price estimates</li>
              <li>Coordinate device pickup with our agents</li>
              <li>Communicate with you about your requests and transactions</li>
              <li>Send you updates, notifications, and promotional offers (with your consent)</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data Security</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-3">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Secure cloud storage with industry-standard encryption</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> With pickup agents to complete your device collection</li>
              <li><strong>Payment Processors:</strong> To process your payments securely</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data Retention</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law. Transaction records are retained for 7 years for legal and accounting purposes.
            </p>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Push Notifications</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We may send you push notifications regarding your sell requests, pickup status, and promotional offers. You can opt-out of push notifications at any time through your device settings.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date. You are advised to review this privacy policy periodically for any changes.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you have any questions about this Privacy Policy, please contact us:
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
