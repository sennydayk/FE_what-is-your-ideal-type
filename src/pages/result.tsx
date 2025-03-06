import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import Picture from '../components/ui/picture';
import Kakaoshare from '../components/functional/kakao-share';
import NavigateToSurvey from '../components/functional/navigate-to-survey-props';
import { PreventDefaultWrapper } from '../components/functional/prevent-default-wrapper';
import { Button } from '../components/ui/button/button';
import { Text } from '../components/ui/text';
import { FlexBox } from '../components/ui/flexbox';
import { Main } from '../components/ui/main';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Header } from '../components/ui/header';
import { convertToWebP } from '../components/functional/convert-to-webp';
import { uploadImageToFirebase } from '../services/upload-image-to-firebase';
import { getCountAndTimeLeft, incrementCount } from '../services/count-service';
import { COOKIE_NAMES, setCookie } from '../components/utils/cookies';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getGuestMode } from '../components/utils/session-storage';

interface ProfileTypes {
  name: string;
  age: number;
  occupation: string;
  personality: string;
  hobbies: string;
  datecourse: string;
  lovestyle: string;
}

interface PostData {
  id: string;
  createdAt: Date;
  imageUrl: string;
  profile: string;
  hashTags: string[];
  prompts: string[];
  userId: string | null;
  email: string | null;
}

const Result = () => {
  const { postId } = useParams();
  const location = useLocation();
  const {
    tempImageUrl,
    profile: initialProfile,
    hashTags,
    prompts,
  } = location.state || {};
  const [imageUrl, setImageUrl] = useState(tempImageUrl);
  const [profile, setProfile] = useState<ProfileTypes | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isGuest = getGuestMode();
  const collection = isGuest ? 'anonymous_posts' : 'posts';

  const MotionLoader = motion.create(Loader2);

  const fetchPostData = useCallback(
    async (postId: string) => {
      if (!postId) return;

      try {
        const postRef = doc(db, collection, postId);
        const postDoc = await getDoc(postRef);

        if (postDoc.exists()) {
          const data = postDoc.data();
          setImageUrl(data.imageUrl);
          setProfile(
            typeof data.profile === 'string'
              ? JSON.parse(data.profile)
              : data.profile,
          );
        }
      } catch (error) {
        console.error('게시물 데이터 로딩 실패:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      }
    },
    [collection],
  );

  // 초기 데이터 가져오기
  useEffect(() => {
    if (!location.state && postId) {
      fetchPostData(postId);
    }
  }, [location.state, postId, fetchPostData]);

  // 백그라운드 작업
  useEffect(() => {
    const processBackgroundTasks = async () => {
      if (!postId || !tempImageUrl) return;
      setIsLoading(true);

      try {
        const actualPostId = postId;
        const collection = isGuest ? 'anonymous_posts' : 'posts';

        // 이미 저장된 데이터인지 확인
        const existingDoc = await getDoc(doc(db, collection, actualPostId));
        if (existingDoc.exists()) {
          setIsLoading(false);
          return;
        }

        // 새 데이터 저장 로직
        const webP = await convertToWebP(tempImageUrl);
        if (!webP) throw new Error('WebP 변환 실패');

        const uploadedImageUrl = await uploadImageToFirebase(webP);
        if (!uploadedImageUrl) throw new Error('이미지 업로드 실패');

        setImageUrl(uploadedImageUrl);

        const profileToSave =
          typeof profile === 'string' ? profile : JSON.stringify(profile);

        const postData: PostData = {
          id: actualPostId,
          createdAt: new Date(),
          imageUrl: uploadedImageUrl,
          profile: profileToSave,
          hashTags: hashTags || [],
          prompts: prompts || [],
          userId: currentUser?.uid || null,
          email: currentUser?.email || null,
        };

        await setDoc(doc(db, collection, actualPostId), postData);

        // 게스트 모드인 경우 쿠키에 postId 저장
        if (isGuest) {
          setCookie(COOKIE_NAMES.POST_ID, actualPostId);
        }

        // 로그인 사용자의 경우 추가 처리 - Firebase 문서 업데이트
        else if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnapShot = await getDoc(userRef);

          if (userSnapShot.exists()) {
            const userData = userSnapShot.data();
            const newPostList = [postId, ...(userData.postList || [])];
            await setDoc(
              doc(db, 'users', currentUser.uid),
              { postList: newPostList },
              { merge: true },
            );
          }
        }
        // 카운트 증가
        const { count, limit } = await getCountAndTimeLeft(currentUser);
        await incrementCount(currentUser, count, limit);
      } catch (error) {
        console.error('Background processing error:', error);
        setError('처리 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (location.state) {
      processBackgroundTasks();
    }
  }, [
    location.state,
    postId,
    currentUser,
    tempImageUrl,
    profile,
    hashTags,
    prompts,
    isGuest,
  ]);

  // 이미지 다운로드 및 WebP 변환
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob!);
          const a = document.createElement('a');
          a.href = url;
          a.download = `img_${postId}.webp`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 'image/webp');
      };
    } catch (error) {
      console.error('Error downloading the image: ', error);
      alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 뒤로가기 방지
  useEffect(() => {
    const blockBackButton = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackButton);

    return () => {
      window.removeEventListener('popstate', blockBackButton);
    };
  }, []);

  // 링크 공유
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다. 원하는 곳에 붙여넣기 해주세요.');
    } catch (error) {
      console.error('Failed to copy link : ', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  return (
    <>
      <Header></Header>
      <FlexBox
        direction='column'
        className='bg-sub justify-center h-32 mb-8 text-center'
      >
        <Text fontSize='xl' className='py-4'>
          AI 이상형 생성 결과...
        </Text>
        <Text>당신의 AI 이상형은 {profile?.occupation}입니다!</Text>
      </FlexBox>
      <Main isResponsive={true}>
        <PreventDefaultWrapper>
          <FlexBox direction='column'>
            <div className='w-96 h-96 flex flex-col justify-center items-center rounded-lg shadow-xl'>
              {isLoading ? (
                <div className='flex flex-col items-center'>
                  <MotionLoader
                    className='w-12 h-12 text-main'
                    animate={{
                      rotate: isLoading ? 360 : 0,
                    }}
                    transition={{
                      duration: 2,
                      ease: 'linear',
                      repeat: isLoading ? Number.POSITIVE_INFINITY : 0,
                    }}
                  />
                  <Text
                    fontSize='xs'
                    className='text-gray-500 mt-2 text-center'
                  >
                    이미지 최적화 처리 중...
                  </Text>
                </div>
              ) : (
                <Picture imageUrl={imageUrl} altText='이상형 이미지' />
              )}
            </div>
            {currentUser && (
              <Button
                bgColor='white'
                className='text-black p-3 text-sm mt-4 hover:bg-gray-100 transition-colors duration-200 shadow-md'
                onClick={handleDownload}
                disabled={isLoading}
              >
                ⤓ 내 이상형 사진 소장하기
              </Button>
            )}
          </FlexBox>
        </PreventDefaultWrapper>
        <FlexBox
          direction='column'
          className='w-full max-w-lg mt-8 md:mt-0 md:ml-8 bg-white rounded-xl shadow-lg p-6'
        >
          <div className='relative mb-4'>
            <Text fontSize='lg' className='text-main mb-2'>
              이상형 분석 리포트
            </Text>
            <div className='absolute top-0 right-0 bg-sub text-main px-3 py-1 rounded-full text-sm'>
              분석 완료
            </div>
          </div>

          <div className='bg-sub-hover rounded-lg p-4 mb-4'>
            <Text fontSize='lg'>
              {profile?.age} {profile?.name}, {profile?.occupation}
            </Text>
          </div>

          <div>
            <div className='bg-white border border-gray-100 rounded-lg p-2'>
              <div className='flex items-center mb-2'>
                <div className='w-8 h-8 bg-sub rounded-full flex items-center justify-center mr-3'>
                  <span className='text-main text-lg'>✧</span>
                </div>
                <Text>성격 </Text>
              </div>
              <Text fontSize='sm' className='text-gray-600 ml-11'>
                {profile?.personality}
              </Text>
            </div>

            <div className='bg-white border border-gray-100 rounded-lg p-2'>
              <div className='flex items-center mb-2'>
                <div className='w-8 h-8 bg-sub rounded-full flex items-center justify-center mr-3'>
                  <span className='text-main text-lg'>❀</span>
                </div>
                <Text>취미</Text>
              </div>
              <Text fontSize='sm' className='text-gray-600 ml-11'>
                {Array.isArray(profile?.hobbies)
                  ? profile?.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className='inline-block bg-sub rounded-full px-3 py-1 text-sm mr-2 mb-2'
                      >
                        {hobby}
                      </span>
                    ))
                  : profile?.hobbies}
              </Text>
            </div>

            <div className='bg-white border border-gray-100 rounded-lg p-2'>
              <div className='flex items-center mb-2'>
                <div className='w-8 h-8 bg-sub rounded-full flex items-center justify-center mr-3'>
                  <span className='text-main text-lg'>✿</span>
                </div>
                <Text>연애 스타일 💕</Text>
              </div>
              <Text fontSize='sm' className='text-gray-600 ml-11'>
                {profile?.lovestyle}
              </Text>
            </div>

            <div className='bg-white border border-gray-100 rounded-lg p-2'>
              <div className='flex items-center mb-2'>
                <div className='w-8 h-8 bg-sub rounded-full flex items-center justify-center mr-3'>
                  <span className='text-main text-lg'>♥</span>
                </div>
                <Text>추천 데이트 코스 👩‍❤️‍👨</Text>
              </div>
              <Text fontSize='sm' className='text-gray-600 ml-11'>
                {profile?.datecourse}
              </Text>
            </div>
          </div>

          <Text className='mt-4 mb-4 text-center text-main'>
            이상형의 취향을 저격할 수 있는 데이트코스를 계획해보세요!
          </Text>

          {currentUser ? (
            <FlexBox>
              <NavigateToSurvey label='새로운 이상형 다시 찾기' />
            </FlexBox>
          ) : (
            <FlexBox direction='column' className='space-y-4'>
              <Text fontSize='xs' className='text-center text-gray-600'>
                ▼ 사진을 저장하고 기록하고 싶다면 로그인 해보세요 ▼
              </Text>
              <Button
                bgColor='main'
                onClick={() => navigate('/')}
                className='w-full py-3 rounded-lg hover:opacity-90 transition-opacity duration-200'
              >
                로그인하고 더 많은 서비스 이용하기
              </Button>
              <NavigateToSurvey label='새로운 이상형 찾으러 가기' />
            </FlexBox>
          )}

          <FlexBox direction='column' className='mt-6'>
            {currentUser && (
              <>
                <Text fontSize='xs' className='mb-3 text-center text-gray-600'>
                  ▼ 결과를 친구에게 공유해 보세요! ▼
                </Text>
                <PreventDefaultWrapper className='justify-center space-x-4'>
                  <Button
                    className='text-main p-3 text-xs w-32 hover:bg-sub-hover'
                    bgColor='sub'
                    onClick={handleShare}
                  >
                    링크 복사하기
                  </Button>
                  <Kakaoshare resultUrl={window.location.href} />
                </PreventDefaultWrapper>
              </>
            )}
          </FlexBox>
        </FlexBox>
      </Main>
    </>
  );
};

export default Result;
