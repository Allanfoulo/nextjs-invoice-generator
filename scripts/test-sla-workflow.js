// SLA Generation Workflow Test Script
// Tests both manual and automated SLA generation functionality

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://sgbrlqcquoydwgugaiqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testSLAAutoGeneration() {
  console.log('\n=== Testing SLA Auto-Generation ===');

  try {
    // 1. Find an accepted quote without SLA
    const { data: quotes, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        status,
        total_incl_vat,
        client_id,
        created_at,
        clients(name, company),
        service_agreements(id, status)
      `)
      .eq('status', 'accepted')
      .is('service_agreements.id', null)
      .limit(3);

    if (quoteError) {
      console.error('❌ Error fetching quotes:', quoteError);
      return false;
    }

    if (!quotes || quotes.length === 0) {
      console.log('⚠️  No accepted quotes without SLA found. Creating test scenario...');
      return await createTestScenario();
    }

    console.log(`✅ Found ${quotes.length} accepted quotes without SLA`);

    // 2. Test SLA generation for first quote
    const testQuote = quotes[0];
    console.log(`\n📋 Testing SLA generation for quote: ${testQuote.quote_number}`);

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_sla_for_quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        p_quote_id: testQuote.id
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SLA generated successfully:', result);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ SLA generation failed:', error);

      // Test API endpoint instead
      return await testAPIEndpoint(testQuote.id);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testAPIEndpoint(quoteId) {
  console.log('\n🔄 Testing API endpoint fallback...');

  try {
    const response = await fetch('http://localhost:3001/api/sla/auto-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quote_id: quoteId,
        trigger_source: 'test_script'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API endpoint test successful:', result);
      return true;
    } else {
      console.error('❌ API endpoint test failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ API endpoint test error:', error.message);
    console.log('💡 Note: Make sure the development server is running on localhost:3000');
    return false;
  }
}

async function createTestScenario() {
  console.log('\n🔧 Creating test scenario...');

  try {
    // 1. Create or find a test client
    let { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, company')
      .eq('email', 'test@example.com')
      .limit(1);

    if (clientError) {
      console.error('❌ Error finding test client:', clientError);
      return false;
    }

    let testClient;
    if (!clients || clients.length === 0) {
      // Create test client
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: 'Test Client',
          company: 'Test Company',
          email: 'test@example.com',
          billing_address: '123 Test St, Test City',
          phone: '+1234567890'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test client:', createError);
        return false;
      }
      testClient = newClient;
      console.log('✅ Created test client:', testClient.company);
    } else {
      testClient = clients[0];
      console.log('✅ Using existing test client:', testClient.company);
    }

    // 2. Create a test quote
    const { data: testQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: `TEST-${Date.now()}`,
        client_id: testClient.id,
        status: 'accepted',
        date_issued: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal_excl_vat: 1000,
        vat_amount: 150,
        total_incl_vat: 1150,
        deposit_percentage: 50,
        deposit_amount: 575,
        balance_remaining: 575,
        terms_text: 'Test quote terms',
        notes: 'Test quote notes',
        created_by_user_id: '00000000-0000-0000-0000-000000000000' // System user
      })
      .select()
      .single();

    if (quoteError) {
      console.error('❌ Error creating test quote:', quoteError);
      return false;
    }

    console.log('✅ Created test quote:', testQuote.quote_number);

    // 3. Add test items
    const { data: testItem, error: itemError } = await supabase
      .from('items')
      .insert({
        description: 'Test Service',
        unit_price: 1000,
        qty: 1,
        taxable: true,
        item_type: 'Fixed',
        unit: 'each'
      })
      .select()
      .single();

    if (itemError) {
      console.error('❌ Error creating test item:', itemError);
      return false;
    }

    // 4. Link item to quote
    const { error: linkError } = await supabase
      .from('quote_items')
      .insert({
        quote_id: testQuote.id,
        item_id: testItem.id
      });

    if (linkError) {
      console.error('❌ Error linking item to quote:', linkError);
      return false;
    }

    console.log('✅ Test scenario created successfully');

    // 5. Test SLA generation on the new quote
    return await testAPIEndpoint(testQuote.id);

  } catch (error) {
    console.error('❌ Test scenario creation failed:', error);
    return false;
  }
}

async function testManualSLAGeneration() {
  console.log('\n=== Testing Manual SLA Generation ===');

  try {
    // Test by checking if there are any quotes eligible for SLA generation
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        status,
        total_incl_vat,
        valid_until,
        service_agreements(id, status)
      `)
      .eq('status', 'accepted')
      .limit(3);

    if (error) {
      console.error('❌ Error fetching quotes for manual test:', error);
      return false;
    }

    if (!quotes || quotes.length === 0) {
      console.log('⚠️  No accepted quotes found for manual generation test');
      return false;
    }

    console.log(`✅ Found ${quotes.length} quotes eligible for manual SLA generation`);

    // Check each quote for eligibility
    let eligibleCount = 0;
    for (const quote of quotes) {
      const hasExistingSLA = quote.service_agreements && quote.service_agreements.length > 0;
      const isNotExpired = new Date(quote.valid_until) > new Date();
      const hasValue = quote.total_incl_vat > 0;

      if (!hasExistingSLA && isNotExpired && hasValue) {
        eligibleCount++;
        console.log(`✅ Quote ${quote.quote_number} is eligible for manual SLA generation`);
      } else {
        console.log(`⚠️  Quote ${quote.quote_number} not eligible:`, {
          hasExistingSLA,
          isNotExpired,
          hasValue
        });
      }
    }

    console.log(`✅ Manual SLA generation eligibility test: ${eligibleCount}/${quotes.length} quotes eligible`);
    return eligibleCount > 0;

  } catch (error) {
    console.error('❌ Manual SLA generation test failed:', error);
    return false;
  }
}

async function testPDFGeneration() {
  console.log('\n=== Testing SLA PDF Generation ===');

  try {
    // Check if we have any SLAs to test PDF generation with
    const { data: slas, error } = await supabase
      .from('service_agreements')
      .select('id, agreement_number, quote_id')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching SLAs:', error);
      return false;
    }

    if (!slas || slas.length === 0) {
      console.log('⚠️  No SLAs found for PDF testing. Generate an SLA first.');
      return false;
    }

    const testSLA = slas[0];
    console.log(`📄 Testing PDF generation for SLA: ${testSLA.agreement_number}`);

    const response = await fetch(`http://localhost:3001/api/sla/${testSLA.id}/pdf`);

    if (response.ok) {
      console.log('✅ PDF generation test successful');
      return true;
    } else {
      console.error('❌ PDF generation test failed:', await response.text());
      return false;
    }

  } catch (error) {
    console.error('❌ PDF generation test error:', error.message);
    console.log('💡 Note: Make sure the development server is running on localhost:3000');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting SLA Generation Workflow Tests...');
  console.log('==========================================');

  const tests = [
    { name: 'Auto-Generation', fn: testSLAAutoGeneration },
    { name: 'Manual Generation', fn: testManualSLAGeneration },
    { name: 'PDF Generation', fn: testPDFGeneration }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📝 Running ${test.name} Test...`);
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} test PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} test FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test ERROR:`, error.message);
      failed++;
    }
  }

  console.log('\n==========================================');
  console.log('🏁 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! SLA system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testSLAAutoGeneration,
  testManualSLAGeneration,
  testPDFGeneration,
  runAllTests
};