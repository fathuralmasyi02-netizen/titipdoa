import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, BookOpen, Clock, Globe, MapPin, Sparkles } from 'lucide-react';
import { Prayer } from './types';
import { subscribePrayers } from './lib/firebase';
import FormInput from './components/FormInput';
import DashboardAdmin from './components/DashboardAdmin';

export default function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to prayers with live updates on mount
  useEffect(() => {
    const unsubscribe = subscribePrayers((updatedPrayers) => {
      setPrayers(updatedPrayers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#3D3D29] font-sans flex flex-col justify-between pb-24" id="app-root-layout">
      {/* Soft Sage Organic Glow */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-[#5A5A40]/5 to-transparent pointer-events-none" />

      {/* Main Core Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Core Content Layout Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24" id="app-loader-box">
              <div className="w-10 h-10 border-4 border-[#E0DBCF] border-t-[#5A5A40] rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-[#8B8B6B] uppercase tracking-widest">Menghubungkan...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'public' ? (
                <motion.div
                  key="public-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormInput />
                </motion.div>
              ) : (
                <motion.div
                  key="admin-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardAdmin prayers={prayers} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Floating Bottom Navigator Capsule */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-1.5 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E0DBCF]/80 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('public')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'public'
              ? 'bg-[#5A5A40] text-white shadow-sm shadow-[#5A5A40]/10'
              : 'text-[#8B8B6B] hover:text-[#3D3D29]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kirim Doa</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-[#5A5A40] text-white shadow-sm shadow-[#5A5A40]/10'
              : 'text-[#8B8B6B] hover:text-[#3D3D29]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
}
