"use client";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card"
import { TextInput } from "@repo/ui/textInput";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRecoilState } from "recoil";
import { z } from "zod";
import { tokenAddState, walletState } from "../../app/store/walletState";
import { createToken, mintToken } from "../../app/lib/actions/token/tokenOps";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { saveToken, saveTokenMetadata, uploadImageToServer } from "../../app/lib/actions/token/token";
import { PublicKey } from "@solana/web3.js";
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

interface FormData {
    name: string;
    symbol: string;
    decimals: number;
    initSupply: number;
    wallet?: string;
    image?: File;
}

const addClientSchema = z.object({
    name: z.string().min(1, "Token name is required"),
    symbol: z.string().min(1, "Token symbol is required").max(3, "Token symbol must be at most 3 characters"),    
    decimals: z.coerce.number({ invalid_type_error: "Decimals must be a number",required_error:"Decimals is required" }).gte(1, "Decimals is required").lte(9, "Decimals must be at most 9 digits"),
    image: z.instanceof(File,{ message: "Please upload a valid image file" })
        .refine((file) => file.size <= 1*1024 * 1024, {
        message: "Image size should be less than 1MB",
    }).refine((file) => ['image/jpeg','image/jpg','image/png'].includes(file.type), {
        message: "Only JPEG and PNG files are allowed",
    }),
    initSupply: z.coerce.number({ invalid_type_error: "Initial supply must be a number",required_error:"Initial supply is required" }).gte(1, "Initial supply is required").lte(999999999999, "Initial supply must be at most 12 digits"),
    wallet: z.string().min(1, "Please connect a wallet"),
  });
  
export const CreateToken = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [symbol, setSymbol] = useState<string>("");
    const [decimals, setDecimals] = useState<number>(6);
    const [imageFile, setImageFile] = useState<File | null>(null); 
    const [image, setImage] = useState<string>(""); 
    const [initSupply, setInitSupply] = useState<number>(1);
    const [tokenState, setTokenState] = useRecoilState(tokenAddState);
    const validateForm = () => {
        const walletPublicKey = wallet.publicKey?.toBase58();
        const formData :FormData = {
            name,
            symbol,
            decimals,
            initSupply
        };
        if(walletPublicKey) {
            formData.wallet = walletPublicKey;
        }
        if (imageFile) {
            formData.image = imageFile;
        }
        console.log(formData);
        const result = addClientSchema.safeParse(formData);
        if (!result.success) {
          const errors = result.error.issues.map(issue => issue.message);
          toast.error(errors.join("\n"));
          return false;
        }
        return true;
    };
    const handleImageUpload = async () => {
        if (imageFile) {
          const formData = new FormData();
          formData.append('image', imageFile);
      
          try {
            const response = await fetch('/api/upload-image', {
              method: 'POST',
              body: formData,
            });
      
            if (response.ok) {
              toast.success("Image uploaded successfully");
            } else {
              toast.error("Image upload failed");
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            toast.error("An error occurred during upload");
          }
        } else {
          toast.error("No image file selected");
        }
      };
    return <Card title="Create Token">
        <div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                }}>
                <WalletMultiButton style={{
                    borderRadius: '5px',
                    backgroundColor: '#91629b',
                    color: '#fff',
                    }}>
                </WalletMultiButton>
            </div>
            <TextInput label="Name" placeholder="Name" value={name} onChange={(value) => {setName(value)}} />
            <TextInput label="Description" placeholder="Description" value={description} onChange={(value) => {setDescription(value)}} />
            <TextInput label="Symbol" placeholder="Symbol" value={symbol || ""} onChange={(value) => {setSymbol(value)}} />
            <TextInput label="Decimals" placeholder="Decimals" value={decimals} onChange={(value) => {setDecimals(Number(value))}} />
            <div className="pt-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 pt-2">Token Image</label>
                <div className="flex gap-4">
                    <input type="file" onChange={
                        (e) => {
                            const file = e.target.files ? e.target.files[0] : null;
                            setImageFile(file || null);
                        }
                    } id="txtImage" 
                        className="flex-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-3/5" 
                        placeholder="Token Image"/>
                    <button
                        onClick={async () => {
                            if(imageFile) {
                                console.log(imageFile);
                                const formData = new FormData();
                                formData.append('image', imageFile);
                                try {
                                    const response = await fetch('/api/upload-image', {
                                        method: 'POST',
                                        body: formData,
                                    });
                                    if (response.ok) {
                                        const data = await response.json();
                                        setImage(data.file);
                                        console.log(data.file);
                                        toast.success("Image uploaded successfully");
                                    } else {
                                        toast.error("Image upload failed");
                                    }
                                } catch (error) {
                                    console.error('Error uploading image:', error);
                                    toast.error("An error occurred during upload");
                                }
                            } else {
                                    toast.error("No image file selected");
                                }
                        }}
                        className="text-white btn-secondary px-4 py-2 rounded-md flex-auto p-2 w-1/5">
                        Upload&nbsp;Image
                    </button>
                </div>
            </div>
            <TextInput label="Initial Supply" placeholder="Initial Supply" value={initSupply.toString()} onChange={(value) => {setInitSupply(Number(value))}} />
            <div className="flex justify-center pt-4">               
                <button 
                    className="text-white btn-primary px-4 py-2 rounded-md flex-auto p-2 w-1/5"
                    onClick={async () => {
                    if (!validateForm()) return;
                    const metadataUri = await saveTokenMetadata(name, symbol, description, image || "");
                    console.log(metadataUri);
                    const token = await createToken(connection, wallet, name, symbol,description, metadataUri, initSupply, decimals);
                    //const sign = mintToken(connection, wallet,new PublicKey('ENYYVshzF1wR1N8sckVxpP4EFJoCNWYXVqjJdh23w6JV'),'5wBddGeBcyr2ejBxzJ2R4XBYfZPFbUPgRctP2xnhZ4MQ',2);
                    console.log(token);
                    const res = await saveToken(wallet.publicKey?.toString()||"", name, symbol, description, image, initSupply, token);
                    if(res) {
                        toast.success("Token created successfully");
                        setName("");
                        setSymbol("");
                        setDescription("");
                        setImageFile(null);
                        setInitSupply(1);
                        setTokenState(tokenState+1);
                    } else {
                        toast.error("Something went wrong");
                    }
                }}>Create Token</button>
            </div> 
        </div>
    </Card>
}