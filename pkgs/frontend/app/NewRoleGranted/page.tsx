"use client";

import React from 'react';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';  // useRouterをインポート
import NewRoleGrantedComponent from '../../components/NewRoleGranted';

export default function NewRoleGranted() {
    const router = useRouter();
    
    return (
        <div>
            <h1>New Role Granted Page</h1>
            <NewRoleGrantedComponent />
            <Button mt="4" colorScheme="teal" onClick={() => router.push('/')}>
                メインページに戻る
            </Button>
        </div>
    );
}
