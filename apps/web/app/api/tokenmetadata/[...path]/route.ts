import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    console.log('image api called for: ', req.url);
    if(!req?.url) { return NextResponse.json({ success: false, message: 'No url received' }, { status: 500 })}
    if(req.url.indexOf('..') >= 0) { return NextResponse.json({ success: false, message: 'Invalid url' }, { status: 400 })}

    try {
        // const filePath = path.join(process.cwd(), 'public', dir);
        const partialPath = req.url.replace('/assets', '');
        const filePath = path.join(process.cwd(), 'public', ...partialPath.split('/').slice(4));
        console.log(`partialPath is: ${partialPath}`);
        console.log(`filepath is: ${filePath}`);

        // Read and serve the file
        const data = await fs.promises.readFile(filePath);
        return new NextResponse(data, {});
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch file' }, { status: 500 })
    }
}