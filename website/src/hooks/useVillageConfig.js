import { useMemo } from 'react'
import { createDefaultVillageConfig, getSectionSummary } from '../config/configModel'

export function useVillageConfig(username) {
  const config = useMemo(() => createDefaultVillageConfig(username), [username])

  const getSummaryForSection = (sectionId) => getSectionSummary(config, sectionId)

  return {
    config,
    getSummaryForSection,
  }
}
