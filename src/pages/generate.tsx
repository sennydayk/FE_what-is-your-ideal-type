import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { profileGenerate } from '../services/profile-generate';
import { useAuth } from '../contexts/auth-context';
import { imageGenerate } from '../services/image-generate';
import LoadingScreen from '../components/ui/loading-screen';

const Generate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const { prompts, hashTags } = location.state;
    const newPostId = uuidv4();

    const blockBackButton = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackButton);

    const processAndNavigate = async () => {
      try {
        // 이미지 생성과 프로필 생성을 병렬로 처리
        const [imageData, profileData] = await Promise.all([
          imageGenerate(prompts),
          profileGenerate(prompts),
        ]);

        if (!imageData?.url || !profileData) {
          throw new Error('이미지 또는 프로필 생성 실패');
        }

        // profileData를 JSON으로 파싱
        const parsedProfile =
          typeof profileData === 'string'
            ? JSON.parse(profileData)
            : profileData;

        setIsLoading(false);

        // 생성된 결과와 함께 result 페이지로 이동
        navigate(`/result/${newPostId}`, {
          replace: true,
          state: {
            tempImageUrl: imageData.url,
            profile: parsedProfile,
            hashTags,
            prompts,
            revisedPrompt: imageData.usedPrompt,
            postId: newPostId,
            isLoggedIn: !!currentUser,
          },
        });
      } catch (error) {
        console.error(error);
      }
    };

    processAndNavigate();

    return () => {
      window.removeEventListener('popstate', blockBackButton);
    };
  }, [location, navigate, currentUser]);

  return (
    <div className='w-full min-h-screen'>
      {isLoading && <LoadingScreen isLoading={isLoading} />}
    </div>
  );
};
export default Generate;
