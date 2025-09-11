---
name: provider-comparison-links-on-individual-provider-pages
description: Add contextual comparison links to individual provider pages to facilitate cross-provider analysis and decision-making
status: backlog
created: 2025-08-25T21:21:57Z
---

# PRD: Provider Comparison Links on Individual Provider Pages

## Executive Summary

This feature enhances individual provider pages by adding strategic comparison links that guide users to relevant cross-provider comparisons. Users viewing a specific provider (e.g., AWS) will see curated links to compare that provider against similar or competing providers, reducing friction in the comparison discovery process and improving user engagement with the platform's core comparison functionality.

## Problem Statement

**Current Problem:**
- Users on individual provider pages have no clear path to comparison functionality
- Users may not know which other providers offer the same GPUs for comparison
- There's a disconnect between provider detail consumption and comparison action
- Manual navigation to comparison pages creates friction

**Why This Matters Now:**
- Individual provider pages receive significant traffic but may have poor conversion to comparison usage
- Users researching specific providers likely want to validate their choice against alternatives with identical GPUs
- Simple provider suggestions based on shared GPU inventory can significantly improve user experience
- Leverages existing comparison functionality without complex new features

## User Stories

### Primary Persona: ML Engineer Evaluating Providers

**User Story 1: Quick Alternative Discovery**
- **As an** ML engineer researching Lambda Labs for GPU training
- **I want to** see which other providers offer the same GPUs Lambda Labs has
- **So that I can** quickly compare pricing for identical hardware
- **Acceptance Criteria:**
  - Provider page shows 2-3 providers that offer the same GPUs
  - Links lead directly to comparison pages with providers pre-selected
  - Suggestions are based on shared GPU inventory (same GPU models available)

**User Story 2: Simple Provider-to-Provider Comparison**
- **As a** cost-conscious developer on the RunPod page
- **I want to** see direct links to compare RunPod against specific providers
- **So that I can** quickly check if I'm getting the best price for the same GPUs
- **Acceptance Criteria:**
  - Simple "Compare with [Provider]" buttons for providers offering shared GPUs
  - One-click access to head-to-head comparison
  - Clear indication that they offer the same hardware

## Requirements

### Functional Requirements

**FR1: Shared GPU Detection**
- Identify providers that offer the same GPU models as the current provider
- Use existing database relationships between providers and GPU models
- No new database schema required - leverage existing prices table

**FR2: Simple Link Generation**
- Generate 2-3 comparison links for providers with most shared GPUs
- Display provider logo, name, and simple description
- Links point to existing `/compare/[provider1]/[provider2]` functionality

**FR3: Bottom Section Placement**  
- Add "Compare Providers" section at bottom of provider pages (before footer)
- Clean, card-based layout showing alternative providers
- Responsive design for mobile and desktop
- Uses existing DaisyUI components and styling

**FR4: Zero Database Changes**
- Leverages existing `prices` table to find shared GPU models between providers
- Uses existing `providers` table for provider information
- No new tables, columns, or stored procedures needed

### Non-Functional Requirements

**NFR1: Performance**
- Suggestion generation adds <50ms to provider page load time
- Use simple database query to find shared GPU models
- Server-side rendering for fast page loads

**NFR2: User Experience**
- Clean integration with existing provider page design
- Uses existing DaisyUI components and styling patterns
- Non-intrusive placement that doesn't overwhelm main content

**NFR3: Maintainability**
- Simple logic that's easy to understand and modify
- Reuses existing comparison page functionality
- Minimal code changes to existing provider page structure

## Success Criteria

### Primary Metrics
- **Comparison Usage:** 10% increase in traffic to `/compare/*` pages from provider pages
- **User Engagement:** 5% increase in session duration on provider pages
- **Link Interaction:** 10-15% of provider page visitors interact with comparison suggestions

### Key Performance Indicators
- **Click-Through Rate:** Target 10-15% CTR on comparison provider cards
- **User Flow Completion:** Track users who complete the comparison after clicking
- **Feature Adoption:** Monitor usage patterns and most popular provider combinations

## Constraints & Assumptions

### Technical Constraints
- Must work within existing Next.js App Router architecture
- Integration with current provider page structure (`/providers/[slug]/page.js`)
- Compatibility with existing comparison system routing (`/compare/[...providers]`)
- Zero database schema changes required

### Business Constraints
- Implementation within current development sprint cycle
- No additional external API dependencies or services
- Must support all current providers in the database
- Should automatically support new providers as they're added

### Assumptions
- Users want to compare providers offering the same GPUs
- Current comparison page functionality is sufficient for user needs
- Shared GPU inventory is the primary factor for suggesting comparisons
- Simple visual cards are more effective than complex categorization

## Out of Scope

### Explicitly NOT Building
- **New comparison functionality** - Using existing `/compare/[...providers]` system
- **Complex recommendation algorithms** - Simple shared GPU matching only
- **User preference tracking** - No personalized suggestions
- **Provider tier categorization** - No enterprise/budget/specialty groupings
- **Provider ratings or reviews** - Maintaining neutral comparison platform
- **Advanced analytics dashboard** - Basic metrics tracking only

### Future Considerations
- A/B testing different card layouts and placements
- User behavior analytics on comparison effectiveness
- Provider preference tracking based on user interactions
- Integration with user accounts for comparison history

## Dependencies

### External Dependencies
- **None** - Feature uses existing platform infrastructure

### Internal Team Dependencies
- **Frontend Development:** Implementation of shared GPU detection and card placement
- **QA Testing:** Verify comparison links work correctly across all provider pages

### Technical Dependencies
- **Existing comparison system** - `/compare/[...providers]` functionality must remain stable
- **Database consistency** - Accurate provider and GPU price data
- **Static generation** - Provider pages must support additional data fetching for suggestions

## Implementation Considerations

### Shared GPU Detection Strategy
```javascript
// Example shared GPU detection logic
const getProviderSuggestions = async (currentProviderId) => {
  // Find GPU models that current provider offers
  const currentProviderGPUs = await fetchGPUPrices({ selectedProvider: currentProviderId })
  const currentGPUIds = [...new Set(currentProviderGPUs.map(p => p.gpu_model_id))]
  
  // Find other providers offering the same GPUs
  const allPrices = await fetchGPUPrices()
  const providerSharedGPUs = new Map()
  
  allPrices.forEach(price => {
    if (price.provider_id !== currentProviderId && currentGPUIds.includes(price.gpu_model_id)) {
      if (!providerSharedGPUs.has(price.provider_id)) {
        providerSharedGPUs.set(price.provider_id, { provider: price, sharedGPUs: 0 })
      }
      providerSharedGPUs.get(price.provider_id).sharedGPUs++
    }
  })
  
  // Return top 3 providers with most shared GPUs
  return Array.from(providerSharedGPUs.values())
    .sort((a, b) => b.sharedGPUs - a.sharedGPUs)
    .slice(0, 3)
}
```

### Card Layout Strategy
**Bottom Section Implementation:**
- "Compare Providers" section above site footer
- Card-based layout with provider logo, name, and description
- Simple "Compare with [Provider]" buttons
- Shows number of shared GPUs for transparency

### URL Structure
- **Direct Comparison:** `/compare/aws/lambda-labs`
- **Maintains existing comparison page functionality**