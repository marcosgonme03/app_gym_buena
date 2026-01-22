import React from 'react';
import { WeeklyInsight } from '../../types/member';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

interface WeeklyInsightsProps {
  insights: WeeklyInsight[];
}

const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({ insights }) => {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type: WeeklyInsight['type']) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-4 h-4" />;
      case 'decline':
        return <TrendingDown className="w-4 h-4" />;
      case 'milestone':
        return <Award className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getColors = (type: WeeklyInsight['type']) => {
    switch (type) {
      case 'improvement':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
        };
      case 'decline':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300'
        };
      case 'milestone':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          text: 'text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-dark-800',
          border: 'border-gray-200 dark:border-dark-700',
          icon: 'text-gray-600 dark:text-dark-400',
          text: 'text-gray-700 dark:text-dark-300',
          badge: 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-dark-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          Análisis Semanal
        </h3>
        <span className="text-xs text-gray-500 dark:text-dark-400">
          vs. semana anterior
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const colors = getColors(insight.type);
          const isPositive = insight.type === 'improvement' || insight.type === 'milestone';

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`mt-0.5 ${colors.icon}`}>
                  {getIcon(insight.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      {insight.metric}
                    </h4>
                    <span className={`
                      text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap
                      ${colors.badge}
                    `}>
                      {isPositive ? '+' : ''}{insight.change > 0 ? '+' : ''}{insight.change.toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-dark-400 mb-2">
                    {insight.message}
                  </p>

                  {/* Stats comparison */}
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-dark-500">Anterior: </span>
                      <span className="font-medium text-gray-700 dark:text-dark-300">
                        {insight.previousValue}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-dark-500">Actual: </span>
                      <span className={`font-bold ${colors.text}`}>
                        {insight.currentValue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
        <p className="text-xs text-center text-gray-600 dark:text-dark-400">
          {insights.filter(i => i.type === 'improvement').length > 0 
            ? '¡Sigue así! Estás mejorando cada semana 💪' 
            : 'Mantén la consistencia para ver mejoras'
          }
        </p>
      </div>
    </div>
  );
};

export default WeeklyInsights;
