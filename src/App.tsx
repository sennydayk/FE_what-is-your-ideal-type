import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Home, Survey, Result, GenderSelect } from './pages';
import { AuthProvider, useAuth } from './contexts/auth-context';
import ErrorBoundary from './components/functional/error-boudary';
import { LandingRoute } from './components/functional/landing-route';
import { CookiesProvider } from 'react-cookie';
import BrowserRedirect from './components/functional/browser-redirect';

const Generate = lazy(() => import('./pages/generate'));
const MyPage = lazy(() => import('./pages/mypage'));
const SignUp = lazy(() => import('./pages/signup'));

const queryClient = new QueryClient();

const routes = [
  {
    path: '/',
    element: (
      <LandingRoute>
        <Home />
      </LandingRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <LandingRoute>
        <Home />
      </LandingRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <LandingRoute>
        <SignUp />
      </LandingRoute>
    ),
    suspense: true,
  },
  { path: '/survey', element: <Survey /> },
  { path: '/genderselect', element: <GenderSelect /> },
  { path: '/generate', element: <Generate />, suspense: true },
  { path: '/result/:postId', element: <Result /> },
  { path: '/mypage', element: <MyPage />, suspense: true },
  {
    path: '*',
    element: <>wrong path</>,
  },
];

const App = () => {
  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary fallback={<div>에러가 발생했습니다.</div>}>
            <Router>
              <BrowserRedirect />
              <Routes>
                {routes.map(({ path, element, suspense }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      suspense ? (
                        <Suspense fallback={<div>Loading...</div>}>
                          {element}
                        </Suspense>
                      ) : (
                        element
                      )
                    }
                  />
                ))}
              </Routes>
            </Router>
          </ErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
};
export default App;
