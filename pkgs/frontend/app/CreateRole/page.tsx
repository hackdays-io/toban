"use client";

import React from 'react';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';  // useRouterをインポート
import CreateRoleComponent from '../../components/CreateRole';

export default function CreateRole() {
    const router = useRouter();
    
    return (
        <div>
            <h1>Create Role Page</h1>
            <CreateRoleComponent />
            <Button mt="4" colorScheme="teal" onClick={() => router.push('/')}>
                メインページに戻る
            </Button>
        </div>
    );
}
