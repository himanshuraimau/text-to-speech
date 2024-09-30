import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "elevenlabs";
import { writeFile, readFile } from 'fs/promises';
import { v4 as uuid } from "uuid";
import * as dotenv from "dotenv";
import path from 'path';
import { Readable } from 'stream';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY in environment variables");
}

// Initialize the ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

// Convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  console.log("Converting stream to buffer...");
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => {
      console.error("Error in stream:", err);
      reject(err);
    });
    stream.on('end', () => {
      console.log("Stream conversion completed.");
      resolve(Buffer.concat(chunks));
    });
  });
}

// Generate the audio file and save it
async function createAudioFileFromText(text: string): Promise<string> {
  console.log("Generating audio from text:", text);
  try {
    const audio = await client.generate({
      voice: "Rachel", // Adjust the voice if needed
      model_id: "eleven_turbo_v2",
      text,
    });

    const fileName = `${uuid()}.mp3`; // Unique file name using UUID
    const filePath = path.join(process.cwd(), 'public', 'audio', fileName);
    console.log("Audio generated. Saving to file:", filePath);

    const buffer = await streamToBuffer(audio);
    await writeFile(filePath, buffer); // Save the audio file

    console.log("File written successfully:", fileName);
    return fileName;
  } catch (error) {
    console.error("Error generating audio file:", error);
    throw error;
  }
}

// POST: Generate audio file and return the file path
export async function POST(request: Request) {
  console.log("Received POST request");
  try {
    const { text } = await request.json();
    console.log("Request body:", text);

    if (!text) {
      console.error("Text is required but missing");
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Generate the audio and save the file
    const fileName = await createAudioFileFromText(text);
    console.log("Audio file created:", fileName);

    // Return the filename for frontend to access the file
    return NextResponse.json({ success: true, fileName }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Serve the audio file
export async function GET(request: Request) {
  console.log("Received GET request");
  const url = new URL(request.url);
  const fileName = path.basename(url.pathname); // Get file name from URL
  const filePath = path.join(process.cwd(), 'public', 'audio', fileName); // Full path to file
  console.log("Serving file:", filePath);

  try {
    // Read the file from the public/audio directory
    const file = await readFile(filePath);
    console.log("File read successfully:", fileName);

    // Return the audio file with appropriate headers
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error serving audio file:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
