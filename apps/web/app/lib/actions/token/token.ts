"use server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import fs from 'fs/promises';
import path from 'path';

export async function uploadImageToServer(imageFile: File | null): Promise<string> {
  try {
        if (!imageFile) {
            console.error('No image file provided');
            return '';
        }
        const uploadDir = path.join(process.cwd(), 'public', 'token-metadata');
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}_${imageFile.name.replaceAll(' ', '_')}`;    
        const filePath = path.join(uploadDir, fileName);

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(filePath, buffer);

        console.log(`Image uploaded successfully: ${filePath}`);
        return fileName;
    } catch (error) {
        console.error('Error uploading image:', error);
        return '';
    }
}


export async function saveTokenMetadata(name: string, symbol: string, description: string, imageUrl: string): Promise<string> {
    const metadataJson = {
        "name": name,
        "symbol":symbol,
        "description": description,
        "image": path.join(process.env.NEXTAUTH_URL || '','api','tokenmetadata', imageUrl)
    };
    
    const jsonContent = JSON.stringify(metadataJson, null, 2);
    const filePath = path.join(process.cwd(),'public','token-metadata', symbol+'-metadata.json');
    
    await fs.writeFile(filePath, jsonContent, 'utf8');
    console.log(`Metadata JSON file created at: ${filePath}`);
    return path.join(process.env.NEXTAUTH_URL || '','api', 'tokenmetadata', symbol+'metadata.json')
}

export async function saveToken(wallet:string, name: string, symbol: string, description: string, image: string, initSupply: number, tokenPubKey:string): Promise<boolean> {
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user?.id);
    try {
        const token = await prisma.token.create({
            data: {
                name: name,
                token: tokenPubKey,
                symbol: symbol,
                description: description,
                image: image,
                initSupply: initSupply,
                mintAuthority: wallet,
                createdBy: userId
            }
        });
        return true;
    } catch(error) {
        console.log(error);
        return false;
    }
}