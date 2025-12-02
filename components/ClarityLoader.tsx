'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

const CLARITY_PROJECT_ID = 'ufadn9m6jo'

export function ClarityLoader() {
  useEffect(() => {
    // Initialize Microsoft Clarity
    Clarity.init(CLARITY_PROJECT_ID)
  }, [])

  return null
}

