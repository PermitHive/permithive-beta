import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface CodeCheckPreviewProps {
  id: string;
  onClose: () => void;
  isOpen: boolean;
}

export function CodeCheckPreview({ id, onClose, isOpen }: CodeCheckPreviewProps) {
  const router = useRouter();
  const [codeCheckData, setCodeCheckData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCodeCheck() {
      if (!isOpen || !id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('code_checks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setCodeCheckData(data);
      } catch (err) {
        console.error('Error fetching code check:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCodeCheck();
  }, [isOpen, id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !id) return null;

  const getPreviewUrl = () => {
    if (!codeCheckData) return '';
    const { address, latitude, longitude, id: codeCheckId } = codeCheckData;
    return `/code-check?address=${encodeURIComponent(address)}&latitude=${latitude}&longitude=${longitude}&codeCheckId=${codeCheckId}`;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Preview Panel */}
      <div 
        className={`
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
          w-[95vw] h-[90vh] 
          bg-white shadow-2xl z-50 rounded-xl overflow-hidden
          transform transition-all duration-300 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(getPreviewUrl())}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-full h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {codeCheckData && (
          <iframe 
            src={getPreviewUrl()}
            className="w-full h-full border-none"
          />
        )}
      </div>
    </>
  );
} 