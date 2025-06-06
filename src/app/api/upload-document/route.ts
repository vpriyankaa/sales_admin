// app/api/upload/route.ts
import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import { storage } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;

    if (!file || !orderId) {
      return NextResponse.json({ error: "File or orderId missing" }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const filename = `${nameWithoutExt}_${orderId}_${timestamp}${extension}`;
    const filePath = `documents/${filename}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Convert Buffer to Readable Stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(
          fileRef.createWriteStream({
            metadata: {
              contentType: file.type,
            },
            resumable: false,
          })
        )
        .on("error", reject)
        .on("finish", resolve);
    });

    // Make the file public
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({
      message: "File uploaded to Firebase",
      filename,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error uploading file to Firebase:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
