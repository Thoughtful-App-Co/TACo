# BLS API Quick Test Guide

## Testing the Fix

After starting your development server, you can test the BLS API integration using your browser's console:

### Test 1: Fetch Software Developer Wages (SOC 15-1252)

```javascript
// Test fetching occupation wages
const testBls = async () => {
  const response = await fetch('/api/labor-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: [
        'OEUN000000000000015125204', // Annual mean wage
        'OEUN000000000000015125213', // Annual median wage
        'OEUN000000000000015125203', // Hourly mean wage
        'OEUN000000000000015125201'  // Employment
      ],
      startyear: '2024',
      endyear: '2024'
    })
  });
  
  const data = await response.json();
  console.log('BLS API Response:', data);
  
  if (data.status === 'REQUEST_SUCCEEDED') {
    console.log('✅ SUCCESS! Data received:');
    data.results.series.forEach(s => {
      console.log(`  ${s.seriesID}: ${s.data[0]?.value || 'No data'}`);
    });
  } else {
    console.error('❌ FAILED:', data);
  }
};

testBls();
```

### Expected Output:

```
✅ SUCCESS! Data received:
  OEUN000000000000015125204: 144570   (Annual mean wage: $144,570)
  OEUN000000000000015125213: 133080   (Annual median wage: $133,080)
  OEUN000000000000015125203: 69.50    (Hourly mean wage: $69.50)
  OEUN000000000000015125201: 1654440  (Employment: 1,654,440)
```

### Test 2: Using the BLS Service Directly

```javascript
import { getOccupationWages } from './services/bls';

const testWages = async () => {
  const result = await getOccupationWages('15-1252'); // Software Developers
  
  if (result.success) {
    console.log('✅ Wage data received:');
    console.log('  Occupation:', result.data.occupationTitle);
    console.log('  Annual median:', `$${result.data.annual.median?.toLocaleString()}`);
    console.log('  Annual mean:', `$${result.data.annual.mean?.toLocaleString()}`);
    console.log('  Hourly mean:', `$${result.data.hourly.mean}`);
    console.log('  Period:', result.data.period);
  } else {
    console.error('❌ Failed:', result.error);
  }
};

testWages();
```

### Test 3: Test Different Occupations

```javascript
const occupations = [
  { code: '15-1252', title: 'Software Developers' },
  { code: '29-1141', title: 'Registered Nurses' },
  { code: '25-2021', title: 'Elementary School Teachers' },
  { code: '41-3031', title: 'Securities and Financial Services Sales Agents' }
];

for (const occ of occupations) {
  const result = await getOccupationWages(occ.code);
  if (result.success) {
    console.log(`${occ.title}: $${result.data.annual.median?.toLocaleString()}/year`);
  }
}
```

## Common Occupations for Testing

| SOC Code | Occupation | Expected Annual Median (2024) |
|----------|------------|-------------------------------|
| 15-1252 | Software Developers | ~$133,080 |
| 29-1141 | Registered Nurses | ~$86,070 |
| 25-2021 | Elementary School Teachers | ~$63,930 |
| 41-3031 | Securities Sales Agents | ~$74,680 |
| 11-1021 | General and Operations Managers | ~$101,280 |

## Troubleshooting

### Error: "NO_DATA_AVAILABLE"
- **Cause**: Invalid SOC code or series ID
- **Fix**: Verify the SOC code is valid (6 digits when hyphen removed)

### Error: "NETWORK_ERROR"
- **Cause**: Development server not running or API endpoint not accessible
- **Fix**: Ensure wrangler dev server is running on port 8787

### Error: "RATE_LIMITED"
- **Cause**: Exceeded 450 requests/day limit
- **Fix**: Wait until next day (resets at midnight UTC) or clear rate limit in dev

### Error: "BLS_API_KEY not configured"
- **Cause**: Missing `.dev.vars` file or BLS_API_KEY not set
- **Fix**: Create `.dev.vars` with `BLS_API_KEY=your-key-here`

## Verifying Series IDs

You can verify any generated series ID directly on the BLS website:

```
https://data.bls.gov/timeseries/OEUN000000000000015125204
```

Or test via their public API:

```bash
curl -X POST "https://api.bls.gov/publicAPI/v2/timeseries/data/" \
  -H "Content-Type: application/json" \
  -d '{"seriesid":["OEUN000000000000015125204"],"startyear":"2024","endyear":"2024"}'
```
