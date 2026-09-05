import React, { useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';

type LearningSessionType = 'mission' | 'learning_path' | 'assessment' | 'packet_tracer' | 'other_learning';

interface LearningContext {
  sessionType: LearningSessionType;
  missionId: number | null;
}

interface LearningActivityTrackerProps {
  pathname: string;
}

const heartbeatIntervalMs = 30_000;
const idleAfterMs = 90_000;

function getLearningContext(pathname: string): LearningContext | null {
  const missionMatch = pathname.match(/^\/missions\/(\d+)(?:\/|$)/);
  if (missionMatch) return { sessionType: 'mission', missionId: Number(missionMatch[1]) };
  if (pathname === '/missions' || pathname.startsWith('/missions?')) return { sessionType: 'other_learning', missionId: null };
  if (pathname.startsWith('/learning-paths')) return { sessionType: 'learning_path', missionId: null };
  if (pathname.startsWith('/assessment')) return { sessionType: 'assessment', missionId: null };
  if (pathname.startsWith('/packet-tracer')) return { sessionType: 'packet_tracer', missionId: null };
  return null;
}

export const LearningActivityTracker: React.FC<LearningActivityTrackerProps> = ({ pathname }) => {
  const learningContext = useMemo(() => getLearningContext(pathname), [pathname]);
  const lastInteractionAt = useRef(Date.now());
  const reportingActive = useRef(false);
  const requestInFlight = useRef(false);

  useEffect(() => {
    lastInteractionAt.current = Date.now();

    const markInteraction = () => { lastInteractionAt.current = Date.now(); };
    const sendState = async (keepalive = false) => {
      if (requestInFlight.current && !keepalive) return;
      const eligible = Boolean(
        learningContext
        && document.visibilityState === 'visible'
        && Date.now() - lastInteractionAt.current <= idleAfterMs,
      );

      if (!eligible && !reportingActive.current) return;
      requestInFlight.current = true;
      try {
        if (eligible && learningContext) {
          await api.sendLearningHeartbeat({
            active: true,
            sessionType: learningContext.sessionType,
            missionId: learningContext.missionId,
          }, keepalive);
          reportingActive.current = true;
        } else {
          await api.sendLearningHeartbeat({ active: false }, keepalive);
          reportingActive.current = false;
        }
      } catch {
        reportingActive.current = false;
      } finally {
        requestInFlight.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') lastInteractionAt.current = Date.now();
      void sendState();
    };
    const handlePageHide = () => {
      if (reportingActive.current) {
        void api.sendLearningHeartbeat({ active: false }, true).catch(() => undefined);
        reportingActive.current = false;
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    interactionEvents.forEach((eventName) => window.addEventListener(eventName, markInteraction, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    void sendState();
    const interval = window.setInterval(() => { void sendState(); }, heartbeatIntervalMs);

    return () => {
      window.clearInterval(interval);
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, markInteraction));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (reportingActive.current) {
        void api.sendLearningHeartbeat({ active: false }, true).catch(() => undefined);
        reportingActive.current = false;
      }
    };
  }, [learningContext]);

  return null;
};
