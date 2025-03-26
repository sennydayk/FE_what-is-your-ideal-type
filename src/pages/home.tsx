import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button/button';
import { Main } from '../components/ui/main';
import Input from '../components/ui/input';
import { useAuth } from '../contexts/auth-context';
import { ButtonGroup } from '../components/ui/button/button-group';
import { FlexBox } from '../components/ui/flexbox';
import { Text } from '../components/ui/text';
import { FirebaseError } from 'firebase/app';
import FindPasswordModal from '../components/functional/find-password-modal';
import NavigateToSurvey from '../components/functional/navigate-to-survey';
import { loginWithGoogle } from '../services/auth/login-with-google';
import { loginWithEmail } from '../services/auth/login-with-email';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '../components/ui/error-message';
import { setGuestMode } from '../components/utils/session-storage';

const loginSchema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Home = () => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { setCurrentUser } = useAuth();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const userCredential = await loginWithEmail(data.email, data.password);
      if (userCredential) {
        setCurrentUser(userCredential.user);
        setGuestMode(false);
        alert('로그인에 성공했습니다.');
        navigate('/mypage');
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
          return alert('이메일 또는 비밀번호를 확인해주세요');
          break;
        default:
          return alert('입력 정보를 확인해주세요');
          break;
      }
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      const credential = await loginWithGoogle();
      if (credential) {
        setCurrentUser(credential.user);
        setGuestMode(false);
        alert('로그인에 성공했습니다.');
        navigate('/mypage');
      }
    } catch (error) {
      console.error('Error handleLoginWithGoogle: ', error);
    }
  };

  return (
    <Main isResponsive={true}>
      <FlexBox direction='column' gap='md'>
        <FlexBox direction='column' gap='xs' className='items-start w-full'>
          <Text fontSize='lg'>안녕하세요!</Text>
          <Text fontSize='md'>나만의 이상형을 찾아 볼까요?</Text>
        </FlexBox>
        <FlexBox direction='column' gap='sm'>
          <Input
            name='email'
            type='email'
            placeholder='이메일을 입력해주세요'
            register={register}
          />
          <Input
            type='password'
            name='password'
            placeholder='비밀번호를 입력해주세요'
            register={register}
          />
        </FlexBox>
        {errors.email ? (
          <ErrorMessage message={errors.email?.message} />
        ) : (
          <ErrorMessage message={errors.password?.message} />
        )}
        <Button
          bgColor='transparent'
          className='p-0'
          onClick={() => {
            setModalOpen(true);
          }}
        >
          비밀번호 찾기
        </Button>
        <Button
          bgColor='main'
          label='로그인하기'
          className='w-full'
          onClick={handleSubmit(onSubmit)}
        >
          로그인하기
        </Button>
        <NavigateToSurvey label='로그인 없이 시작' />
      </FlexBox>
      <FlexBox direction='column' gap='lg'>
        <div>
          <Text fontSize='md' className='mb-3 text-center'>
            SNS 계정으로 간편하게 시작하기
          </Text>
          <ButtonGroup>
            <Button
              label='구글 로그인'
              bgColor='white'
              onClick={handleLoginWithGoogle}
            >
              <img src='/images/google.png' alt='구글 로그인' />
            </Button>
            <Button
              label='카카오 로그인'
              bgColor='white'
              onClick={() =>
                alert(
                  '카카오 로그인 서비스는 현재 준비 중입니다. 곧 제공될 예정이니 조금만 기다려 주세요!',
                )
              }
            >
              <img src='/images/kakao.png' alt='카카오 로그인' />
            </Button>
            <Button
              label='네이버 로그인'
              bgColor='white'
              onClick={() =>
                alert(
                  '네이버 로그인 서비스는 현재 준비 중입니다. 곧 제공될 예정이니 조금만 기다려 주세요!',
                )
              }
            >
              <img src='/images/naver.png' alt='네이버 로그인' />
            </Button>
          </ButtonGroup>
        </div>
        <FlexBox gap='sm'>
          <Text fontSize='md'>이상형 찾기가 처음이라면?</Text>
          <Button
            label='회원가입'
            bgColor='underline'
            className='p-0'
            onClick={() => navigate('signup')}
          >
            가입하기
          </Button>
        </FlexBox>
      </FlexBox>
      <FindPasswordModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Main>
  );
};

export default Home;
