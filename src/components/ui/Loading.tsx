import React, { useState, useEffect } from "react";
import { LinearProgress, Box } from "@mui/material";
import { Main } from "./Main";
import { Text } from "./Text";
import { FlexBox } from "./FlexBox";

interface LoadingProps {
  progressState: number;
}

export const Loading = ({ progressState }: LoadingProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 100 : prevProgress + 10,
      );
    }, 1500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Main>
      <FlexBox direction="column" gap="45px">
        <img src="/images/spin.gif" alt="loading" className="w-20 h-20" />
        <Text fontSize="lg" fontWeight="bold">
          이상형을 찾고 있어요!
        </Text>
        <Text fontSize="md" fontWeight="bold">
          잠시만 기다려주세요.
        </Text>
        <FlexBox direction="column" gap="10px" style={{ width: "100%" }}>
          <Box sx={{ width: "100%", mt: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progressState}
              sx={{
                height: 20,
                borderRadius: 8,
                backgroundColor: "#D1D5DB",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: "#706EF4",
                },
              }}
            />
          </Box>
        </FlexBox>
      </FlexBox>
    </Main>
  );
};

export default Loading;
