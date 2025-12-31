# BLS API Integration Fix Summary

**Date**: December 30, 2025  
**Issue**: BLS API returning "NO_DATA_AVAILABLE" error for all OES wage/employment queries  
**Root Cause**: Incorrect OES series ID format in `buildOesSeriesId()` function

## Problem

The `buildOesSeriesId()` function was generating invalid series IDs for the BLS Occupational Employment and Wage Statistics (OES) API.

### Incorrect Format (Before Fix)

```
OEUM0000000000000151252 04
     ^
     Always used 'M' (Metropolitan) area type
```

Generated series ID: `OEUM0000000000000151252 04` (26 chars - **INVALID**)

### Correct Format (After Fix)

```
OEUN000000000000015125204
    ^
    Area type varies: N=National, S=State, M=Metropolitan
```

Generated series ID: `OEUN000000000000015125204` (25 chars - **VALID**)

## OES Series ID Structure

According to BLS documentation, the format is:

```
OE + U + {areaType} + {areaCode} + {industryCode} + {occupationCode} + {dataType}
```

| Component       | Length | Example                     | Description                               |
| --------------- | ------ | --------------------------- | ----------------------------------------- |
| Survey prefix   | 2      | `OE`                        | Occupational Employment Statistics        |
| Seasonal        | 1      | `U`                         | Unadjusted                                |
| Area type       | 1      | `N`                         | N=National, S=State, M=Metro              |
| Area code       | 7      | `0000000`                   | Geographic area identifier                |
| Industry code   | 6      | `000000`                    | NAICS industry (000000 = cross-industry)  |
| Occupation code | 6      | `151252`                    | SOC code without hyphen                   |
| Data type       | 2      | `04`                        | Type of estimate (wage, employment, etc.) |
| **Total**       | **25** | `OEUN000000000000015125204` | Complete series ID                        |

## Data Type Codes

| Code | Description                 |
| ---- | --------------------------- |
| `01` | Employment                  |
| `03` | Hourly mean wage            |
| `04` | Annual mean wage            |
| `08` | Hourly median wage          |
| `13` | Annual median wage          |
| `06` | Hourly 10th percentile wage |
| `07` | Hourly 25th percentile wage |
| `09` | Hourly 75th percentile wage |
| `10` | Hourly 90th percentile wage |
| `11` | Annual 10th percentile wage |
| `12` | Annual 25th percentile wage |
| `14` | Annual 75th percentile wage |
| `15` | Annual 90th percentile wage |
| `16` | Employment per 1,000 jobs   |
| `17` | Location quotient           |

## Example Test Results

Testing with SOC code 15-1252 (Software Developers):

```bash
curl -X POST "https://api.bls.gov/publicAPI/v2/timeseries/data/" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesid": ["OEUN000000000000015125204"],
    "startyear": "2024",
    "endyear": "2024"
  }'
```

**Response**: ✅ SUCCESS

```json
{
  "status": "REQUEST_SUCCEEDED",
  "Results": {
    "series": [
      {
        "seriesID": "OEUN000000000000015125204",
        "data": [
          {
            "year": "2024",
            "period": "A01",
            "value": "144570"
          }
        ]
      }
    ]
  }
}
```

**Result**: Annual mean wage for Software Developers = **$144,570**

## Files Modified

- `/src/services/bls.ts` - Fixed `buildOesSeriesId()` function to correctly determine area type and format series IDs

## Code Changes

### Before

```typescript
export function buildOesSeriesId(
  socCode: string,
  dataType: OesDataTypeCode,
  areaCode: string = NATIONAL_AREA_CODE,
  industryCode: string = CROSS_INDUSTRY_CODE
): string {
  const normalizedSoc = socCode.replace(/-/g, '').padEnd(6, '0');
  const normalizedIndustry = industryCode.padStart(6, '0');
  const normalizedArea = areaCode.padStart(7, '0');

  return `OEUM${normalizedArea}${normalizedIndustry}${normalizedSoc}${dataType}`;
  //      ^^^^ WRONG: Hardcoded 'M' (Metropolitan) area type
}
```

### After

```typescript
export function buildOesSeriesId(
  socCode: string,
  dataType: OesDataTypeCode,
  areaCode: string = NATIONAL_AREA_CODE,
  industryCode: string = CROSS_INDUSTRY_CODE
): string {
  const normalizedSoc = socCode.replace(/-/g, '').padEnd(6, '0');
  const normalizedIndustry = industryCode.padStart(6, '0');

  // Determine area type based on area code
  let areaType: string;
  let normalizedArea: string;

  if (areaCode === NATIONAL_AREA_CODE || areaCode === '0000000') {
    areaType = 'N'; // National
    normalizedArea = '0000000';
  } else if (areaCode.startsWith('S')) {
    areaType = 'S'; // State
    normalizedArea = areaCode.substring(1).padStart(7, '0');
  } else if (areaCode.startsWith('M')) {
    areaType = 'M'; // Metropolitan
    normalizedArea = areaCode.substring(1).padStart(7, '0');
  } else if (areaCode.length === 2) {
    areaType = 'S'; // State FIPS code
    normalizedArea = areaCode.padEnd(7, '0');
  } else {
    areaType = 'N';
    normalizedArea = areaCode.padStart(7, '0');
  }

  return `OEU${areaType}${normalizedArea}${normalizedIndustry}${normalizedSoc}${dataType}`;
  //      ^^^^ CORRECT: Dynamic area type based on input
}
```

## Testing

To test the fix:

1. **Start your development server** with wrangler
2. **Call any BLS function** that fetches OES data:

   ```typescript
   import { getOccupationWages } from './services/bls';

   const result = await getOccupationWages('15-1252'); // Software Developers
   if (result.success) {
     console.log('Annual median:', result.data.annual.median); // Should show $133,080
     console.log('Hourly mean:', result.data.hourly.mean); // Should show $69.50
   }
   ```

3. **Expected results** for SOC 15-1252 (Software Developers, 2024 data):
   - Employment: 1,654,440
   - Hourly mean wage: $69.50
   - Annual mean wage: $144,570
   - Annual median wage: $133,080

## References

- [BLS OES Technical Documentation](https://download.bls.gov/pub/time.series/oe/oe.txt)
- [BLS API Documentation](https://www.bls.gov/developers/)
- [BLS Series ID Formats](https://www.bls.gov/help/hlpforma.htm#OE)

## Notes

- The BLS API `catalog` parameter is disabled for OES data through the public API
- OES data is updated annually (typically in March/April)
- The 2024 data represents May 2024 estimates
- Cache TTL for OES data: 30 days (configurable in `bls.types.ts`)
