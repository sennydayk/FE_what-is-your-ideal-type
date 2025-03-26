import React from 'react';
import { Button } from './button/button';
import { Link, useNavigate } from 'react-router-dom';
import { Text } from './text';
import { useAuth } from '../../contexts/auth-context';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { FlexBox } from './flexbox';
import { setGuestMode } from '../utils/session-storage';

export const Header = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    const confirmation = window.confirm('로그아웃 하시겠습니까?');
    if (confirmation) {
      try {
        await signOut(auth);
        setGuestMode(true);
        navigate('/');
      } catch (error) {
        console.error('Logout failed', error);
      }
    }
  };

  return (
    <header className='w-full flex justify-between items-center py-5 px-12'>
      <Link to='/'>
        <Text fontSize='md' desktopFontSize='lg'>
          👩‍❤️‍👨 AI 이상형 찾기
        </Text>
      </Link>
      <FlexBox className='items-center'>
        {currentUser ? (
          <>
            <Button bgColor='white' label='로그아웃' onClick={handleLogout}>
              <Text fontSize='xs' desktopFontSize='sm' color='black'>
                로그아웃
              </Text>
            </Button>
            <Text className='mx-3' fontSize='xs' desktopFontSize='sm'>
              |
            </Text>
            <Link to='/mypage' className='flex items-center'>
              <Button bgColor='white' label='마이페이지'>
                <Text fontSize='xs' desktopFontSize='sm' color='black'>
                  마이페이지
                </Text>
              </Button>
            </Link>
          </>
        ) : (
          <Button bgColor='white' label='로그인' onClick={() => navigate('/')}>
            <Text fontSize='xs' desktopFontSize='sm' color='black'>
              로그인
            </Text>
          </Button>
        )}
      </FlexBox>
    </header>
  );
};
