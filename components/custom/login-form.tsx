'use client';

import { useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const REMEMBER_EMAIL_KEY = 'toi-et-moi:last-email';

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
  });
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !!window.localStorage.getItem(REMEMBER_EMAIL_KEY);
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (remember) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    const credentialApi = navigator.credentials;
    const passwordCredentialCtor = (
      window as Window & {
        PasswordCredential?: new (form: HTMLFormElement) => Credential | null;
      }
    ).PasswordCredential;

    if (
      remember &&
      credentialApi &&
      passwordCredentialCtor &&
      formRef.current
    ) {
      try {
        const passwordCredential = new passwordCredentialCtor(formRef.current);
        if (passwordCredential) {
          await credentialApi.store(passwordCredential);
        }
      } catch {
        // Browser support is inconsistent. Safe to ignore.
      }
    }

    toast.success('Connexion rétablie.');

    startTransition(() => {
      router.replace('/dashboard');
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="form-label">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="form-label">
          Mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Votre mot de passe"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <label className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3">
        <span className="text-sm text-foreground">Se souvenir de moi</span>
        <span className="relative flex h-6 w-11 items-center rounded-full bg-white/10 p-1 transition-colors data-[checked=true]:bg-[#8fb2ff]/90">
          <input
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="sr-only"
          />
          <span
            data-checked={remember}
            className="block h-4 w-4 rounded-full bg-white transition-transform data-[checked=true]:translate-x-5"
          />
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="cta-primary mt-2 w-full"
      >
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Connexion...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Se connecter
          </>
        )}
      </button>
    </form>
  );
}
