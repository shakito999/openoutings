export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">📜</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Terms of Service
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Welcome to OpenOutings ("we", "our", or "us"). These Terms of Service ("Terms") govern your access to and use of our website, services, and applications (collectively, the "Service").
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
                </p>
              </section>

              {/* Eligibility */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Eligibility</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>You are at least 18 years of age</li>
                  <li>You have the legal capacity to enter into these Terms</li>
                  <li>You will comply with all applicable laws and regulations</li>
                  <li>All information you provide is accurate and truthful</li>
                </ul>
              </section>

              {/* Account Registration */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Account Registration</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  To use certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  You may not transfer your account to another person or use another person's account.
                </p>
              </section>

              {/* User Conduct */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. User Conduct</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Use the Service for any illegal purpose or in violation of any laws</li>
                  <li>Violate the rights of others, including privacy and intellectual property rights</li>
                  <li>Post or transmit harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable content</li>
                  <li>Impersonate any person or entity or falsely represent your affiliation with any person or entity</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                  <li>Use automated scripts, bots, or other automated means to access the Service</li>
                  <li>Collect or harvest any information about other users without their consent</li>
                  <li>Create fake accounts or artificially inflate event attendance numbers</li>
                  <li>Use the Service for commercial purposes without our prior written consent</li>
                  <li>Post spam, advertisements, or promotional content unrelated to events</li>
                </ul>
              </section>

              {/* Content and Intellectual Property */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Content and Intellectual Property</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">5.1 Your Content</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You retain all rights to content you post on the Service ("User Content"). By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with operating and providing the Service.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You represent and warrant that you own or have the necessary rights to all User Content you post, and that such content does not violate any third-party rights.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">5.2 Our Content</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  The Service and its original content (excluding User Content), features, and functionality are owned by OpenOutings and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </section>

              {/* Events and Activities */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Events and Activities</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">6.1 Event Creation</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Event organizers are solely responsible for their events, including venue selection, safety measures, costs, cancellations, and compliance with local laws and regulations. OpenOutings is not responsible for any events created through the Service.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">6.2 Event Attendance</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  By attending events, you acknowledge that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>You participate at your own risk</li>
                  <li>OpenOutings is not responsible for any injuries, losses, or damages that may occur</li>
                  <li>You should verify event details and organizer credibility before attending</li>
                  <li>You should meet in public places and take appropriate safety precautions</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">6.3 Payments</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Any payments for events are transactions between users and event organizers. OpenOutings is not involved in these transactions and is not responsible for refunds, disputes, or payment issues.
                </p>
              </section>

              {/* Privacy and Data Protection */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Privacy and Data Protection</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Your privacy is important to us. Please review our <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a> to understand how we collect, use, and protect your personal information.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  In accordance with the General Data Protection Regulation (GDPR) and other applicable data protection laws, you have rights regarding your personal data, including the right to access, rectify, erase, restrict processing, data portability, and to object to processing.
                </p>
              </section>

              {/* Disclaimers */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Disclaimers</h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>The Service will be uninterrupted, secure, or error-free</li>
                  <li>The results obtained from the Service will be accurate or reliable</li>
                  <li>Any errors in the Service will be corrected</li>
                  <li>The Service will meet your requirements</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  You acknowledge that OpenOutings does not control, verify, or endorse any User Content or events, and we expressly disclaim any liability related to User Content or events.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  To the maximum extent permitted by applicable law, OpenOutings shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                  <li>Damages resulting from your use or inability to use the Service</li>
                  <li>Damages resulting from any conduct or content of third parties on the Service</li>
                  <li>Damages resulting from attending or organizing events through the Service</li>
                  <li>Unauthorized access to or alteration of your transmissions or data</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  Our total liability to you for all claims arising from or related to the Service shall not exceed €100 (one hundred euros) or the amount you paid us in the past 12 months, whichever is greater.
                </p>
              </section>

              {/* Indemnification */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Indemnification</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  You agree to indemnify, defend, and hold harmless OpenOutings, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorney fees) arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your User Content</li>
                  <li>Your events or attendance at events</li>
                  <li>Your violation of any rights of another person or entity</li>
                </ul>
              </section>

              {/* Termination */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Termination</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You may terminate your account at any time by contacting us or using the account deletion feature.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  By continuing to access or use the Service after revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you must stop using the Service.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Governing Law and Jurisdiction</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of Bulgaria and the European Union, without regard to conflict of law provisions.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Any disputes arising from or relating to these Terms or the Service shall be resolved in the courts of Sofia, Bulgaria. However, consumers in the EU may also bring proceedings in their country of residence.
                </p>
              </section>

              {/* EU-Specific Rights */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. EU Consumer Rights</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  If you are a consumer in the European Union, you have certain rights that cannot be limited by these Terms, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Right to withdraw from contracts within 14 days</li>
                  <li>Right to clear and transparent contract terms</li>
                  <li>Right to remedies for defective services</li>
                  <li>Right to access consumer protection organizations and dispute resolution mechanisms</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                  For dispute resolution, EU consumers can use the European Commission's Online Dispute Resolution platform: <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>
                </p>
              </section>

              {/* Contact */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">15. Contact Information</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Email: <a href="mailto:support@openoutings.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@openoutings.com</a><br />
                    Website: <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">openoutings.com/contact</a>
                  </p>
                </div>
              </section>

              {/* Severability */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Severability and Waiver</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </section>

              {/* Entire Agreement */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">17. Entire Agreement</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  These Terms, together with our Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and OpenOutings concerning the Service and supersede all prior agreements and understandings.
                </p>
              </section>

            </div>
          </div>

          {/* Acknowledgment Box */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  By using OpenOutings, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please also review our <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a> and <a href="/faq" className="text-blue-600 dark:text-blue-400 hover:underline">FAQ</a> for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
