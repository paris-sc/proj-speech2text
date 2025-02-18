import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) return false;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello"
          }]
        }]
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('API Key validation error:', error);
    return false;
  }
}

async function makeTranscriptionRequest(apiKey: string, audioFile: File, base64Audio: string, retryCount = 0): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Please transcribe this audio file accurately with the following requirements:

1. Company Names and Proper Nouns:
   - Pay special attention to company names and proper nouns
   - Transcribe them exactly as they are spoken
   - Common company names to watch for: PipeRun (NOT "Papo Piranha" or similar misinterpretations)

2. Content Guidelines:
   - Replace any profanity or inappropriate language with "[inappropriate word]"
   - Maintain professional language throughout
   - If unsure about a word, use a professional alternative

3. Speaker Identification:
   - If you can identify specific names of speakers, use their actual names (e.g., "John:", "Maria:")
   - If names aren't identifiable but multiple speakers are present, use numbered labels (e.g., "Speaker 1:", "Speaker 2:")
   - For each speaker change:
     * Start a new line
     * Include the speaker name or label
     * Maintain proper punctuation
     * Include emotional context in parentheses if notable (e.g., "(excited)", "(thoughtfully)")

4. Formatting:
   - If there's only one speaker, provide a regular transcription without labels
   - Maintain proper paragraph breaks for readability
   - Use appropriate punctuation and capitalization

Please ensure accurate transcription while following these guidelines strictly.`
            },
            {
              inlineData: {
                mimeType: audioFile.type,
                data: base64Audio
              }
            }
          ]
        }]
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      const isOverloaded = responseData.error?.message?.includes('overloaded') || 
                          responseData.error?.message?.includes('rate limit');
      
      if (isOverloaded && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`API overloaded. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return makeTranscriptionRequest(apiKey, audioFile, base64Audio, retryCount + 1);
      }

      let errorMessage = 'Failed to transcribe audio. ';
      if (responseData.error?.message) {
        errorMessage += responseData.error.message;
      } else if (responseData.error?.status) {
        errorMessage += `Status: ${responseData.error.status}`;
      } else {
        errorMessage += `Status: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('The API returned an empty or invalid transcription. Please try again with a clearer audio file.');
    }

    return responseData.candidates[0].content.parts[0].text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during transcription request.');
  }
}

export async function transcribeAudio(audioFile: File, apiKey: string) {
  if (!apiKey.trim()) {
    throw new Error('Please enter a valid API key in the settings');
  }

  if (!audioFile) {
    throw new Error('No audio file provided');
  }

  if (!audioFile.type.startsWith('audio/')) {
    throw new Error('Invalid file type. Please provide an audio file');
  }

  try {
    // Convert audio file to base64
    const reader = new FileReader();
    const base64Audio = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = (error) => {
        reject(new Error('Failed to read audio file: ' + error.toString()));
      };
      reader.readAsDataURL(audioFile);
    });

    const transcription = await makeTranscriptionRequest(apiKey, audioFile, base64Audio);
    
    // Validate transcription content
    if (transcription.trim().length === 0) {
      throw new Error('The transcription result is empty. Please try again with a clearer audio file.');
    }

    return transcription;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Transcription error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    } else {
      console.error('Unexpected transcription error:', error);
      throw new Error('An unexpected error occurred during transcription. Please try again.');
    }
  }
}