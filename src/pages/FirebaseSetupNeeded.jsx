import Logo from '../components/Logo';

export default function FirebaseSetupNeeded() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-arf-bg px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 space-y-4">
          <h1 className="text-lg font-bold text-arf-navy">Firebase connection required</h1>
          <p className="text-sm text-gray-600">
            The ARF Mobility Dashboard needs a Firebase project (Firestore + Authentication) to store
            observations, manage logins, and trigger alerts. Add your project credentials to continue.
          </p>
          <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1.5">
            <li>Create or open a project at the Firebase Console.</li>
            <li>Enable <span className="font-medium text-arf-text">Authentication → Email/Password</span> and <span className="font-medium text-arf-text">Firestore Database</span>.</li>
            <li>
              Copy your web app config values into{' '}
              <code className="bg-arf-bg px-1.5 py-0.5 rounded text-xs">.env.local</code> at the project root:
            </li>
          </ol>
          <pre className="bg-arf-navy text-white text-[11px] leading-relaxed rounded-md p-3 overflow-x-auto">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}
          </pre>
          <p className="text-xs text-gray-400">
            After saving, restart the dev server. ARF admins should also create user accounts and assign each one
            a role of <span className="font-medium">observer</span> or <span className="font-medium">official</span> in the
            Firestore <code className="bg-arf-bg px-1 py-0.5 rounded">users</code> collection (document ID = Firebase Auth UID).
          </p>
        </div>
      </div>
    </div>
  );
}
