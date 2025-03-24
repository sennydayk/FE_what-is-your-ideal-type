import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { fetchUserData } from '../api/queries';

export function useNickname() {
  const { currentUser } = useAuth();
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getNickname = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const userData = await fetchUserData(currentUser);
        setNickname(userData.nickname || '');
      } catch (error) {
        console.error('닉네임 가져오기 실패:', error);
        setError(
          error instanceof Error ? error : new Error('닉네임 가져오기 실패'),
        );
      } finally {
        setLoading(false);
      }
    };

    getNickname();
  }, [currentUser]);

  return { nickname, loading, error };
}
