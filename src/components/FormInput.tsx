import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Sparkles, BookOpen, Check } from 'lucide-react';
import { submitPrayer } from '../lib/firebase';

interface FormInputProps {
  onSuccessSubmit?: () => void;
}

export default function FormInput({ onSuccessSubmit }: FormInputProps) {
  const [senderName, setSenderName] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prayerText.trim().length === 0) return;

    setIsSubmitting(true);
    const finalName = isAnonymous ? 'Hamba Allah' : (senderName.trim() || 'Hamba Allah');

    try {
      await submitPrayer(finalName, prayerText);
      
      // Setup UI notification
      setShowSuccessModal(true);
      setPrayerText('');
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAnonymous = () => {
    setIsAnonymous(!isAnonymous);
    if (!isAnonymous) {
      setSenderName('');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2" id="form-input-container">
      {/* Decorative Natural Tones Card Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white rounded-2xl border border-[#E0DBCF] shadow-xs overflow-hidden"
      >
        {/* Organic Sage Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[#5A5A40]" />
        
        <div className="p-5 md:p-8 pt-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-[#3D3D29]">
              Titipkan Doa Anda
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Identity Switcher toggles */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8B8B6B] mb-2">
                Identitas Pengirim
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  id="btn-anon-true"
                  onClick={() => { setIsAnonymous(true); setSenderName(''); }}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isAnonymous 
                      ? 'bg-[#5A5A40]/10 border-[#E0DBCF] text-[#3D3D29]' 
                      : 'bg-[#FDFCF8] border-[#E0DBCF]/60 text-[#8B8B6B] hover:text-[#3D3D29]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Hamba Allah
                </button>
                <button
                  type="button"
                  id="btn-anon-false"
                  onClick={() => setIsAnonymous(false)}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !isAnonymous 
                      ? 'bg-[#5A5A40]/10 border-[#E0DBCF] text-[#3D3D29]' 
                      : 'bg-[#FDFCF8] border-[#E0DBCF]/60 text-[#8B8B6B] hover:text-[#3D3D29]'
                  }`}
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  Nama Sendiri
                </button>
              </div>

              {/* Name Input Box */}
              <AnimatePresence initial={false}>
                {!isAnonymous && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="relative rounded-xl border border-[#E0DBCF] bg-[#FDFCF8] focus-within:ring-2 focus-within:ring-[#5A5A40]/20 focus-within:border-[#5A5A40] transition-all mb-2">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-3.5 w-3.5 text-[#8B8B6B]" />
                      </div>
                      <input
                        type="text"
                        name="senderName"
                        id="senderName-input"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Tuliskan nama lengkap Anda..."
                        maxLength={100}
                        required={!isAnonymous}
                        className="block w-full border-0 py-2.5 pl-9 pr-3 text-xs text-[#3D3D29] placeholder-[#8B8B6B]/40 focus:outline-none bg-transparent font-medium"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prayer Area Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="prayer-text-area" className="block text-[10px] font-bold uppercase tracking-widest text-[#8B8B6B]">
                  Isi Doa <span className="text-[#D4A373] ml-0.5">*</span>
                </label>
              </div>
              
              <div className="relative rounded-xl border border-[#E0DBCF] bg-[#FDFCF8] focus-within:ring-[#5A5A40]/20 focus-within:border-[#5A5A40] transition-all overflow-hidden border-2">
                <textarea
                  id="prayer-text-area"
                  rows={4}
                  value={prayerText}
                  onChange={(e) => setPrayerText(e.target.value)}
                  placeholder="Tuliskan doa yang ingin Anda titipkan secara ikhlas..."
                  required
                  className="block w-full border-0 p-3 text-xs text-[#3D3D29] placeholder-[#8B8B6B]/40 focus:outline-none resize-none bg-transparent leading-relaxed"
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              id="submit-prayer-btn"
              disabled={isSubmitting || prayerText.trim().length === 0}
              className={`w-full relative flex items-center justify-center py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all duration-205 ${
                isSubmitting || prayerText.trim().length === 0
                  ? 'bg-[#E0DBCF]/40 border border-[#E0DBCF]/60 text-[#8B8B6B]/60 cursor-not-allowed'
                  : 'bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs cursor-pointer active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sedang Menyimpan Doa...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Titipan Doa</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Modern success dialog */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" id="success-dialog-wrapper">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-[#FDFCF8] rounded-2xl border border-[#E0DBCF] p-6 text-center shadow-md overflow-hidden animate-none"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#5A5A40]/10 text-[#5A5A40] border border-[#E0DBCF] mb-3 relative z-10">
                <Check className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="relative z-10">
                <h3 className="text-lg font-serif font-bold text-[#3D3D29] mb-2">
                  Alhamdulillah!
                </h3>
                <p className="text-xs text-[#8B8B6B] leading-relaxed mb-5 font-sans">
                  Alhamdulillah, pesan Anda sudah terkirim. Semoga Allah paring kabul, ijabah, lan berkah sedayanipun. Aamiin.
                </p>
                
                <button
                  type="button"
                  id="success-modal-close-btn"
                  className="inline-flex w-full justify-center rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white py-3 text-[10px] font-bold uppercase tracking-widest shadow-xs transition-colors cursor-pointer"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Aamiin Allahumma Aamiin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
