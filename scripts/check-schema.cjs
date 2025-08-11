const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

async function checkSchema() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?limit=1`, { headers })
  const locations = await response.json()
  
  if (locations && locations.length > 0) {
    console.log('Locations table columns:')
    Object.keys(locations[0]).forEach(key => {
      console.log(`- ${key}`)
    })
  }
}

checkSchema()