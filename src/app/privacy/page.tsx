export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-blue-100">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              
              {/* Introduction */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  At OpenOutings ("we", "our", or "us"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and protect your information when you use our website and services (the "Service").
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  This policy complies with the General Data Protection Regulation (GDPR) and other applicable data protection laws. If you have any questions about this policy, please contact us at the details provided at the end of this document.
                </p>
              </section>

              {/* Data Controller */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Data Controller</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  OpenOutings is the data controller responsible for your personal data. Our contact details are:
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Email: <a href="mailto:privacy@openoutings.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@openoutings.com</a><br />
                    Website: <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">openoutings.com/contact</a>
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">2.1 Information You Provide</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We collect information you directly provide when using our Service:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Account Information:</strong> Name, email address, password, profile photo, bio, date of birth</li>
                  <li><strong>Profile Data:</strong> Interests, location, gender preferences, cover photos</li>
                  <li><strong>Event Information:</strong> Event titles, descriptions, photos, locations, dates, capacity, pricing</li>
                  <li><strong>Communications:</strong> Messages you send through contact forms, reviews, ratings</li>
                  <li><strong>Payment Information:</strong> If we implement payment features, we will collect payment details through secure third-party processors</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We automatically collect certain information when you use the Service:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                  <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address, precise location if you grant permission</li>
                  <li><strong>Cookies and Similar Technologies:</strong> See Section 5 for details</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">2.3 Information From Third Parties</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  If you sign up using third-party authentication (e.g., Google, Facebook), we receive basic profile information from those services, such as your name, email address, and profile picture.
                </p>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We use your personal data for the following purposes:
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">3.1 To Provide the Service</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li>Create and manage your account</li>
                  <li>Enable you to create, discover, and join events</li>
                  <li>Show your profile to other users</li>
                  <li>Display event attendee lists</li>
                  <li>Process check-ins and verify attendance</li>
                  <li>Enable the review system</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">3.2 To Improve and Personalize</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li>Recommend events based on your interests</li>
                  <li>Show location-relevant events</li>
                  <li>Improve Service functionality and user experience</li>
                  <li>Develop new features</li>
                  <li>Analyze usage patterns</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">3.3 To Communicate</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li>Send service notifications and updates</li>
                  <li>Respond to your inquiries</li>
                  <li>Send event reminders (when implemented)</li>
                  <li>Send marketing communications (with your consent)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">3.4 For Safety and Security</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  <li>Prevent fraud and abuse</li>
                  <li>Monitor for suspicious activity</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect user safety</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">3.5 Legal Basis (GDPR)</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Under GDPR, we process your data based on:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                  <li><strong>Contract Performance:</strong> To provide the Service you signed up for</li>
                  <li><strong>Legitimate Interests:</strong> To improve our Service, prevent fraud, and ensure security</li>
                  <li><strong>Consent:</strong> For marketing communications and optional features</li>
                  <li><strong>Legal Obligations:</strong> To comply with laws and regulations</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. How We Share Your Information</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">4.1 Public Information</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  The following information is publicly visible to all users:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Profile information (name, photo, bio, interests)</li>
                  <li>Events you create or attend</li>
                  <li>Reviews you write or receive</li>
                  <li>Event check-in status (verified attendance)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">4.2 Service Providers</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We share data with third-party service providers who help us operate the Service:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Supabase:</strong> Database hosting and authentication</li>
                  <li><strong>Vercel:</strong> Website hosting and deployment</li>
                  <li><strong>Image Storage Providers:</strong> For storing profile and event photos</li>
                  <li><strong>Analytics Providers:</strong> For understanding Service usage</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  These providers are contractually obligated to protect your data and use it only for the purposes we specify.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">4.3 Legal Requirements</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We may disclose your information if required by law, legal process, or government request, or to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Comply with legal obligations</li>
                  <li>Protect our rights and property</li>
                  <li>Prevent fraud or illegal activity</li>
                  <li>Protect user safety</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">4.4 Business Transfers</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  If we are involved in a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before your data is transferred and becomes subject to a different privacy policy.
                </p>
              </section>

              {/* Cookies */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences (e.g., dark mode)</li>
                  <li>Understand how you use the Service</li>
                  <li>Improve performance and security</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Types of Cookies We Use</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                  <li><strong>Performance Cookies:</strong> Improve loading times and functionality</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  You can control cookies through your browser settings. Note that disabling essential cookies may affect Service functionality.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We retain your personal data for as long as necessary to provide the Service and comply with legal obligations:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Account Data:</strong> Until you delete your account, plus 30 days for backup recovery</li>
                  <li><strong>Event Data:</strong> Past events remain visible for historical purposes unless deleted</li>
                  <li><strong>Reviews:</strong> Retained to maintain community trust and transparency</li>
                  <li><strong>Logs and Analytics:</strong> Typically 90 days to 2 years depending on type</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  When you delete your account, we remove or anonymize your personal data, except where retention is required by law.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights (GDPR)</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Under GDPR and other data protection laws, you have the following rights:
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔍 Right to Access</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can request a copy of all personal data we hold about you.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">✏️ Right to Rectification</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can correct inaccurate or incomplete personal data.
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🗑️ Right to Erasure ("Right to be Forgotten")</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can request deletion of your personal data, subject to legal retention requirements.
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⏸️ Right to Restrict Processing</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can limit how we use your data in certain circumstances.
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📦 Right to Data Portability</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can receive your data in a structured, machine-readable format and transfer it to another service.
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🚫 Right to Object</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can object to processing based on legitimate interests or for direct marketing.
                    </p>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⚖️ Right to Withdraw Consent</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can withdraw consent at any time where we rely on consent as the legal basis.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-500 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📢 Right to Lodge a Complaint</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      You can file a complaint with your local data protection authority if you believe we've violated your rights.
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
                  To exercise any of these rights, please contact us at <a href="mailto:privacy@openoutings.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@openoutings.com</a>. We will respond within 30 days.
                </p>
              </section>

              {/* Data Security */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Data Security</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Encrypted data transmission (HTTPS/SSL)</li>
                  <li>Encrypted data storage</li>
                  <li>Secure authentication systems</li>
                  <li>Regular security audits</li>
                  <li>Access controls and permissions</li>
                  <li>Backup and recovery systems</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </section>

              {/* International Transfers */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Our service providers may be located outside the European Economic Area (EEA). When we transfer data internationally, we ensure appropriate safeguards are in place:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Adequacy decisions confirming equivalent data protection</li>
                  <li>Privacy Shield certification (where applicable)</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  The Service is not intended for users under 18 years of age. We do not knowingly collect personal data from children. If you become aware that a child has provided us with personal data, please contact us, and we will take steps to delete such information.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of material changes by:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Updating the "Last Updated" date</li>
                  <li>Sending an email notification</li>
                  <li>Displaying a prominent notice on the Service</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact Us */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or how we handle your data, please contact us:
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Data Protection Contact:</strong><br />
                    Email: <a href="mailto:privacy@openoutings.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@openoutings.com</a><br />
                    Website: <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">openoutings.com/contact</a>
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  We will respond to your inquiry within 30 days, as required by GDPR.
                </p>
              </section>

            </div>
          </div>

          {/* Summary Box */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛡️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your Privacy Matters
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  We're committed to protecting your personal data and respecting your privacy rights under GDPR and other applicable laws.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Read our <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline">FAQ</a> for more information about how OpenOutings works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
