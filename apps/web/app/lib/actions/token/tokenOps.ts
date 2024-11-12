"use client";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { ExtensionType, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE, createAssociatedTokenAccountInstruction, createInitializeMetadataPointerInstruction, createInitializeMint2Instruction, createInitializeMintInstruction, createMint, createMintToInstruction, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, getMinimumBalanceForRentExemptMint, getMintLen } from "@solana/spl-token"
import { createInitializeInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata';

export async function createToken(connection: Connection, wallet: WalletContextState,name: string, symbol: string, description: string, metadataUri: string, initSupply: number, decimals: number): Promise<string> {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }
    
    const mintKeypair = Keypair.generate();
    const metadata :TokenMetadata= {
        updateAuthority: wallet.publicKey,
        mint: mintKeypair.publicKey,
        name: name,
        symbol: symbol,
        uri: metadataUri,
        additionalMetadata: [["description", description]],
    };
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
    })
    const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID)
    const initializeMintInstruction = createInitializeMintInstruction(mintKeypair.publicKey, decimals, wallet.publicKey, wallet.publicKey, TOKEN_2022_PROGRAM_ID)
    const initializeMetadataInstruction = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
    })
    const transaction = new Transaction().add(
        createAccountInstruction,
        initializeMetadataPointerInstruction,
        // note: the above instructions are required before initializing the mint
        initializeMintInstruction,
        initializeMetadataInstruction
    );
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.partialSign(mintKeypair);
    try {
        const transactionSignature = await wallet.sendTransaction(transaction, connection);
        console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()} with signature ${transactionSignature}`);
    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
    }
    return mintKeypair.publicKey.toBase58() || ''
}

export async function mintToken(connection: Connection, wallet: WalletContextState, mintPublicKey: PublicKey, receiverWallet:string, amount: number): Promise<string> {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }
    const receiverWalletPublicKey = new PublicKey(receiverWallet);

    const associatedToken = getAssociatedTokenAddressSync(
        mintPublicKey,
        receiverWalletPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
    );
    //getOrCreateAssociatedTokenAccount(connection, wallet, associatedToken, mintPublicKey, TOKEN_2022_PROGRAM_ID);
    console.log(`Associated Token Account: ${associatedToken.toBase58()}`);
    const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedToken,
            receiverWalletPublicKey,
            mintPublicKey,
            TOKEN_2022_PROGRAM_ID,
        ),
    );

    try {
        await wallet.sendTransaction(transaction2, connection);
        console.log(`Associated Token Account created at ${associatedToken.toBase58()} with signature ${transaction2.signature}`);
    } catch (error) {
        console.error("Error sending transaction2:", error);
        throw error;
    }
    const transaction3 = new Transaction().add(
        createMintToInstruction(mintPublicKey, receiverWalletPublicKey, wallet.publicKey, amount)
    );
    
    try {
        await wallet.sendTransaction(transaction3, connection);
        console.log(`Minted in Associated Token Account ${associatedToken.toBase58()} with signature ${transaction3.signature}`);
    } catch (error) {
        console.error("Error sending transaction3:", error);
        throw error;
    }

    return mintPublicKey.toBase58();
}