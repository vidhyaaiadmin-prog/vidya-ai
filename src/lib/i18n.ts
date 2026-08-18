import { useUserStore } from './stores';

type Dict = Record<string, string>;

// English is the fallback for every key — other languages only need to
// override what's been translated so far; missing keys degrade to English.
const en: Dict = {
  nav_home: 'Home', nav_doubt: 'Doubt Solver', nav_quiz: 'Quiz', nav_flashcards: 'Flashcards',
  nav_planner: 'Planner', nav_career: 'Career GPS', nav_interview: 'Interview', nav_pyq: 'PYQ Mode',
  nav_analytics: 'Analytics', nav_profile: 'Profile', nav_leaderboard: 'Leaderboard',
  nav_resources: 'Resources', nav_plagiarism: 'Originality', nav_certifications: 'Certifications',
  ai_status: 'AI Online · Gemini Flash Active',
  sign_out: 'Sign Out', new_label: 'New',
};

const hi: Dict = {
  nav_home: 'होम', nav_doubt: 'डाउट सॉल्वर', nav_quiz: 'क्विज़', nav_flashcards: 'फ्लैशकार्ड्स',
  nav_planner: 'प्लानर', nav_career: 'करियर GPS', nav_interview: 'इंटरव्यू', nav_pyq: 'PYQ मोड',
  nav_analytics: 'एनालिटिक्स', nav_profile: 'प्रोफाइल', nav_leaderboard: 'लीडरबोर्ड',
  nav_resources: 'रिसोर्सेज़', nav_plagiarism: 'ओरिजिनैलिटी', nav_certifications: 'सर्टिफिकेशन',
  ai_status: 'AI ऑनलाइन · Gemini Flash सक्रिय',
  sign_out: 'साइन आउट', new_label: 'नया',
};

// Add more languages here as they're translated (ta/te/bn/mr/gu/kn/ml) —
// until then they fall back to English rather than showing raw keys.
const DICTS: Record<string, Dict> = { en, hi };

export function useTranslation() {
  const language = useUserStore((s) => s.user?.language) || 'en';
  const dict = DICTS[language] || en;
  return (key: string) => dict[key] ?? en[key] ?? key;
}
