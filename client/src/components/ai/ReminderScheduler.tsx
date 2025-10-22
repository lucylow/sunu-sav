// frontend/src/components/ai/ReminderScheduler.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, Smartphone, MessageSquare } from 'lucide-react';
import aiClient from '../../ai/mockAiClient';

interface ReminderSchedulerProps {
  userId: string;
  history: any[];
}

interface ReminderResult {
  userId: string;
  nextReminderAt: string;
  reason: string;
}

export default function ReminderScheduler({ userId, history }: ReminderSchedulerProps) {
  const [reminder, setReminder] = useState<ReminderResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await aiClient.nextRemindTime(userId);
        if (mounted && response.success) {
          setReminder(response.data);
        }
      } catch (error) {
        console.error('Reminder scheduling error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, JSON.stringify(history)]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reminder) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Failed to compute reminder schedule</p>
        </CardContent>
      </Card>
    );
  }

  const nextReminderDate = new Date(reminder.nextReminderAt);
  const now = new Date();
  const timeUntilReminder = nextReminderDate.getTime() - now.getTime();
  const hoursUntil = Math.round(timeUntilReminder / (1000 * 60 * 60));

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'user_pattern':
        return 'Based on your typical payment times';
      case 'optimal_engagement':
        return 'Optimal time for engagement';
      case 'avoid_spam':
        return 'Avoiding notification fatigue';
      default:
        return 'AI-optimized timing';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Reminders
          <Badge variant="outline" className="ml-auto">AI Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Reminder */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Next Reminder</span>
          </div>
          <p className="text-lg font-bold text-blue-800">
            {nextReminderDate.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">
            {hoursUntil > 0 ? `In ${hoursUntil} hours` : 'Scheduled for today'}
          </p>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">AI Reasoning</h4>
          <p className="text-sm text-green-800">
            {getReasonText(reminder.reason)}
          </p>
        </div>

        {/* Reminder Channels */}
        <div className="space-y-2">
          <h4 className="font-medium">Reminder Channels</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-600" />
                <span className="text-sm">SMS</span>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <span className="text-sm">WhatsApp</span>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Push Notification</span>
              </div>
              <Badge variant="outline">Inactive</Badge>
            </div>
          </div>
        </div>

        {/* Behavioral Insights */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Behavioral Insights</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>• You typically pay between 6-8 PM</p>
            <p>• Best response rate on Tuesday evenings</p>
            <p>• Prefer SMS over WhatsApp for urgent reminders</p>
          </div>
        </div>

        {/* Reminder History */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Reminders</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Payment reminder - Group "Market Women"</span>
              <span className="text-gray-500">2 days ago</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Weekly contribution due</span>
              <span className="text-gray-500">1 week ago</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span>Group meeting reminder</span>
              <span className="text-gray-500">2 weeks ago</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            Send Now
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Customize
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
