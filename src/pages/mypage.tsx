import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Navigate, useNavigate } from 'react-router-dom';
import NavigateToSurvey from '../components/functional/navigate-to-survey';
import { Text } from '../components/ui/text';
import { FlexBox } from '../components/ui/flexbox';
import { GridBox } from '../components/ui/gridbox';
import { Card } from '../components/ui/card/card';
import { Main } from '../components/ui/main';
import { Header } from '../components/ui/header';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CardContent } from '../components/ui/card/card-content';
import { CardDescription } from '../components/ui/card/card-description';
import { User } from 'firebase/auth';
import { fetchPostsData, fetchUserData } from '../api/queries';

const MyPage = () => {
  const { currentUser } = useAuth();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  // 인증 상태 변경 감지
  useEffect(() => {
    if (!currentUser) {
      alert('로그인이 필요한 서비스입니다. 홈으로 이동합니다.');
    }
  }, [currentUser]);

  // 쿼리 로직
  const {
    data: userData,
    isLoading: isUserDataLoading,
    error: userDataError,
  } = useQuery({
    queryKey: ['userData', currentUser?.uid, currentUser],
    queryFn: () => fetchUserData(currentUser as User),
    enabled: !!currentUser,
  });

  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', userData?.uid, userData?.postList, userData],
    queryFn: ({ pageParam }) => fetchPostsData(userData, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPage ?? null;
    },
    enabled: !!userData,
  });

  // Intersection Observer 설정
  useEffect(() => {
    const loadMore = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    };

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(loadMore, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    });

    const target = document.getElementById('infinityQueryTrigger');
    if (target) {
      observer.current.observe(target);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasNextPage, fetchNextPage]);

  const extractOccupation = (profileData: string) => {
    try {
      const profileObj = JSON.parse(profileData);
      return profileObj.occupation || '직업 정보 없음';
    } catch (error) {
      console.error('프로필 파싱 중 오류 발생:', error);
      return '직업 정보 없음';
    }
  };

  // 조건부 렌더링
  if (!currentUser) {
    return <Navigate to='/' replace />;
  }

  if (isUserDataLoading || isPostsLoading) {
    return null;
  }

  if (userDataError || postsError) {
    return <div>데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  const posts = postsData?.pages.flatMap((page) => page?.posts) || [];

  return (
    <>
      <Header />
      <FlexBox direction='column' className='bg-sub justify-center h-32 mb-8'>
        <Text fontSize='xl' className='py-4 text-center'>
          {userData?.nickname}님의 마이페이지
        </Text>
      </FlexBox>
      <Main>
        <FlexBox direction='column'>
          <Text fontSize='xl' className='text-center mb-8'>
            나의 이상형 리스트
          </Text>
          {posts.length > 0 ? (
            <GridBox>
              {posts.map((post, index) => (
                <Card
                  key={index}
                  onClick={() => navigate(`/result/${post.id}`)}
                >
                  <CardContent
                    imageUrl={post.imageUrl}
                    altText={post.fileName}
                    isImageLoaded={isImageLoaded}
                    onLoad={() => setIsImageLoaded(true)}
                  />
                  <CardDescription title={extractOccupation(post.profile)} />
                </Card>
              ))}
            </GridBox>
          ) : (
            <Text className='text-center mb-8'>
              현재 이상형 리스트가 없습니다.
            </Text>
          )}
          <NavigateToSurvey label='새로운 이상형 찾기' />
          {hasNextPage && <div id='infinityQueryTrigger' className='h-5'></div>}
        </FlexBox>
      </Main>
    </>
  );
};

export default MyPage;
