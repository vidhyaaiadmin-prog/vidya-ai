'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { authFetch } from './api-client';

// Vault Mode: tab-focus violation tracking (native browser events, zero cost)
// plus periodic webcam snapshots reviewed by Gemini Vision (existing AI infra,
// no separate ML model to ship). Informational only for now — there's no
// teacher-review dashboard yet, so this surfaces a transparency summary to
// the student rather than auto-failing anyone.
export function useVaultMode(enabled: boolean) {
  const [violations, setViolations] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.hidden) setViolations(v => [...v, `Tab switched away · ${new Date().toLocaleTimeString()}`]);
    };
    const onBlur = () => setViolations(v => [...v, `Window lost focus · ${new Date().toLocaleTimeString()}`]);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);

  const startCamera = useCallback(async () => {
    if (!enabled) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      return true;
    } catch {
      return false;
    }
  }, [enabled]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const snapshotCheck = useCallback(async () => {
    if (!enabled || !videoRef.current || !streamRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    try {
      const res = await authFetch('/api/ai/proctor', { image: base64 });
      const data = await res.json();
      if (data.flag) setFlags(f => [...f, data.flag]);
    } catch { /* fail open */ }
  }, [enabled]);

  return { violations, flags, videoRef, startCamera, stopCamera, snapshotCheck };
}
