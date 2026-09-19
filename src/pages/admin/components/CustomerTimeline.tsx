import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from '../../../lib/firebase';
import { TimelineEvent } from '../../../types';
import { Clock, History as HistoryIcon, AlertCircle, CheckCircle2, RotateCcw, UserPlus, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CustomerTimelineProps {
  customerId: string;
}

export default function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  const { data: events, isLoading, error } = useQuery<TimelineEvent[]>({
    queryKey: ['customer-timeline', customerId],
    queryFn: async () => {
      if (!isFirebaseReady()) return [];
      const timelineRef = collection(db, 'customers', customerId, 'timeline');
      const q = query(timelineRef, orderBy('createdAt', 'desc'));
      
      try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as TimelineEvent[];
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `customers/${customerId}/timeline`);
        return [];
      }
    },
    enabled: !!customerId,
    retry: false
  });

  const getEventStyles = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'customer_created': return { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' };
      case 'converted_from_lead': return { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent-soft' };
      case 'status_changed': return { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'notes_updated': return { icon: Info, color: 'text-ink-muted', bg: 'bg-surface-low' };
      case 'customer_updated': return { icon: HistoryIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      default: return { icon: Info, color: 'text-ink-faint', bg: 'bg-surface-low' };
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString();
  };

  if (isLoading) {
    return <div className="py-10 text-center text-ink-faint text-sm animate-pulse">Loading timeline...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
        <AlertCircle size={18} />
        <p>Could not load customer history. Unauthorized or connection error.</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-20 text-center bg-surface-low border border-dashed border-rule">
        <div className="w-12 h-12 bg-surface flex items-center justify-center mx-auto mb-4 text-ink-faint">
          <HistoryIcon size={24} />
        </div>
        <p className="text-ink-muted font-medium">No history available</p>
        <p className="text-ink-faint text-xs mt-1">Operational logs will appear here as they are registered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-surface-mid">
      {events.map((event) => {
        const styles = getEventStyles(event.type);
        return (
          <div key={event.id} className="relative pl-12 group">
            <div className={cn(
              "absolute left-0 top-0 w-10 h-10 flex items-center justify-center border-4 border-white z-10 transition-transform group-hover:scale-110",
              styles.bg,
              styles.color
            )}>
              <styles.icon size={16} />
            </div>
            
            <div className="bg-surface p-5 border border-rule transition-all group-hover:translate-x-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h5 className="font-bold text-ink text-sm">{event.title}</h5>
                <span className="text-label-sm text-ink-faint uppercase flex items-center gap-1">
                  <Clock size={10} /> {formatDate(event.createdAt)}
                </span>
              </div>
              <p className="text-ink-muted text-sm leading-relaxed">{event.description}</p>
              {event.createdBy && (
                <div className="mt-3 pt-3 border-t border-rule flex items-center gap-2 text-label-sm text-ink-faint uppercase">
                  <UserPlus size={10} /> Executed by: <span className="text-ink">{event.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
