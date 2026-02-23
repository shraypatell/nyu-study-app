import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Text } from './Text';
import { useAppTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETTINGS_KEY = 'timerSettings';

export interface TimerSettings {
  enableVibration: boolean;
  enableSound: boolean;
  autoStartNext: boolean;
  showWarnings: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  enableVibration: true,
  enableSound: true,
  autoStartNext: false,
  showWarnings: true,
};

export async function getTimerSettings(): Promise<TimerSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveTimerSettings(settings: TimerSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save timer settings:', error);
  }
}

export function TimerSettingsModal({ isOpen, onClose }: TimerSettingsModalProps) {
  const { t } = useAppTheme();
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      getTimerSettings().then(setSettings);
    }
  }, [isOpen]);

  const handleToggle = async (key: keyof TimerSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveTimerSettings(updated);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modal, { backgroundColor: t.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text variant="h3" style={[styles.title, { color: t.text }]}>
              Timer Settings
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.closeBtn, { color: t.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Vibration Toggle */}
            <View style={[styles.settingRow, { borderBottomColor: t.border }]}>
              <View style={styles.settingLabel}>
                <Text variant="body" style={[styles.settingTitle, { color: t.text }]}>
                  Vibration
                </Text>
                <Text variant="bodySmall" style={[styles.settingDesc, { color: t.muted }]}>
                  Haptic feedback on timer events
                </Text>
              </View>
              <Switch
                value={settings.enableVibration}
                onValueChange={() => handleToggle('enableVibration')}
                trackColor={{ false: t.dimmed, true: t.indigo }}
              />
            </View>

            {/* Sound Toggle */}
            <View style={[styles.settingRow, { borderBottomColor: t.border }]}>
              <View style={styles.settingLabel}>
                <Text variant="body" style={[styles.settingTitle, { color: t.text }]}>
                  Sound
                </Text>
                <Text variant="bodySmall" style={[styles.settingDesc, { color: t.muted }]}>
                  Audio notifications
                </Text>
              </View>
              <Switch
                value={settings.enableSound}
                onValueChange={() => handleToggle('enableSound')}
                trackColor={{ false: t.dimmed, true: t.indigo }}
              />
            </View>

            {/* Auto Start Toggle */}
            <View style={[styles.settingRow, { borderBottomColor: t.border }]}>
              <View style={styles.settingLabel}>
                <Text variant="body" style={[styles.settingTitle, { color: t.text }]}>
                  Auto-Start Next Session
                </Text>
                <Text variant="bodySmall" style={[styles.settingDesc, { color: t.muted }]}>
                  Automatically start next timer after pause
                </Text>
              </View>
              <Switch
                value={settings.autoStartNext}
                onValueChange={() => handleToggle('autoStartNext')}
                trackColor={{ false: t.dimmed, true: t.indigo }}
              />
            </View>

            {/* Warnings Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="body" style={[styles.settingTitle, { color: t.text }]}>
                  Show Warnings
                </Text>
                <Text variant="bodySmall" style={[styles.settingDesc, { color: t.muted }]}>
                  Leaving app will stop timer (FOCUS mode)
                </Text>
              </View>
              <Switch
                value={settings.showWarnings}
                onValueChange={() => handleToggle('showWarnings')}
                trackColor={{ false: t.dimmed, true: t.indigo }}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButtonContainer, { backgroundColor: t.segControl }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text variant="body" style={[styles.closeButtonText, { color: t.text }]}>
              Done
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '600',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLabel: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
  },
  closeButtonContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  closeButtonText: {
    fontWeight: '600',
  },
});
