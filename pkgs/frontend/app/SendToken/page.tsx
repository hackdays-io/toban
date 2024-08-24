"use client";

import React from 'react';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import SendTokenComponent from '../../components/SendToken';

export default function SendToken() {
    const router = useRouter();
    
    return (
        <div>
            <h1>Send Token Page</h1>
            <SendTokenComponent />
            <Button mt="4" colorScheme="teal" onClick={() => router.push('/')}>
                メインページに戻る
            </Button>
        </div>
    );
}
