import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import path from "path"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string

    if (!file || !orderId) {
      return NextResponse.json({ error: "File or orderId missing" }, { status: 400 })
    }

    const timestamp = Date.now()
    const originalName = file.name
    const extension = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, extension)
    const filename = `${nameWithoutExt}_${orderId}_${timestamp}${extension}`
    const filePath = `documents/${filename}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(filePath)

    return NextResponse.json({
      message: "File uploaded to Supabase",
      filename,
      url: publicUrl,
    })
  } catch (error) {
    console.error("Error uploading file to Supabase:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
