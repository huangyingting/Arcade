import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'files');
    fs.mkdirSync(uploadDir, { recursive: true });

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = (file.name || 'upload.png').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return NextResponse.json({
        ok: true,
        url: `/uploads/files/${fileName}`,
        fileName,
        size: buffer.length,
      });
    } else {
      const body = await request.json();
      const dataUrl: string = body.dataUrl || '';
      const rawName: string = body.fileName || 'upload.png';
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid dataUrl payload' }, { status: 400 });
      }
      const buffer = Buffer.from(match[2], 'base64');
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return NextResponse.json({
        ok: true,
        url: `/uploads/files/${fileName}`,
        fileName,
        size: buffer.length,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
