import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (
  audioFile: File,
  onProgress: (progress: number, message: string) => void
) => {
  try {
    if (!audioFile || !audioFile.type.startsWith("audio/")) {
      throw new Error("Invalid audio file");
    }

    // Maximum file size check (25 MB limit for Whisper API)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      throw new Error("Audio file exceeds maximum size of 25MB");
    }

    // Update progress
    if (onProgress) onProgress(0, "Starting transcription...");

    // Call Whisper API using OpenAI SDK
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      // Enable language detection by omitting the language parameter or set to null
      // language: null,
      // You can add other parameters here to improve accuracy if needed
    });

    // Update progress
    if (onProgress) onProgress(100, "Transcription complete!");

    return transcription.text;
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw error;
  }
};

export const convertSpeechToText = async (audioBlob: Blob) => {
  try {
    console.log("AudioBlob", audioBlob)
    // Convert blob to file
    const audioFile = new File([audioBlob], "recording.webm", {
      type: "audio/webm",
    });

    // Use Whisper API for transcription
    return await transcribeAudio(audioFile, () => { });
  } catch (error) {
    console.error("Speech to text conversion error:", error);
    throw error;
  }
};
