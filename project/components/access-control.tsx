'use client'

import { useAtom } from 'jotai'
import { twitterVerificationAtom } from '@/atoms'
import { TWITTER_HANDLE } from '@/constants'
import TwitterVerification from './twitter-verification'

interface AccessControlProps {
  children: React.ReactNode
}

export default function AccessControl({ children }: AccessControlProps) {
  const [isVerified, setIsVerified] = useAtom(twitterVerificationAtom)

  const handleVerificationSuccess = () => {
    setIsVerified(true)
  }

  if (!isVerified) {
    return (
      <TwitterVerification
        twitterHandle={TWITTER_HANDLE}
        onVerificationSuccess={handleVerificationSuccess}
      />
    )
  }

  return <>{children}</>
}