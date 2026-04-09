'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuthStore } from '@/store/auth-store';
import { Bell, Lock, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';

const settings = [
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Manage how you receive notifications',
    settings: [
      { label: 'Email Notifications', description: 'Receive updates via email' },
      { label: 'Quiz Reminders', description: 'Get reminded to complete quizzes' },
      { label: 'Achievement Alerts', description: 'Celebrate your milestones' },
    ],
  },
  {
    icon: Eye,
    title: 'Privacy',
    description: 'Control your privacy settings',
    settings: [
      { label: 'Public Profile', description: 'Show your profile to other users' },
      { label: 'Share Progress', description: 'Share your learning progress' },
      { label: 'Data Collection', description: 'Allow analytics data collection' },
    ],
  },
  {
    icon: Lock,
    title: 'Security',
    description: 'Manage your security settings',
    settings: [
      { label: 'Two-Factor Authentication', description: 'Add an extra layer of security' },
      { label: 'Login Alerts', description: 'Get notified of new login attempts' },
    ],
  },
];

export default function SettingsPage() {
  const logout = useAuthStore((state) => state.logout);
  const [toggles, setToggles] = useState<Record<string, Record<string, boolean>>>({
    Notifications: {
      'Email Notifications': true,
      'Quiz Reminders': true,
      'Achievement Alerts': false,
    },
    Privacy: {
      'Public Profile': false,
      'Share Progress': true,
      'Data Collection': false,
    },
    Security: {
      'Two-Factor Authentication': false,
      'Login Alerts': true,
    },
  });

  const [loading, setLoading] = useState(false);

  const handleToggle = (section: string, setting: string) => {
    setToggles((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: !prev[section][setting],
      },
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Settings Sections */}
        {settings.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {section.settings.map((setting) => (
                      <motion.div
                        key={setting.label}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{setting.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                        <Switch
                          checked={toggles[section.title]?.[setting.label] || false}
                          onCheckedChange={() =>
                            handleToggle(section.title, setting.label)
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Logout</p>
                  <p className="text-xs text-muted-foreground">
                    Sign out from your account
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}
                  >
                    Logout
                  </Button>
                </motion.div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-red-600">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive">Delete Account</Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-end gap-3"
        >
          <Button variant="outline">Cancel</Button>
          <Button disabled={loading} onClick={handleSaveSettings}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
