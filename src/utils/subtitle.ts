import * as subsrt from 'subsrt-ts';

export interface SubtitleCaption {
  type: 'caption' | 'meta';
  index: number;
  start: number;
  end: number;
  duration: number;
  content: string;
  text: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_EXTENSIONS = [
  '.srt',
  '.vtt',
  '.sub',
  '.sbv',
  '.lrc',
  '.smi',
  '.ssa',
  '.ass',
  '.json',
];

export function validateSubtitleFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File size exceeds 1MB limit',
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!VALID_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Invalid file type. Supported formats: ${VALID_EXTENSIONS.join(
        ', '
      )}`,
    };
  }

  return { isValid: true };
}

export async function parseSubtitleFile(
  file: File
): Promise<SubtitleCaption[]> {
  try {
    const content = await file.text();
    const parsedContent = subsrt.parse(content);

    if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
      throw new Error('No valid subtitles found in file');
    }

    // Filter out non-caption items and clean each caption
    return parsedContent
      .filter((caption: any) => caption.type === 'caption' || !caption.type)
      .map((caption: any, idx: number) => ({
        type: 'caption',
        index: idx + 1, // Start indices from 1
        start: caption.start || 0,
        end: caption.end || 0,
        duration: caption.duration || 0,
        content: sanitizeContent(caption.content || caption.text || ''),
        text: sanitizeContent(caption.text || ''),
      }));
  } catch (error) {
    throw new Error(`Failed to parse subtitle file: ${error.message}`);
  }
}

function sanitizeContent(content: string): string {
  // remove HTML tags and trim whitespace
  content = content.replace(/<\/?[^>]+(>|$)/g, '');

  // Basic XSS prevention
  return (
    content
      .replace(/</g, '')
      .replace(/>/g, '')
      // .replace(/&/g, ' and ')
      // .replace(/"/g, '&quot;')
      // .replace(/'/g, '&#039;')
      .trim()
  );
}

export function formatTime(ms: number): string {
  const pad = (n: number): string => n.toString().padStart(2, '0');

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

export function createSRTContent(captions: SubtitleCaption[]): string {
  return captions
    .map((caption, index) => {
      const number = index + 1;
      const timeCode = `${formatTime(caption.start)} --> ${formatTime(
        caption.end
      )}`;
      return `${number}\n${timeCode}\n${caption.content}\n`;
    })
    .join('\n');
}
