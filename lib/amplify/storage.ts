import { uploadData, getUrl, remove } from "aws-amplify/storage";

export interface UploadResult {
  path: string;
  url: string;
}

/**
 * Upload a file to Amplify Storage
 * @param file - The file to upload
 * @param path - The path within the media folder (e.g., "userId/filename.jpg")
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns The path and public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const fullPath = `media/${path}`;

  const result = await uploadData({
    path: fullPath,
    data: file,
    options: {
      contentType: file.type,
      onProgress: (event) => {
        if (onProgress && event.totalBytes) {
          onProgress((event.transferredBytes / event.totalBytes) * 100);
        }
      },
    },
  }).result;

  // Get public URL
  const urlResult = await getUrl({ path: result.path });

  return {
    path: result.path,
    url: urlResult.url.toString(),
  };
}

/**
 * Delete a file from Amplify Storage
 * @param path - The full path of the file to delete (including media/ prefix)
 */
export async function deleteFile(path: string): Promise<void> {
  await remove({ path });
}

/**
 * Get the public URL for a file in Amplify Storage
 * @param path - The full path of the file (including media/ prefix)
 * @returns The public URL
 */
export async function getFileUrl(path: string): Promise<string> {
  const result = await getUrl({ path });
  return result.url.toString();
}

/**
 * Check if a URL is from Amplify Storage (S3)
 * @param url - The URL to check
 * @returns True if the URL is from Amplify/S3 storage
 */
export function isAmplifyStorageUrl(url: string): boolean {
  return (
    url.includes("amplifyapp") ||
    url.includes("s3.") ||
    url.includes("amazonaws.com")
  );
}

/**
 * Extract the storage path from an Amplify Storage URL
 * @param url - The Amplify Storage URL
 * @returns The path portion, or null if not an Amplify URL
 */
export function extractPathFromUrl(url: string): string | null {
  if (!isAmplifyStorageUrl(url)) {
    return null;
  }

  // Try to extract path after /media/
  const mediaMatch = url.match(/\/media\/(.+?)(\?|$)/);
  if (mediaMatch) {
    return `media/${mediaMatch[1]}`;
  }

  return null;
}
