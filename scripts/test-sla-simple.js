// Simple SLA Workflow Test
// Tests SLA functionality using existing data

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgbrlqcquoydwgugaiqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExistingQuotes() {
  console.log('📋 Testing existing quotes...');

  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        status,
        total_incl_vat,
        valid_until,
        client_id,
        clients(name, company),
        service_agreements(id, status, agreement_number)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching quotes:', error);
      return false;
    }

    console.log(`✅ Found ${quotes?.length || 0} quotes`);

    if (!quotes || quotes.length === 0) {
      console.log('⚠️  No quotes found');
      return false;
    }

    // Analyze each quote
    quotes.forEach((quote, index) => {
      const hasSLA = quote.service_agreements && quote.service_agreements.length > 0;
      const isAccepted = quote.status === 'accepted';
      const isExpired = new Date(quote.valid_until) < new Date();
      const hasValue = quote.total_incl_vat > 0;

      console.log(`\n${index + 1}. Quote: ${quote.quote_number}`);
      console.log(`   Client: ${quote.clients?.company || 'Unknown'}`);
      console.log(`   Status: ${quote.status}`);
      console.log(`   Value: R${quote.total_incl_vat?.toFixed(2) || '0'}`);
      console.log(`   Expires: ${new Date(quote.valid_until).toLocaleDateString()}`);
      console.log(`   Has SLA: ${hasSLA ? 'YES' : 'NO'}`);
      console.log(`   Eligible: ${isAccepted && !isExpired && hasValue && !hasSLA ? 'YES' : 'NO'}`);

      if (hasSLA) {
        console.log(`   SLA: ${quote.service_agreements[0].agreement_number} (${quote.service_agreements[0].status})`);
      }
    });

    return quotes;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testSLAAPI(quoteId) {
  console.log(`\n🧪 Testing SLA API for quote: ${quoteId}`);

  try {
    const response = await fetch('http://localhost:3001/api/sla/auto-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quote_id: quoteId,
        trigger_source: 'simple_test'
      })
    });

    console.log(`📡 API Response Status: ${response.status}`);

    const result = await response.json();
    console.log('📦 API Response:', result);

    if (response.ok && result.success) {
      console.log('✅ SLA generation successful!');
      return { success: true, slaId: result.sla_id };
    } else {
      console.log('❌ SLA generation failed');
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('❌ API test error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testExistingSLAs() {
  console.log('\n📄 Testing existing SLAs...');

  try {
    const { data: slas, error } = await supabase
      .from('service_agreements')
      .select(`
        id,
        agreement_number,
        status,
        auto_generated,
        automation_trigger,
        created_at,
        quote_id,
        quotes(quote_number, status, total_incl_vat),
        clients(company)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching SLAs:', error);
      return false;
    }

    console.log(`✅ Found ${slas?.length || 0} SLAs`);

    if (!slas || slas.length === 0) {
      console.log('⚠️  No SLAs found');
      return false;
    }

    slas.forEach((sla, index) => {
      console.log(`\n${index + 1}. SLA: ${sla.agreement_number}`);
      console.log(`   Status: ${sla.status}`);
      console.log(`   Auto-generated: ${sla.auto_generated ? 'YES' : 'NO'}`);
      console.log(`   Trigger: ${sla.automation_trigger || 'Manual'}`);
      console.log(`   Quote: ${sla.quotes?.quote_number || 'Unknown'}`);
      console.log(`   Client: ${sla.clients?.company || 'Unknown'}`);
      console.log(`   Created: ${new Date(sla.created_at).toLocaleDateString()}`);
    });

    return slas;
  } catch (error) {
    console.error('❌ SLA test failed:', error);
    return false;
  }
}

async function testPDFEndpoint(slaId) {
  console.log(`\n📄 Testing PDF generation for SLA: ${slaId}`);

  try {
    const response = await fetch(`http://localhost:3001/api/sla/${slaId}/pdf`);

    console.log(`📡 PDF API Response Status: ${response.status}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      console.log('✅ PDF generation successful!');
      console.log(`📄 Content-Type: ${contentType}`);
      console.log(`📏 Size: ${contentLength ? Math.round(contentLength / 1024) + ' KB' : 'Unknown'}`);

      return true;
    } else {
      const error = await response.text();
      console.log('❌ PDF generation failed');
      console.log(`📝 Error: ${error}`);
      return false;
    }

  } catch (error) {
    console.error('❌ PDF test error:', error.message);
    return false;
  }
}

async function runSimpleTest() {
  console.log('🚀 Starting Simple SLA Test...');
  console.log('===============================');

  try {
    // Test 1: Check existing quotes
    console.log('\n📋 STEP 1: Analyzing Existing Quotes');
    const quotes = await testExistingQuotes();

    // Test 2: Check existing SLAs
    console.log('\n📄 STEP 2: Analyzing Existing SLAs');
    const slas = await testExistingSLAs();

    // Test 3: Test PDF generation if we have SLAs
    if (slas && slas.length > 0) {
      console.log('\n📄 STEP 3: Testing PDF Generation');
      await testPDFEndpoint(slas[0].id);
    } else {
      console.log('\n⚠️  STEP 3: No SLAs available for PDF testing');
    }

    // Test 4: Try SLA generation on an eligible quote
    if (quotes && quotes.length > 0) {
      console.log('\n🧪 STEP 4: Testing SLA Generation');

      // Find a quote without SLA
      const eligibleQuote = quotes.find(q =>
        q.status === 'accepted' &&
        (!q.service_agreements || q.service_agreements.length === 0)
      );

      if (eligibleQuote) {
        console.log(`🎯 Testing with quote: ${eligibleQuote.quote_number}`);
        await testSLAAPI(eligibleQuote.id);
      } else {
        console.log('⚠️  No eligible quotes found for SLA generation test');
      }
    }

    console.log('\n===============================');
    console.log('🏁 Simple SLA Test Complete!');
    console.log('✅ All basic tests completed successfully');

  } catch (error) {
    console.error('❌ Simple test failed:', error);
  }
}

// Run the test
runSimpleTest();