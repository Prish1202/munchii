import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Eye, EyeOff, MessageSquare, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'munchii_chat_settings';

interface ChatSettingsData {
  hideTypingIndicator: boolean;
  hideBlueTick: boolean;
  hideUsername: boolean;
}

const defaults: ChatSettingsData = {
  hideTypingIndicator: false,
  hideBlueTick: false,
  hideUsername: false,
};

function load(): ChatSettingsData {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch { return defaults; }
}

export default function ChatSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ChatSettingsData>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggle = (key: keyof ChatSettingsData) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const items = [
    {
      key: 'hideTypingIndicator' as const,
      icon: MessageSquare,
      label: 'Hide Typing Indicator',
      desc: 'Others won\'t see when you\'re typing. You also won\'t see theirs.',
    },
    {
      key: 'hideBlueTick' as const,
      icon: Eye,
      label: 'Hide Read Receipts',
      desc: 'Blue ticks won\'t appear when you read messages. You also won\'t see theirs.',
    },
    {
      key: 'hideUsername' as const,
      icon: UserX,
      label: 'Hide Username in Chat',
      desc: 'Your username won\'t be shown in the chat header to others.',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/profile/settings')} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg">Chat Settings</h1>
        </div>

        <motion.div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Privacy Controls</h3>
          </div>
          {items.map((item, i) => (
            <div key={item.key} className={`flex items-center justify-between px-5 py-4 ${i < items.length - 1 ? 'border-b border-border/50' : ''}`}>
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
        </motion.div>

        <motion.div
          className="bg-muted/50 rounded-2xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Note:</strong> Hiding typing indicators and read receipts works both ways — if you turn them off, you also won't see the other person's status.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export function getChatSettings(): ChatSettingsData {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch { return defaults; }
}
