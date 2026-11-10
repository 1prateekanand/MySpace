import { bufferToBase64, base64ToUint8Array, deriveKeyFromPin, encryptData, decryptData, generateSalt } from './crypto';
import { dbService, WorkspaceState } from '../services/dbService';
import { workspaceDb } from './workspaceDb';

export interface EncryptedBackupContainer {
  version: number;
  format: 'myspace-encrypted-backup-v1';
  exportedAt: string;
  userEmail: string;
  salt: string;
  iv: string;
  ciphertext: string;
  checksum?: string;
}

export interface BackupDecryptedPayload {
  workspace: WorkspaceState;
  files: Array<{
    fileId: string;
    name?: string;
    mimeType?: string;
    base64Data: string;
  }>;
}

/**
 * Triggers the download of an encrypted backup file (.myspace.enc)
 */
export async function exportEncryptedBackup(
  pin: string,
  userEmail: string,
  namespace: string
): Promise<{ success: boolean; filename: string }> {
  // 1. Gather raw workspace state
  const rawState = dbService.getRawWorkspaceState();

  // 2. Gather vault blobs
  const storedBlobs = await workspaceDb.getAllVaultBlobsForNamespace(namespace);
  const serializedBlobs: BackupDecryptedPayload['files'] = [];

  for (const item of storedBlobs) {
    try {
      const buffer = await item.blob.arrayBuffer();
      serializedBlobs.push({
        fileId: item.fileId,
        name: item.name,
        mimeType: item.blob.type,
        base64Data: bufferToBase64(buffer),
      });
    } catch (e) {
      console.warn('Could not serialize blob for backup:', item.fileId, e);
    }
  }

  const payload: BackupDecryptedPayload = {
    workspace: rawState,
    files: serializedBlobs,
  };

  // 3. Derive key from PIN
  const salt = generateSalt(16);
  const key = await deriveKeyFromPin(pin, salt);

  // 4. Encrypt full payload
  const encrypted = await encryptData(payload, key, salt);

  const container: EncryptedBackupContainer = {
    version: 1,
    format: 'myspace-encrypted-backup-v1',
    exportedAt: new Date().toISOString(),
    userEmail: userEmail || 'user@myspace.local',
    salt: encrypted.salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  };

  const jsonStr = JSON.stringify(container, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
  const filename = `myspace-backup-${new Date().toISOString().split('T')[0]}.myspace.enc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);

  return { success: true, filename };
}

/**
 * Imports and restores an encrypted backup file (.myspace.enc or .json)
 */
export async function importEncryptedBackup(
  file: File,
  pin: string,
  targetNamespace: string
): Promise<{ success: boolean; error?: string; restoredItems?: { links: number; tasks: number; files: number } }> {
  try {
    const fileContent = await file.text();
    let container: EncryptedBackupContainer;

    try {
      container = JSON.parse(fileContent);
    } catch {
      return { success: false, error: 'Invalid backup file format. Expected JSON or .myspace.enc structure.' };
    }

    if (container.format !== 'myspace-encrypted-backup-v1' || !container.ciphertext || !container.iv || !container.salt) {
      return { success: false, error: 'Unrecognized backup format. Please select a valid .myspace.enc backup.' };
    }

    // Derive key using container salt and provided PIN
    const salt = base64ToUint8Array(container.salt);
    const key = await deriveKeyFromPin(pin, salt);

    let decrypted: BackupDecryptedPayload;
    try {
      decrypted = await decryptData<BackupDecryptedPayload>(
        { ciphertext: container.ciphertext, iv: container.iv },
        key
      );
    } catch {
      return { success: false, error: 'Incorrect PIN or corrupted backup file. Decryption failed.' };
    }

    if (!decrypted.workspace || !Array.isArray(decrypted.workspace.categories)) {
      return { success: false, error: 'Backup structure verification failed: corrupted workspace data.' };
    }

    // 1. Restore Vault Blobs into target namespace
    if (Array.isArray(decrypted.files)) {
      for (const f of decrypted.files) {
        try {
          const rawBytes = base64ToUint8Array(f.base64Data);
          const blob = new Blob([rawBytes.buffer as ArrayBuffer], { type: f.mimeType || 'application/octet-stream' });
          await workspaceDb.saveVaultBlob(targetNamespace, f.fileId, blob, f.name, f.mimeType);
        } catch (e) {
          console.warn('Failed restoring file blob:', f.fileId, e);
        }
      }
    }

    // 2. Save restored workspace state into active dbService
    await dbService.saveRawWorkspaceState(decrypted.workspace);

    return {
      success: true,
      restoredItems: {
        links: decrypted.workspace.links?.length || 0,
        tasks: decrypted.workspace.tasks?.length || 0,
        files: decrypted.workspace.files?.length || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to restore backup.' };
  }
}
