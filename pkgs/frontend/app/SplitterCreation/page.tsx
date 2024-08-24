"use client";

import React from 'react';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';  // useRouterをインポート
import SplitterCreationComponent from '../../components/SplitterCreation';

export default function SplitterCreation() {
    const router = useRouter();
    
    return (
        <div>
            <h1>Splitter Creation Page</h1>
            <SplitterCreationComponent />
            <Button mt="4" colorScheme="teal" onClick={() => router.push('/')}>
                メインページに戻る
            </Button>
        </div>
    );
}
