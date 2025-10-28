import type { APIRoute } from 'astro';
import subsrt from 'subsrt-ts';

// Supported subtitle formats and their file extensions
const SUPPORTED_FORMATS = {
  srt: 'srt',
  vtt: 'vtt',
  sub: 'sub',
  sbv: 'sbv',
  lrc: 'lrc',
  smi: 'smi',
  ssa: 'ssa',
  ass: 'ass',
  json: 'json',
} as const;

type SupportedFormat = keyof typeof SUPPORTED_FORMATS;

// Content type mapping for different formats
const CONTENT_TYPES = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  sub: 'text/plain',
  sbv: 'text/plain',
  lrc: 'text/plain',
  smi: 'text/plain',
  ssa: 'text/plain',
  ass: 'text/plain',
  json: 'application/json',
} as const;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();
    const { subtitles, format, filename } = body;

    // Validate request data
    if (!subtitles || !Array.isArray(subtitles) || !format || !filename) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate format
    if (!Object.keys(SUPPORTED_FORMATS).includes(format)) {
      return new Response(
        JSON.stringify({
          error: 'Unsupported subtitle format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process subtitles into the format expected by subsrt
    const processedSubtitles = subtitles.map((sub) => ({
      start: sub.start,
      end: sub.end,
      duration: sub.end - sub.start,
      text: sub.text || sub.content,
      settings: {},
    }));

    // Convert subtitles to requested format
    const options = {
      format: format as SupportedFormat,
      fps: 25, // for SUB format
      verbose: false,
    };

    // Build the content with proper error handling
    let content;
    try {
      content = subsrt.build(processedSubtitles, options);
      if (!content) {
        throw new Error('Failed to build subtitle content');
      }
    } catch (buildError) {
      console.error('Error building subtitles:', buildError);
      return new Response(
        JSON.stringify({
          error: 'Failed to convert subtitles to the requested format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate output filename
    const extension = SUPPORTED_FORMATS[format as SupportedFormat];
    const outputFilename =
      filename.replace(/\.[^/.]+$/, '') +
      '-subtitletranslatorai.com.' +
      extension;

    // Add BOM for UTF-8 text files
    const textFormats = [
      'srt',
      'vtt',
      'sub',
      'sbv',
      'lrc',
      'smi',
      'ssa',
      'ass',
    ];
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const finalContent = textFormats.includes(format)
      ? new Blob([bom, content], {
          type: CONTENT_TYPES[format as SupportedFormat],
        })
      : new Blob([content], { type: CONTENT_TYPES[format as SupportedFormat] });

    // Return the file with appropriate headers
    return new Response(finalContent, {
      headers: {
        'Content-Type': CONTENT_TYPES[format as SupportedFormat],
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error processing subtitle download:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
