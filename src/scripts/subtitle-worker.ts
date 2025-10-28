// Type definitions
type SubtitleData = {
  index: number;
  start: string;
  end: string;
  content: string;
};

type ProcessRequest = {
  type: 'process';
  subtitles: SubtitleData[];
  format: string;
  filename: string;
};

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEvent<ProcessRequest>) => {
  if (e.data.type === 'process') {
    const { subtitles, format, filename } = e.data;

    try {
      // Process subtitles in chunks of 100
      const CHUNK_SIZE = 100;
      const chunks = Math.ceil(subtitles.length / CHUNK_SIZE);

      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, subtitles.length);
        const chunk = subtitles.slice(start, end);

        // Process chunk
        const processed = chunk.map((sub) => ({
          ...sub,
          // Add any additional processing here
        }));

        // Report progress
        self.postMessage({
          type: 'progress',
          progress: (end / subtitles.length) * 100,
          processed,
        });
      }

      // Signal completion
      self.postMessage({
        type: 'complete',
        filename,
      });
    } catch (error) {
      // Report error
      self.postMessage({
        type: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
});
