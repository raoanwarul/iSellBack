import { Link } from 'react-router-dom'
import { ArrowLeft, Trash2, AlertTriangle, Mail, Shield, Clock, CheckCircle } from 'lucide-react'

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h1 className="text-lg font-bold text-gray-900">Delete Account</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
          
          {/* Warning Banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-800">Account Deletion is Permanent</h2>
              <p className="text-red-700 text-sm mt-1">
                Once your account is deleted, all your data will be permanently removed and cannot be recovered.
              </p>
            </div>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Account Deletion</h2>
            <p className="text-gray-600 leading-relaxed">
              At BuyBack Elite, we respect your right to control your personal data. You can request deletion of your account and all associated data at any time. This page explains the process and what data will be deleted.
            </p>
          </section>

          {/* How to Delete */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How to Delete Your Account</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Option 1: Delete from App (Recommended)</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-2">
                  <li>Open the BuyBack Elite app</li>
                  <li>Go to <strong>Profile</strong> tab</li>
                  <li>Scroll down to <strong>Data & Privacy</strong> section</li>
                  <li>Tap on <strong>Delete Account</strong></li>
                  <li>Confirm your decision</li>
                  <li>Your account will be deleted immediately</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Option 2: Request via Email</h3>
                <p className="text-gray-600 mb-3">
                  Send an email to our support team with your account deletion request:
                </p>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <a href="mailto:contact@buybackelite.com?subject=Account%20Deletion%20Request" 
                     className="text-blue-600 font-medium hover:underline">
                    contact@buybackelite.com
                  </a>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Please include your registered email address in the request. We will process your request within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* What Gets Deleted */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data That Will Be Deleted</h2>
            </div>
            <p className="text-gray-600 mb-4">
              When you delete your account, the following data will be permanently removed:
            </p>
            <ul className="space-y-2">
              {[
                'Your profile information (name, email, phone number)',
                'Your address and location data',
                'All sell request history',
                'Device photos you uploaded',
                'Payment information (UPI ID, bank details)',
                'Notification history',
                'App preferences and settings'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data Retention Period</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Some data may be retained for a limited period due to legal and regulatory requirements:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                <span><strong>Transaction records:</strong> Retained for 7 years for tax and legal compliance</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                <span><strong>KYC documents:</strong> Retained for 5 years as per RBI guidelines</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                <span><strong>Fraud prevention data:</strong> May be retained to prevent misuse</span>
              </li>
            </ul>
          </section>

          {/* Security Note */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Privacy is Protected</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We take your privacy seriously. All deletion requests are processed securely, and we ensure complete removal of your personal data from our active systems. Retained data (for legal compliance) is stored securely and is not used for any marketing or business purposes.
            </p>
          </section>

          {/* Contact Section */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about account deletion or data privacy, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:contact@buybackelite.com" className="text-blue-600 hover:underline">
                  contact@buybackelite.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Response Time:</strong> Within 48 hours
              </p>
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
