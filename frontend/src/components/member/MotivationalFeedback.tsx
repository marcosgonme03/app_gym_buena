import React, { useEffect, useState } from 'react';
import { MotivationalMessage } from '../../types/member';
import { Sparkles, TrendingUp, Target, Zap } from 'lucide-react';

interface MotivationalFeedbackProps {
  messages: MotivationalMessage[];
  streakDays?: number;
  progressPercentage?: number;
}

const MotivationalFeedback: React.FC<MotivationalFeedbackProps> = ({ 
  messages, 
  streakDays = 0,
  progressPercentage = 0
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Rotate messages every 5 seconds
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setAnimate(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentMessageIndex];

  if (!currentMessage) {
    return null;
  }

  const getIcon = () => {
    switch (currentMessage.type) {
      case 'achievement':
        return <Sparkles className="w-5 h-5" />;
      case 'encouragement':
        return <Zap className="w-5 h-5" />;
      case 'milestone':
        return <Target className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    switch (currentMessage.type) {
      case 'achievement':
        return 'from-yellow-400 via-orange-500 to-pink-500';
      case 'encouragement':
        return 'from-green-400 via-emerald-500 to-teal-500';
      case 'milestone':
        return 'from-purple-400 via-pink-500 to-rose-500';
      default:
        return 'from-blue-400 via-cyan-500 to-teal-500';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Main message card */}
      <div className={`
        relative bg-gradient-to-br ${getGradient()} 
        rounded-xl p-5 lg:p-6 shadow-lg
        transition-all duration-300 ease-out
        ${animate ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}
      `}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          {/* Icon and type */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              {getIcon()}
              <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {currentMessage.type === 'achievement' && 'Logro'}
                {currentMessage.type === 'encouragement' && 'Motivación'}
                {currentMessage.type === 'milestone' && 'Hito'}
                {currentMessage.type === 'reminder' && 'Recordatorio'}
              </span>
            </div>
            {messages.length > 1 && (
              <div className="flex gap-1">
                {messages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentMessageIndex 
                        ? 'bg-white w-4' 
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <p className="text-white text-base lg:text-lg font-semibold leading-relaxed mb-2">
            {currentMessage.message}
          </p>

          {/* Context if available */}
          {currentMessage.context && (
            <p className="text-white/80 text-sm">
              {currentMessage.context}
            </p>
          )}

          {/* Stats row */}
          {(streakDays > 0 || progressPercentage > 0) && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
              {streakDays > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs">Racha</p>
                    <p className="text-white font-bold text-sm">{streakDays} días</p>
                  </div>
                </div>
              )}
              {progressPercentage > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs">Progreso</p>
                    <p className="text-white font-bold text-sm">{progressPercentage}%</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-2 right-2 w-16 h-16 border-2 border-white/10 rounded-full" />
        <div className="absolute bottom-2 left-2 w-12 h-12 border-2 border-white/10 rounded-full" />
      </div>
    </div>
  );
};

export default MotivationalFeedback;
