import { NextResponse } from 'next/server';
import { convertSpeechToText } from './utils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      console.error('No audio file received in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      type: audioFile.type,
      size: audioFile.size,
    });

    console.log("First Step")
    // Check file size (Whisper API limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file size exceeds 25MB limit' },
        { status: 400 }
      );
    }
    console.log("Next step")
    try {
      // Use the utility function to transcribe the audio
      console.log("audiofile", audioFile)
      const text = await convertSpeechToText(audioFile);
      return NextResponse.json({ text });
    } catch (error: Error | unknown) {
      console.error('Transcription error:', error);
      return NextResponse.json(
        { error: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: Error | unknown) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 