/**
 * Validates that all interests in INTEREST_GROUPS exist in BILINGUAL_INTERESTS
 * Run with: node scripts/validate-interests.mjs
 */

import { BILINGUAL_INTERESTS } from '../src/lib/interestsBilingual.ts'
import { INTEREST_GROUPS } from '../src/lib/interestGroups.ts'

console.log('🔍 Validating interests...\n')

const allCanonicalInterests = BILINGUAL_INTERESTS.map(i => i.canonical)
const groupedInterests = INTEREST_GROUPS.flatMap(g => g.interests)

// Check for interests in groups that don't exist in bilingual file
const missingInBilingual = groupedInterests.filter(
  interest => !allCanonicalInterests.includes(interest)
)

// Check for interests in bilingual file that aren't in any group
const notInAnyGroup = allCanonicalInterests.filter(
  interest => !groupedInterests.includes(interest)
)

// Check for duplicates in groups
const duplicatesInGroups = groupedInterests.filter(
  (interest, index) => groupedInterests.indexOf(interest) !== index
)

let hasErrors = false

if (missingInBilingual.length > 0) {
  console.error('❌ Interests in groups but missing from BILINGUAL_INTERESTS:')
  missingInBilingual.forEach(interest => console.error(`   - ${interest}`))
  console.error('')
  hasErrors = true
}

if (notInAnyGroup.length > 0) {
  console.warn('⚠️  Interests in BILINGUAL_INTERESTS but not in any group:')
  notInAnyGroup.forEach(interest => console.warn(`   - ${interest}`))
  console.warn('')
  hasErrors = true
}

if (duplicatesInGroups.length > 0) {
  console.error('❌ Duplicate interests in groups:')
  const uniqueDuplicates = [...new Set(duplicatesInGroups)]
  uniqueDuplicates.forEach(interest => console.error(`   - ${interest}`))
  console.error('')
  hasErrors = true
}

if (!hasErrors) {
  console.log('✅ All interests are valid!')
  console.log(`   Total interests: ${allCanonicalInterests.length}`)
  console.log(`   Total groups: ${INTEREST_GROUPS.length}`)
} else {
  console.error('\n❌ Validation failed! Please fix the errors above.')
  process.exit(1)
}
