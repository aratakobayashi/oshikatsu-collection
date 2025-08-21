# ≠ME AI Location Extraction Progress

## Project Status
- **Target**: ≠ME celebrity location data extraction from 252 YouTube episodes
- **Current Data**: 0 locations (cleaned up 13 low-quality entries)
- **Technology**: OpenAI GPT-3.5-turbo + YouTube Data API
- **Implementation**: Budget-optimized system for free tier usage

## Technical Implementation
- **System**: `budget-not-equal-me-processor.ts` 
- **Model**: GPT-3.5-turbo (95% cost reduction vs GPT-4)
- **Approach**: Staged processing (20 → 50 → 100 → 252 episodes)
- **Cost Estimate**: $0.15 total for all 252 episodes (~22 yen)

## Execution Plan
1. **Phase 1**: Test 20 latest episodes (~$0.01)
2. **Phase 2**: Expand to 50 episodes (~$0.03)  
3. **Phase 3**: Process 100 episodes (~$0.06)
4. **Phase 4**: Complete all 252 episodes (~$0.15)

## Commands Ready
```bash
# Small test (20 episodes)
npm run budget:not-equal-me 20

# Medium test (50 episodes)  
npm run budget:not-equal-me 50

# Full processing (252 episodes)
npm run budget:not-equal-me 252
```

## API Keys Required
- **OpenAI API**: Real key needed (currently test key)
- **YouTube API**: Already configured ✅

## Expected Results
- **Success Rate**: 30-40% episodes with locations
- **Quality**: High confidence 60%, Medium 30%, Low 10%
- **Data**: Restaurant/cafe locations with addresses
- **Integration**: Automatic grouping with existing UI

## Next Steps After API Key Setup
1. Run small test batch (20 episodes)
2. Evaluate extraction quality
3. Scale up processing gradually
4. Apply location grouping system
5. Verify frontend display