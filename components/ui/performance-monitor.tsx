'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  cacheHits: number;
  networkRequests: number;
  lastUpdate: Date;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({ enabled = false, onMetricsUpdate }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHits: 0,
    networkRequests: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    let networkRequestCount = 0;
    let cacheHitCount = 0;

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      networkRequestCount++;
      return originalFetch(...args);
    };

    // Monitor performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const endTime = performance.now();
          const newMetrics = {
            loadTime: endTime - startTime,
            cacheHits: cacheHitCount,
            networkRequests: networkRequestCount,
            lastUpdate: new Date()
          };
          
          setMetrics(newMetrics);
          onMetricsUpdate?.(newMetrics);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, [enabled, onMetricsUpdate]);

  if (!enabled) return null;

  return (
    <Card className="border-dashed border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
          <Zap className="h-4 w-4" />
          Performance Monitor (DEV)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-300">
              Load: {metrics.loadTime.toFixed(2)}ms
            </span>
          </div>
          <div>
            <Badge variant="secondary" className="text-xs">
              Cache: {metrics.cacheHits}
            </Badge>
          </div>
          <div>
            <Badge variant="outline" className="text-xs">
              Network: {metrics.networkRequests}
            </Badge>
          </div>
          <div className="text-yellow-600 dark:text-yellow-400">
            {metrics.lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
