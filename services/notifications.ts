import { Platform } from 'react-native';

// Local notifications only — no push token / backend involved. Merely
// importing expo-notifications triggers its push-token auto-registration
// side effect at module-load time, which has no real storage to work with
// during web/static export — so the import itself is deferred to native
// platforms only, not just the calls.
const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

let channelReady = false;

async function loadNotifications() {
  if (!SUPPORTED) return null;
  return import('expo-notifications');
}

async function ensureReady(): Promise<typeof import('expo-notifications') | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return null;

    if (!channelReady && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      channelReady = true;
    }
    return Notifications;
  } catch (e) {
    console.error('Erro ao preparar notificações:', e);
    return null;
  }
}

export async function notifyMissedTask(responsibleName: string, taskTitle: string, dateLabel: string): Promise<void> {
  const Notifications = await ensureReady();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tarefa não concluída',
        body: `${responsibleName} não marcou "${taskTitle}" como feita em ${dateLabel}`,
      },
      trigger: null,
    });
  } catch (e) {
    console.error('Erro ao disparar notificação:', e);
  }
}
