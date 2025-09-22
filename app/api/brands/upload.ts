
import { NextResponse } from 'next/server';

import formidable from 'formidable';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import getColors from 'get-image-colors';

export const config = {
  api: {
    bodyParser: false,
  },
};


export async function POST(req: Request) {
  // Pega o request nativo do Node.js
  const nodeReq = (req as any).req || req;
  const form = formidable({ maxFileSize: 1024 * 1024 * 1024 }); // 1GB
  const data = await new Promise((resolve, reject) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

  // Extrai campos e arquivo
  const { fields, files } = data as any;
  const file = files.moodboard;
  let moodboardText = '';
  let moodboardColors: string[] = [];
  let moodboardImages: string[] = [];
  if (file) {
    if (file.mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(file.filepath);
      const pdfData = await pdfParse(buffer);
      moodboardText = pdfData.text;
      // Extração visual com pdfjs-dist
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const ops = await page.getOperatorList();
        for (let j = 0; j < ops.fnArray.length; j++) {
          if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
            const imgName = ops.argsArray[j][0];
            const img = await page.objs.get(imgName);
            if (img && img.data) {
              // Salva imagem como base64 (apenas as primeiras para não sobrecarregar)
              if (moodboardImages.length < 3) {
                const base64 = Buffer.from(img.data).toString('base64');
                moodboardImages.push(`data:image/png;base64,${base64}`);
                // Extrai cores da imagem
                try {
                  const colors = await getColors(Buffer.from(img.data), 'image/png');
                  moodboardColors.push(...colors.map(c => c.hex()));
                } catch {}
              }
            }
          }
        }
      }
      // Limita a 5 cores únicas
      moodboardColors = Array.from(new Set(moodboardColors)).slice(0, 5);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = fs.readFileSync(file.filepath);
      const docxData = await mammoth.extractRawText({ buffer });
      moodboardText = docxData.value;
    } else if (file.mimetype.startsWith('text/')) {
      moodboardText = fs.readFileSync(file.filepath, 'utf-8');
    }
  }

  // Salva a marca com o texto, cores e imagens extraídos do moodboard
  const brand = await prisma.brand.create({
    data: {
      ...fields,
      moodboard: moodboardText || moodboardColors.length || moodboardImages.length ? { text: moodboardText, colors: moodboardColors, images: moodboardImages } : null,
    },
  });

  return NextResponse.json(brand);
}
