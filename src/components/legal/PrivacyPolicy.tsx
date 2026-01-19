export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Jett Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 2025
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            The Simple Version
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We collect what we need to make Jett work. We don't sell it, share it, 
            or do anything weird with it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What We Collect
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-gray-900 dark:text-white">Account info:</strong>{' '}
              Email and password (password is encrypted, we can't see it)
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Payment info:</strong>{' '}
              Handled by Stripe - we never see your card number
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Usage data:</strong>{' '}
              Which features you use, so we can make them better
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Build patterns:</strong>{' '}
              What works, what fails, common errors - we use this to improve Jett
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Your projects:</strong>{' '}
              Stored locally on your computer, synced to cloud if you choose
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            What We Don't Do
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Sell your data to anyone</li>
            <li>• Share your project code with third parties</li>
            <li>• Track you across the web</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            How We Improve Jett
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We analyze anonymized patterns from builds - things like "this type of task 
            fails often" or "this approach works better" - to make Jett smarter for everyone. 
            We don't use your specific project content to train AI models.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Your Data, Your Control
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Export your projects anytime</li>
            <li>• Delete your account and we delete your data</li>
            <li>• Your code stays yours</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            The Services We Use
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong className="text-gray-900 dark:text-white">Supabase:</strong>{' '}
              Authentication and cloud sync
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Stripe:</strong>{' '}
              Payment processing
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Vercel:</strong>{' '}
              App deployment (only what you choose to deploy)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Questions?
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Email us: support@thetrusteconomy.org
          </p>
        </section>
      </div>
    </div>
  );
}
