import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert() is a no-op stub — it never shows
// anything and never invokes button callbacks. Since this app also ships
// as a web build, any confirmation/notification needs a web fallback.
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function showConfirm(options: ConfirmOptions, onConfirm: () => void): void {
  const { title, message, confirmText = 'OK', cancelText = 'Cancelar', destructive } = options;
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
