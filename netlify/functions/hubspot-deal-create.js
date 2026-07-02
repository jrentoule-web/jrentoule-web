// Auto-create a Deal in HubSpot after a website form submission.
// Called by the HubSpot form's onFormSubmit callback (client-side).
// The HubSpot form itself already creates/updates the Contact via HubSpot's SDK,
// so this function's job is:
//   1. Look up the just-created Contact by email
//   2. Create a Deal in the Sales Pipeline, first stage ("Enquiry")
//   3. Associate the Deal to the Contact
//
// Env vars required (set in Netlify UI):
//   HUBSPOT_TOKEN - HubSpot Service Key with scopes:
//     crm.objects.contacts.read, crm.objects.contacts.write,
//     crm.objects.deals.read, crm.objects.deals.write,
//     crm.schemas.deals.read

const HUBSPOT_API = 'https://api.hubapi.com';
const PIPELINE_ID = 'default';        // Sales Pipeline
const FIRST_STAGE_ID = '95416882';    // "Enquiry" stage
const CONTACT_LOOKUP_MAX_ATTEMPTS = 5;
const CONTACT_LOOKUP_DELAY_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hubspot(path, opts = {}) {
  const url = `${HUBSPOT_API}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HubSpot ${res.status}: ${data?.message || text}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

async function findContactByEmail(email) {
  // Retry a few times because this fires immediately after HubSpot's form submit,
  // and there can be a short lag before the contact is indexed for search.
  for (let attempt = 0; attempt < CONTACT_LOOKUP_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(CONTACT_LOOKUP_DELAY_MS);
    try {
      const data = await hubspot('/crm/v3/objects/contacts/search', {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
          properties: ['firstname', 'lastname', 'email', 'phone'],
          limit: 1,
        }),
      });
      if (data?.results?.length > 0) return data.results[0];
    } catch (e) {
      console.log(`Contact lookup attempt ${attempt + 1} failed:`, e.message);
    }
  }
  return null;
}

function buildDealName(firstname, lastname, suburb) {
  const parts = [];
  const nameJoined = [firstname, lastname].filter(Boolean).join(' ').trim();
  if (nameJoined) parts.push(nameJoined);
  if (suburb && suburb.trim()) {
    parts.push(suburb.trim());
    return parts.join(' - ');
  }
  return parts.join(' - ') || 'New enquiry (unnamed)';
}

exports.handler = async (event) => {
  // CORS: allow same-origin only. This function is only called from rentouleprojects.com.
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://rentouleprojects.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  if (!process.env.HUBSPOT_TOKEN) {
    console.error('HUBSPOT_TOKEN env var is not set');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'server_not_configured' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'invalid_json' }),
    };
  }

  const email = (payload.email || '').trim().toLowerCase();
  const firstname = (payload.firstname || payload.first_name || '').trim();
  const lastname = (payload.lastname || payload.last_name || '').trim();
  const suburb = (payload.suburb || '').trim();
  const phone = (payload.phone || payload.mobilephone || '').trim();
  const message = (payload.message || payload.project_details || '').trim();

  if (!email) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'email_required' }),
    };
  }

  try {
    // Step 1: find the contact HubSpot's SDK just created
    const contact = await findContactByEmail(email);

    if (!contact) {
      // The form was submitted but we cannot find the contact.
      // Do not create an orphan deal; log and return - the contact will still exist,
      // Jeff can manually create the deal for the rare edge case.
      console.warn(`Contact not found after ${CONTACT_LOOKUP_MAX_ATTEMPTS} attempts:`, email);
      return {
        statusCode: 202,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, deal_created: false, reason: 'contact_not_found_in_time' }),
      };
    }

    const contactId = contact.id;
    const contactFirstname = firstname || contact.properties?.firstname || '';
    const contactLastname = lastname || contact.properties?.lastname || '';

    // Step 2: check if this contact already has an associated deal in the Sales Pipeline
    // (prevents duplicate deals if the form is submitted twice by the same person)
    const existingDeals = await hubspot(
      `/crm/v3/objects/contacts/${contactId}/associations/deals`,
      { method: 'GET' },
    ).catch(() => ({ results: [] }));

    if (existingDeals?.results?.length > 0) {
      console.log(`Contact ${email} already has ${existingDeals.results.length} associated deal(s), skipping deal creation`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true, deal_created: false, reason: 'contact_has_existing_deal', contact_id: contactId }),
      };
    }

    // Step 3: build the deal name using the "First Last - Suburb" convention
    const dealName = buildDealName(contactFirstname, contactLastname, suburb);

    // Step 4: create the deal in Sales Pipeline, first stage "Enquiry"
    const dealProps = {
      dealname: dealName,
      pipeline: PIPELINE_ID,
      dealstage: FIRST_STAGE_ID,
    };

    // Add optional properties if we have them
    // (HubSpot ignores unknown properties gracefully if they do not exist on Deal)
    if (message) dealProps.description = message;

    const deal = await hubspot('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: dealProps,
        associations: [
          {
            to: { id: contactId },
            types: [{
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3, // contact_to_deal
            }],
          },
        ],
      }),
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        deal_created: true,
        deal_id: deal.id,
        deal_name: dealName,
        contact_id: contactId,
      }),
    };
  } catch (e) {
    console.error('Deal creation failed:', e.message, e.details || '');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: 'deal_creation_failed', message: e.message }),
    };
  }
};
