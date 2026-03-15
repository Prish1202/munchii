import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReportInput {
  reportedUserId?: string;
  reportedMessageId?: string;
  reportType: string;
  reason: string;
}

export function useSubmitReport() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ReportInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('abuse_reports' as any).insert({
        reporter_id: user.id,
        reported_user_id: input.reportedUserId || null,
        reported_message_id: input.reportedMessageId || null,
        report_type: input.reportType,
        reason: input.reason,
      });
      if (error) throw error;

      // Also send email notification via edge function
      try {
        await supabase.functions.invoke('send-abuse-report-email', {
          body: {
            reporterId: user.id,
            reportedUserId: input.reportedUserId,
            reportType: input.reportType,
            reason: input.reason,
          },
        });
      } catch {
        // Email is best-effort, don't fail the report
      }
    },
    onSuccess: () => {
      toast.success('Report submitted. Our team will review it shortly.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit report');
    },
  });
}
