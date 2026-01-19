export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Jett Terms of Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: January 2025
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            The Simple Version
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            We built Jett. We're responsible for making it work.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You use Jett. You're responsible for what you build with it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            The Necessary Details
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <strong className="text-gray-900 dark:text-white">Payment:</strong>{' '}
            $12.99/month, cancel anytime. No refunds for partial months.
          </p>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <strong className="text-gray-900 dark:text-white">What Jett Does:</strong>{' '}
            Helps you build web applications through conversation with AI. We don't
            guarantee your app will work perfectly, make money, or solve all your
            problems.
          </p>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <strong className="text-gray-900 dark:text-white">What You Own:</strong>{' '}
            The code Jett helps you create is yours.
          </p>

          <p className="text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-white">What We Don't Do:</strong>{' '}
            Store your code on our servers, sell your data, or train AI on your
            projects.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            The Trust Part
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Jett is built on the belief that assumed trust creates better outcomes
            than defensive contracts. We assume you'll use this tool to build things
            that help people. You assume we'll keep improving it honestly.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            If either of us breaks that trust, we part ways.
          </p>
        </section>
      </div>
    </div>
  );
}
