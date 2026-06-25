'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Props {
  variant?: 'default' | 'minimal' | 'footer';
  language?: 'ar' | 'en';
  className?: string;
  checkSession?: boolean;
  hideHeader?: boolean;
}

const translations = {
  ar: {
    title: 'النشرة البريدية',
    subtitle: 'اشترك ليصلك أحدث المقالات والحلقات مباشرة إلى بريدك',
    placeholder: 'بريدك الإلكتروني',
    namePlaceholder: 'اسمك (اختياري)',
    button: 'اشترك',
    success: 'تم الاشتراك بنجاح! تحقق من بريدك الإلكتروني.',
    existing: 'أنت مشترك بالفعل!',
    error: 'حدث خطأ، حاول مرة أخرى.',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
    privacy: 'لن نشارك بريدك مع أي طرف ثالث. يمكنك إلغاء الاشتراك في أي وقت.',
    subscribedTitle: 'أنت مشترك!',
    subscribedDesc: 'أنت مشترك في نشرتنا البريدية',
    unsubscribe: 'إلغاء الاشتراك',
    unsubscribed: 'تم إلغاء الاشتراك بنجاح',
  },
  en: {
    title: 'Newsletter',
    subtitle: 'Subscribe to receive the latest articles and episodes directly to your inbox',
    placeholder: 'Your email',
    namePlaceholder: 'Your name (optional)',
    button: 'Subscribe',
    success: 'Subscribed successfully! Check your email.',
    existing: 'You\'re already subscribed!',
    error: 'Something went wrong. Please try again.',
    invalidEmail: 'Please enter a valid email address.',
    privacy: 'We won\'t share your email. You can unsubscribe at any time.',
    subscribedTitle: 'You\'re subscribed!',
    subscribedDesc: 'You are subscribed to our newsletter',
    unsubscribe: 'Unsubscribe',
    unsubscribed: 'Successfully unsubscribed',
  },
};

export default function NewsletterSubscribe({ variant = 'default', language = 'ar', className = '', checkSession = false, hideHeader = false }: Props) {
  const sessionData = useSession();
  const session = checkSession ? sessionData.data : null;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'existing' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const isRTL = language === 'ar';
  const t = translations[language];

  useEffect(() => {
    if (!checkSession || !session?.user?.email) return;
    setEmail(session.user.email);
    if (session.user.name) setName(session.user.name);
    fetch(`/api/newsletter/preferences?email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(json => setSubscribed(json.data?.status === 'ACTIVE'))
      .catch(() => setSubscribed(false));
  }, [checkSession, session?.user?.email, session?.user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage(t.invalidEmail);
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, language }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.message === 'AlreadySubscribed') {
          setSubscribed(true);
          setStatus('existing');
          setMessage(t.existing);
        } else {
          setSubscribed(true);
          setStatus('success');
          setMessage(t.success);
          setEmail('');
          setName('');
        }
      } else {
        setStatus('error');
        setMessage(t.error);
      }
    } catch {
      setStatus('error');
      setMessage(t.error);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) return;
    setUnsubscribing(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        setSubscribed(false);
        setShowForm(false);
        setMessage(t.unsubscribed);
        setStatus('success');
      }
    } catch {}
    setUnsubscribing(false);
  };

  if (checkSession && subscribed === true && !showForm) {
    const subscribedUI = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center gap-4 py-4 ${variant === 'footer' ? '' : 'px-4'}`}
      >
        <div className={`rounded-full flex items-center justify-center ${variant === 'footer' ? 'w-14 h-14 bg-green-500/20' : 'w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'}`}>
          <svg className={`${variant === 'footer' ? 'w-7 h-7' : 'w-8 h-8'} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="text-center">
          <p className={`font-bold ${variant === 'footer' ? 'text-white text-base' : 'text-gray-900 dark:text-white text-lg'}`}>{t.subscribedTitle}</p>
          <p className={`mt-1 ${variant === 'footer' ? 'text-gray-400 text-xs' : 'text-gray-500 dark:text-gray-400 text-sm'}`}>{t.subscribedDesc}</p>
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={unsubscribing}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all border disabled:opacity-50 ${
            variant === 'footer'
              ? 'text-red-400 border-red-400/30 hover:bg-red-400/10'
              : 'text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          {unsubscribing ? '...' : t.unsubscribe}
        </button>
      </motion.div>
    );

    if (variant === 'footer') {
      return <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>{subscribedUI}</div>;
    }
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 border border-green-200/30 dark:border-green-800/30 backdrop-blur-sm shadow-lg shadow-green-500/5"
        >
          {subscribedUI}
        </motion.div>
      </div>
    );
  }

  const renderForm = (formContent: React.ReactNode) => (
    <>
      {formContent}
      <AnimatePresence>
        {status !== 'idle' && status !== 'loading' && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs mt-2 ${status === 'success' || status === 'existing' ? (variant === 'footer' ? 'text-green-400' : 'text-green-500') : (variant === 'footer' ? 'text-red-400' : 'text-red-500')}`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );

  if (variant === 'minimal') {
    return (
      <div className={className}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder={t.placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium transition-all whitespace-nowrap"
          >
            {status === 'loading' ? '...' : t.button}
          </button>
        </form>
        {renderForm(null)}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        {!hideHeader && (
          <>
            <h3 className="text-lg font-semibold text-white mb-2">{t.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{t.subtitle}</p>
          </>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder={t.placeholder}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-700/60 border border-gray-600/50 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium transition-all"
          >
            {status === 'loading' ? '...' : t.button}
          </button>
        </form>
        {renderForm(null)}
        {!hideHeader && <p className="text-xs text-gray-500 mt-2">{t.privacy}</p>}
      </div>
    );
  }

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-200/30 dark:border-indigo-800/30 backdrop-blur-sm`}
      >
        {!hideHeader && (
          <>
            <h3 className={`text-2xl font-bold mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t.title}
            </h3>
            <p className={`text-gray-500 dark:text-gray-400 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t.subtitle}
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder={t.placeholder}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {language === 'ar' ? 'جاري...' : 'Loading...'}
              </span>
            ) : t.button}
          </button>
        </form>

        <AnimatePresence>
          {status !== 'idle' && status !== 'loading' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-3 rounded-xl text-sm ${
                status === 'success' || status === 'existing'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {!hideHeader && (
          <p className={`text-xs text-gray-400 mt-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {t.privacy}
          </p>
        )}
      </motion.div>
    </div>
  );
}
