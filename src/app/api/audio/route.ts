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

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function createAudioFileFromText(text: string): Promise<string> {
  try {
    const audio = await client.generate({
      voice: "Rachel",
      model_id: "eleven_turbo_v2",
      text,
    });

    const fileName = `${uuid()}.mp3`;
    const filePath = path.join(process.cwd(), 'public', 'audio', fileName);
    const buffer = await streamToBuffer(audio);
    await writeFile(filePath, buffer);

    return fileName;
  } catch (error) {
    console.error("Error generating audio file:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const fileName = await createAudioFileFromText(text);

    return NextResponse.json({ success: true, fileName }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileName = path.basename(url.pathname);
  const filePath = path.join(process.cwd(), 'public', 'audio', fileName);

  try {
    const file = await readFile(filePath);
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