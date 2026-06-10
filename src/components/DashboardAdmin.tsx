import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  AlertCircle, 
  Lock, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  CheckCircle,
  Eye, 
  BookOpen,
  Trash2
} from 'lucide-react';
import { Prayer } from '../types';
import { togglePrayerReadStatus, deletePrayer, isUsingFirestore, signInAdmin, signOutAdmin, onAdminStateChanged } from '../lib/firebase';

interface DashboardAdminProps {
  prayers: Prayer[];
}

export default function DashboardAdmin({ prayers }: DashboardAdminProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  
  // Security Access state managed by Firebase Auth (or simulation fallback)
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Swipe Gestures state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  // Delete configuration state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAdminStateChanged((user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleAccessCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAuthError('PIN harus diisi.');
      return;
    }
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signInAdmin('', password);
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Gagal masuk ke portal. PIN salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutAdmin();
    } catch (err) {
      console.error('Gagal keluar dari sesi:', err);
    }
  };

  // Mark prayer read/unread
  const handleToggleRead = async (prayerId: string, currentStatus: boolean) => {
    try {
      await togglePrayerReadStatus(prayerId, !currentStatus);
    } catch (err) {
      console.error('Failed to change read status:', err);
    }
  };

  // Delete prayer from DB
  const handleDelete = async (prayerId: string) => {
    setIsConfirmingDelete(null);
    try {
      await deletePrayer(prayerId);
    } catch (err) {
      console.error('Failed to delete prayer:', err);
    }
  };

  // Standard Indonesian Timestamp formatting helper
  const formatIndoDate = (dateVal: any) => {
    if (!dateVal) return 'Baru Saja';
    try {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return 'Baru Saja';
      
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    } catch {
      return 'Baru Saja';
    }
  };

  // Filters logic
  const filteredPrayers = prayers.filter((prayer) => {
    if (statusFilter === 'unread') {
      return !prayer.isRead;
    }
    if (statusFilter === 'read') {
      return prayer.isRead;
    }
    return true;
  });

  // Adjust active index when list size changes to prevent overflow
  useEffect(() => {
    if (filteredPrayers.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= filteredPrayers.length) {
      setCurrentIndex(filteredPrayers.length - 1);
    }
  }, [filteredPrayers.length, currentIndex]);

  // Handle Swipe Prev and Next
  const handlePrev = () => {
    if (filteredPrayers.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredPrayers.length - 1));
  };

  const handleNext = () => {
    if (filteredPrayers.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev < filteredPrayers.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPrayers.length, currentIndex]);

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = touchStart.x - endX;
    const diffY = touchStart.y - endY;

    // Must be predominantly horizontal and exceed threshold
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 60) {
      if (diffX > 0) {
        // Swipe to the left -> Show Next
        handleNext();
      } else {
        // Swipe to the right -> Show Prev
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  if (loadingAuth) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center" id="admin-auth-loading">
        <div className="w-10 h-10 border-4 border-[#E0DBCF] border-t-[#5A5A40] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#8B8B6B] uppercase tracking-widest">Memeriksa Sesi Admin...</p>
      </div>
    );
  }

  // Keypad Handlers
  const handleDial = (num: string) => {
    if (isSubmitting) return;
    setAuthError('');
    const newPassword = password + num;
    if (newPassword.length <= 6) {
      setPassword(newPassword);
      if (newPassword.length === 6) {
        triggerLogin(newPassword);
      }
    }
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    setPassword((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPassword('');
  };

  const triggerLogin = async (pinValue: string) => {
    setIsSubmitting(true);
    setAuthError('');
    try {
      await signInAdmin('', pinValue);
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'PIN salah. Silakan coba lagi.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full max-w-sm mx-auto px-4 py-6" id="admin-auth-panel">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-[#E0DBCF] p-6 shadow-xs text-center relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-[#5A5A40]" />
          
          <div className="w-10 h-10 bg-[#5A5A40]/10 text-[#5A5A40] border border-[#E0DBCF]/60 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-4 h-4" />
          </div>

          <h2 className="text-lg font-serif font-bold text-[#3D3D29] mb-1">
            Masuk Admin
          </h2>
          <p className="text-[11px] text-[#8B8B6B] leading-relaxed mb-4">
            Masukkan 6 digit PIN keamanan untuk mengelola titipan doa.
          </p>

          {/* Keypad PIN Circular Dots Indicator */}
          <div className="flex justify-center space-x-2.5 my-5">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  idx < password.length
                    ? 'bg-[#5A5A40] scale-110'
                    : 'border-2 border-[#E0DBCF] bg-transparent'
                }`}
              />
            ))}
          </div>

          {authError && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 p-2 rounded-xl flex items-center justify-center font-bold mb-4">
              <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {authError}
            </p>
          )}

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto mb-3" id="phone-numeric-dialer">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDial(num)}
                disabled={isSubmitting}
                className="w-12 h-12 rounded-full bg-[#FDFCF8] border border-[#E0DBCF]/80 hover:bg-[#E0DBCF]/30 active:bg-[#5A5A40] active:text-white flex items-center justify-center text-sm font-bold text-[#3D3D29] transition-all cursor-pointer select-none"
              >
                {num}
              </button>
            ))}
            
            {/* Backspace/Hapus */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isSubmitting}
              className="text-[10px] font-bold uppercase tracking-wider text-[#8B8B6B] hover:text-[#3D3D29] flex items-center justify-center transition-colors cursor-pointer select-none"
            >
              Hapus
            </button>

            {/* Zero/0 */}
            <button
              type="button"
              onClick={() => handleDial('0')}
              disabled={isSubmitting}
              className="w-12 h-12 rounded-full bg-[#FDFCF8] border border-[#E0DBCF]/80 hover:bg-[#E0DBCF]/30 active:bg-[#5A5A40] active:text-white flex items-center justify-center text-sm font-bold text-[#3D3D29] transition-all cursor-pointer select-none"
            >
              0
            </button>

            {/* Reset/Batal */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting}
              className="text-[10px] font-bold uppercase tracking-wider text-[#8B8B6B] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer select-none"
            >
              Batal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentPrayer = filteredPrayers[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-2" id="admin-dashboard-container">
      {/* Sleek Minimal Top Control Bar */}
      <div className="flex items-center justify-between gap-4 mb-6" id="admin-top-control-bar">
        <div className="flex items-center space-x-1 bg-[#E0DBCF]/30 border border-[#E0DBCF]/60 p-1 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setStatusFilter('all'); setCurrentIndex(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#8B8B6B] hover:text-[#3D3D29]'
            }`}
          >
            Semua ({prayers.length})
          </button>
          <button
            onClick={() => { setStatusFilter('unread'); setCurrentIndex(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'unread' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-[#8B8B6B] hover:text-[#3D3D29]'
            }`}
          >
            <Clock className="w-3 h-3" />
            Antrean ({prayers.filter(p => !p.isRead).length})
          </button>
          <button
            onClick={() => { setStatusFilter('read'); setCurrentIndex(0); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === 'read' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#8B8B6B] hover:text-[#3D3D29]'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Selesai ({prayers.filter(p => p.isRead).length})
          </button>
        </div>

        <button 
          onClick={handleSignOut} 
          className="text-[10px] text-red-600/80 hover:text-red-700 hover:bg-red-50/50 border border-red-200/50 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
        >
          <LogOut className="w-3 h-3" />
          Keluar
        </button>
      </div>

      {/* Main Single Card Swiper Content Arena */}
      {filteredPrayers.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[32px] border border-[#E0DBCF] shadow-xs" id="empty-results-box">
          <BookOpen className="w-12 h-12 text-[#E0DBCF] mx-auto mb-3" />
          <p className="text-sm text-[#8B8B6B] font-medium font-sans">
            Tidak ada titipan doa yang ditemukan dalam kategori ini.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Main Focused Swipe Core Container */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full select-none"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPrayer.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 80 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-[32px] border border-[#E0DBCF] p-8 md:p-10 shadow-sm flex flex-col justify-between min-h-[420px] md:min-h-[460px]"
              >
                {/* Meta Header */}
                <div className="border-b border-[#E0DBCF]/40 pb-4 mb-6 flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#8B8B6B] uppercase tracking-widest block mb-1">
                      PENGIRIM DOA
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#3D3D29]">
                      {currentPrayer.senderName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#8B8B6B] uppercase tracking-widest block mb-1">
                      DITERIMA PADA
                    </span>
                    <p className="text-xs font-bold text-[#8B8B6B]">
                      {formatIndoDate(currentPrayer.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Substantive Focused Prayer Text area */}
                <div className="flex-1 overflow-y-auto mb-6 pr-2 max-h-[220px] md:max-h-[260px] scrollbar-thin">
                  <p className="text-[#3D3D29] font-serif leading-relaxed text-base md:text-lg whitespace-pre-wrap">
                    "{currentPrayer.prayerText}"
                  </p>
                </div>

                {/* Active Controls & Counters inside card */}
                <div className="border-t border-[#E0DBCF]/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Status Indicator / Delete Confirm */}
                  <div className="flex items-center space-x-2">
                    {isConfirmingDelete === currentPrayer.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50/80 border border-red-100 p-1 rounded-xl">
                        <span className="text-[10px] font-bold text-red-700 px-2 uppercase tracking-wide">Hapus?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(currentPrayer.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(null)}
                          className="bg-white border border-[#E0DBCF] text-gray-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleRead(currentPrayer.id, currentPrayer.isRead)}
                          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2 ${
                            currentPrayer.isRead
                              ? 'bg-[#E0DBCF]/30 border border-[#E0DBCF] text-[#8B8B6B]'
                              : 'bg-[#5A5A40] text-white shadow-sm shadow-[#5A5A40]/10 hover:bg-[#4A4A35]'
                          }`}
                        >
                          {currentPrayer.isRead ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-700" />
                              <span>Tandai Belum Dibaca</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai Dibacakan</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(currentPrayer.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Hapus Doa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigators and indicators */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="p-2.5 bg-[#FDFCF8] border border-[#E0DBCF] rounded-xl text-[#3D3D29] hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                      title="Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-xs font-bold text-[#8B8B6B] min-w-[70px] text-center font-mono select-none">
                      {currentIndex + 1} / {filteredPrayers.length}
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="p-2.5 bg-[#FDFCF8] border border-[#E0DBCF] rounded-xl text-[#3D3D29] hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                      title="Berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Swipe indicator helper text */}
          <p className="text-center text-[10px] uppercase tracking-widest font-bold text-[#8B8B6B] mt-5 select-none animate-pulse">
            💡 Usap layar kanan / kiri atau gunakan tombol panah untuk berganti doa
          </p>
        </div>
      )}
    </div>
  );
}
