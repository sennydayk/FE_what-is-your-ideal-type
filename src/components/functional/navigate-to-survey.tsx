import { useNavigate } from 'react-router-dom';
import { getCountAndTimeLeft } from '../../services/count-service';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button/button';


interface NavigateToSurveyProps {
  label: string;
}

const NavigateToSurvey = ({ label }: NavigateToSurveyProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSurveyNavigation = async () => {
    const { count, limit, timeLeft } = await getCountAndTimeLeft(currentUser);

    if (count < limit) {
      navigate('/genderselect');
    } else if (!currentUser) {
      alert(
        '💫 오늘 무료 이미지 생성 횟수를 모두 사용하셨네요! 로그인하시면 더 많은 이상형 이미지를 만들고 저장할 수 있어요. 💫',
      );
    } else {
      alert(
        `💫 오늘 무료 이미지 생성 횟수를 모두 사용하셨네요! ${timeLeft.hours}시간 ${timeLeft.minutes}분 후에 이용해 주세요. 💫`,
      );
    }
  };

  return (
    <Button bgColor='main' className='w-full' onClick={handleSurveyNavigation}>
      {label}
    </Button>
  );
};

export default NavigateToSurvey;
