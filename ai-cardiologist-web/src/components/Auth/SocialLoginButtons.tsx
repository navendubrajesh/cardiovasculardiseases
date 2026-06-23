import type { ReactNode } from 'react';

export type SocialProvider = 'google' | 'github' | 'apple' | 'linkedin';

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
  linkedin: 'LinkedIn',
};

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  const cls = 'h-5 w-5 shrink-0';
  switch (provider) {
    case 'google':
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    case 'github':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-1.005-.525-1.65-.54-1.875-.855-.675-.735-.045-1.11.465-1.425 1.125-.12 2.305.465 2.965 1.425 1.725 2.925 4.455 2.1 5.535 1.575.165-1.23.675-2.1 1.23-2.585-4.305-.495-8.805-2.16-8.805-9.615 0-2.115.75-3.855 1.995-5.205-.195-.495-.87-2.535.195-5.265 0 0 1.635-.525 5.355 1.995 1.545-.435 3.225-.66 4.875-.675 1.65.015 3.33.24 4.875.675 3.72-2.535 5.355-1.995 5.355-1.995 1.08 2.73.405 4.77.195 5.265 1.245 1.35 1.995 3.09 1.995 5.205 0 7.47-4.515 9.12-8.835 9.615.705.615 1.32 1.785 1.32 3.585 0 2.58-.015 4.665-.015 5.295 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case 'apple':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.49-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
  }
}

type SocialLoginButtonsProps = {
  disabled?: boolean;
  onSelect: (provider: SocialProvider) => void;
};

export function SocialLoginButtons({ disabled, onSelect }: SocialLoginButtonsProps) {
  const providers: SocialProvider[] = ['google', 'github', 'apple', 'linkedin'];

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(provider)}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ProviderIcon provider={provider} />
          Continue with {PROVIDER_LABELS[provider]}
        </button>
      ))}
    </div>
  );
}

export function SocialLoginNote({ children }: { children: ReactNode }) {
  return <p className="text-center text-xs text-slate-500">{children}</p>;
}
