// @ts-nocheck
import { Clipboard } from 'react-native';

let internalClipboardText: string = '';

export const copyToClipboard = (text: string) => {
  if (!text) return;
  internalClipboardText = text.trim();
  try {
    if (Clipboard && typeof Clipboard.setString === 'function') {
      Clipboard.setString(text.trim());
    }
  } catch (e) {
    console.log('[ClipboardStore] OS Clipboard setString note:', e);
  }
};

export const getCopiedClipboardText = async (): Promise<string> => {
  try {
    if (Clipboard && typeof Clipboard.getString === 'function') {
      const osText = await Clipboard.getString();
      if (osText && osText.trim().length > 0) {
        return osText.trim();
      }
    }
  } catch (e) {
    console.log('[ClipboardStore] OS Clipboard getString note:', e);
  }
  return internalClipboardText;
};
