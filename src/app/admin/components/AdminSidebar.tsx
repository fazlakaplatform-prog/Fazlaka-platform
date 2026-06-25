'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react'; // استيراد useSession
import { gsap } from 'gsap';
import { useLanguage } from '@/components/Language/LanguageProvider';
import './AdminSidebar.css';

// تم إضافة خيار التعليقات هنا
const navigationLinks = [
  { title: 'لوحة التحكم', titleEn: 'Dashboard', link: '/admin' },
  { title: 'المقالات', titleEn: 'Articles', link: '/admin/articles' },
  { title: 'الحلقات', titleEn: 'Episodes', link: '/admin/episodes' },
  { title: 'الأسئلة الشائعة', titleEn: 'FAQs', link: '/admin/faqs' },
  { title: 'شرائح البطل', titleEn: 'Hero Sliders', link: '/admin/hero-sliders' },
  { title: 'قوائم التشغيل', titleEn: 'Playlists', link: '/admin/playlists' },
  { title: 'الخصوصية', titleEn: 'Privacy', link: '/admin/privacy' },
  { title: 'المواسم', titleEn: 'Seasons', link: '/admin/seasons' },
  { title: 'روابط التواصل', titleEn: 'Social Links', link: '/admin/social-links' },
  { title: 'الدعم', titleEn: 'Support', link: '/admin/support' },
  { title: 'فريق العمل', titleEn: 'Team', link: '/admin/team' },
  { title: 'الشروط', titleEn: 'Terms', link: '/admin/terms' },
  { title: 'المستخدمون', titleEn: 'Users', link: '/admin/users' },
  { title: 'التعليقات', titleEn: 'Comments', link: '/admin/comments' },
  { title: 'النشرة البريدية', titleEn: 'Newsletter', link: '/admin/newsletter' },
  { title: 'المشتركون', titleEn: 'Subscribers', link: '/admin/newsletter/subscribers' },
  { title: 'الحملات', titleEn: 'Campaigns', link: '/admin/newsletter/campaigns' },
];

interface AdminSidebarProps {
  isRTL: boolean;
}

export default function AdminSidebar({ isRTL }: AdminSidebarProps) {
  const { data: session } = useSession(); // جلب بيانات المستخدم
  const { language } = useLanguage();
  const pathname = usePathname();
  
  const position = isRTL ? 'right' : 'left';
  const colors = ['#6366f1', '#818cf8', '#4338ca'];
  const accentColor = '#6366f1';

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<Element[]>([]);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLSpanElement[]>([]);
  const blurOverlayRef = useRef<HTMLDivElement>(null);
  const btnTextRef = useRef<HTMLSpanElement>(null); // مرجع لنص الزر
  
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const lines = linesRef.current;
      const btnText = btnTextRef.current;

      if (!panel || !lines.length) return;

      let preLayers: Element[] = [];
      if (preContainer) preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(lines[1], { scaleX: 1 });
      
      // إعداد النص مبدئياً (مخفي أو جاهز للحركة)
      if (btnText) {
          gsap.set(btnText, { opacity: 0, width: 0, x: -10 });
      }
      
    }, wrapperRef);

    return () => ctx.revert();
  }, [position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    const blurOverlay = blurOverlayRef.current;
    if (!panel) return null;

    if (openTlRef.current) openTlRef.current.kill();
    if (closeTweenRef.current) {
        closeTweenRef.current.kill();
        closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-item-text'));
    const profileEls = Array.from(panel.querySelectorAll('.user-profile > *')); // عناصر البروفايل
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-item'));

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    // إخفاء العناصر للحركة
    if (itemEls.length) gsap.set(itemEls, { y: 20, opacity: 0 });
    if (profileEls.length) gsap.set(profileEls, { y: -10, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    if (blurOverlay) {
      tl.to(blurOverlay, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.4,
        ease: 'power2.out'
      }, 0);
    }

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.6, ease: 'power4.out' }, i * 0.08);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.08 : 0;
    const panelInsertTime = lastTime + 0.1;
    
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: 0.8, ease: 'power4.out' },
      panelInsertTime
    );

    // حركة ظهور البروفايل أولاً
    if (profileEls.length) {
        tl.to(profileEls, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }, panelInsertTime + 0.2);
    }

    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.04
        },
        panelInsertTime + 0.3
      );
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else {
        busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    const blurOverlay = blurOverlayRef.current;
    
    if (openTlRef.current) {
        openTlRef.current.kill();
        openTlRef.current = null;
    }

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all = [...layers, panel];
    if (closeTweenRef.current) closeTweenRef.current.kill();

    const offscreen = position === 'left' ? -100 : 100;
    
    if (blurOverlay) {
      gsap.to(blurOverlay, {
        opacity: 0,
        visibility: 'hidden',
        duration: 0.3,
        ease: 'power2.in'
      });
    }
    
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.5,
      ease: 'power3.inOut',
      stagger: 0.05,
      overwrite: 'auto',
      onComplete: () => {
        busyRef.current = false;
      }
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const lines = linesRef.current;
    const btnText = btnTextRef.current;
    if (!lines || lines.length < 3) return;

    const rotateDir = isRTL ? -1 : 1;

    if (opening) {
        // تحول إلى X
        gsap.to(lines[0], { y: 6, rotate: 45 * rotateDir, duration: 0.4, ease: 'back.out(1.7)' });
        gsap.to(lines[1], { scaleX: 0, duration: 0.3, ease: 'power2.inOut' });
        gsap.to(lines[2], { y: -6, rotate: -45 * rotateDir, duration: 0.4, ease: 'back.out(1.7)' });
        
        // ظهور نص "إغلاق"
        if (btnText) {
            gsap.to(btnText, { opacity: 1, width: 'auto', x: 0, duration: 0.3, delay: 0.1 });
        }
    } else {
        // العودة للهامبرغر
        gsap.to(lines[0], { y: 0, rotate: 0, duration: 0.4, ease: 'power2.out' });
        gsap.to(lines[1], { scaleX: 1, duration: 0.4, ease: 'power2.out' });
        gsap.to(lines[2], { y: 0, rotate: 0, duration: 0.4, ease: 'power2.out' });
        
        // إخفاء النص
        if (btnText) {
            gsap.to(btnText, { opacity: 0, width: 0, x: -10, duration: 0.2 });
        }
    }

  }, [isRTL]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      playOpen();
    } else {
      playClose();
    }
    animateIcon(target);
  }, [playOpen, playClose, animateIcon]);

  const handleLinkClick = () => {
      if (openRef.current) toggleMenu();
  };

  return (
    <div
      ref={wrapperRef}
      className={`staggered-menu-wrapper ${open ? 'open' : ''}`}
      data-position={position}
      data-open={open}
      style={{ '--sm-accent': accentColor } as React.CSSProperties}
    >
      <div 
        ref={blurOverlayRef}
        className="blur-overlay"
        onClick={toggleMenu}
      />
      
      <div ref={preLayersRef} className="sm-prelayers">
        {colors.map((c, i) => (
          <div key={i} className="sm-prelayer" style={{ background: c }} />
        ))}
      </div>

      {/* زر القائمة - يتحرك للأعلى عند الفتح */}
      <header className="staggered-menu-header">
        <button
          ref={toggleBtnRef}
          className={`sm-toggle-btn ${open ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <div className="sm-btn-content">
            <div ref={iconRef} className="sm-icon-wrap">
              <span ref={el => { if(el) linesRef.current[0] = el }} className="sm-line" />
              <span ref={el => { if(el) linesRef.current[1] = el }} className="sm-line" />
              <span ref={el => { if(el) linesRef.current[2] = el }} className="sm-line" />
            </div>
            <span ref={btnTextRef} className="sm-btn-text">
                {language === 'ar' ? 'إغلاق القائمة' : 'Close Menu'}
            </span>
          </div>
        </button>
      </header>

      <aside ref={panelRef} className="staggered-menu-panel">
        <div className="sm-panel-inner">
          
          {/* قسم معلومات المستخدم */}
          {session?.user && (
            <div className="user-profile">
              <div className="user-avatar-wrapper">
                <img 
                  src={session.user.image || '/images/default-avatar.png'} 
                  alt={session.user.name || 'User'} 
                  className="user-avatar"
                />
              </div>
              <div className="user-info">
                <h3 className="user-name">{session.user.name}</h3>
                <span className="user-role">{session.user.role}</span>
              </div>
            </div>
          )}

          <div className="sm-header-content">
            <h2 className="sm-title">{language === 'ar' ? 'القائمة' : 'Menu'}</h2>
            <div className="sm-indicator" />
          </div>

          <ul className="sm-panel-list">
            {navigationLinks.map((item, idx) => {
                const isActive = pathname === item.link;
                return (
                    <li className="sm-panel-itemWrap" key={idx}>
                    <Link 
                        href={item.link} 
                        className={`sm-panel-link ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        <span className="sm-item-number">0{idx + 1}</span>
                        <span className="sm-item-text">
                            {language === 'ar' ? item.title : item.titleEn}
                        </span>
                        {isActive && <span className="sm-active-dot" />}
                    </Link>
                    </li>
                );
            })}
          </ul>

          <div className="sm-footer">
             <p className="text-sm opacity-50">
                {language === 'ar' ? 'تصميم وتطوير بإتقان' : 'Designed with precision'}
             </p>
          </div>
        </div>
      </aside>
    </div>
  );
}