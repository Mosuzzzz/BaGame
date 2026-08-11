'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'th' | 'en';

interface Translations {
  [key: string]: {
    th: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { th: 'หน้าแรก', en: 'Home' },
  games: { th: 'คลังเกม', en: 'Games' },
  submit: { th: 'ส่งผลงาน', en: 'Submit' },
  login: { th: 'เข้าสู่ระบบ (RMUTI)', en: 'Login (RMUTI)' },
  logout: { th: 'ออกจากระบบ', en: 'Logout' },
  // Home page
  heroDesc: {
    th: 'แหล่งรวมผลงานการพัฒนาเกมของนักศึกษาสาขาวิทยาการคอมพิวเตอร์ (CS 67)',
    en: 'A collection of game development projects by Computer Science students (CS 67)'
  },
  exploreGames: { th: 'สำรวจคลังเกมทั้งหมด', en: 'Explore All Games' },
  allCategories: { th: 'ทั้งหมด', en: 'All' },
  searchPlaceholder: { th: 'ค้นหาเกม หรือ รหัสนักศึกษา...', en: 'Search games or student ID...' },
  favToggleOn: { th: 'แสดงเฉพาะรายการโปรด', en: 'Show Favorites Only' },
  favToggleOff: { th: 'แสดงเกมทั้งหมด', en: 'Show All Games' },
  noGamesFound: { th: 'ไม่พบผลงานเกม', en: 'No games found' },
  noGamesDesc: { th: 'ลองปรับการค้นหา หรือดูหมวดหมู่ที่ใช่', en: 'Try adjusting your search or category' },
  viewAll: { th: 'ดูผลงานทั้งหมด', en: 'View All Projects' },
  latestGames: { th: 'ผลงานล่าสุด', en: 'Latest Projects' },
  latestGamesDesc: { th: 'ผลงานการพัฒนาเกมล่าสุดจากนักศึกษา CS 67', en: 'Latest game development projects by CS 67 students' },
  // Game Card
  play: { th: 'Play', en: 'Play' },
  // Footer
  footerDesc: { th: 'สาขาวิทยาการคอมพิวเตอร์ รุ่น 18', en: 'Computer Science, Generation 18' },
  footerRights: { th: 'สงวนลิขสิทธิ์', en: 'All Rights Reserved' },
};

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'th',
  toggleLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('th');

  useEffect(() => {
    const saved = localStorage.getItem('cs67_lang') as Language;
    if (saved === 'en' || saved === 'th') {
      setLang(saved);
    }
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('cs67_lang', next);
      return next;
    });
  };

  const t = (key: string) => {
    if (translations[key]) {
      return translations[key][lang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
