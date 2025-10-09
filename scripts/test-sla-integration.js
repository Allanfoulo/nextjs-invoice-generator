// SLA Integration Test
// Tests the complete SLA generation workflow with real data

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgbrlqcquoydwgugaiqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestQuote() {
  console.log('🔧 Creating test quote for SLA generation...');

  try {
    // Create or find test client
    let { data: clients } = await supabase
      .from('clients')
      .select('id, name, company')
      .eq('email', 'sla-test@example.com')
      .limit(1);

    let testClient;
    if (!clients || clients.length === 0) {
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: 'SLA Test Client',
          company: 'SLA Test Company',
          email: 'sla-test@example.com',
          billing_address: '123 SLA Test St, Test City',
          phone: '+1234567890'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test client:', createError);
        throw createError;
      }
      testClient = newClient;
    } else {
      testClient = clients[0];
    }

    if (!testClient) {
      throw new Error('Failed to create or retrieve test client');
    }

    console.log(`✅ Using test client: ${testClient.company}`);

    // Create test quote with future valid date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    const { data: testQuote } = await supabase
      .from('quotes')
      .insert({
        quote_number: `SLA-TEST-${Date.now()}`,
        client_id: testClient.id,
        status: 'draft', // Start as draft
        date_issued: new Date().toISOString().split('T')[0],
        valid_until: futureDate.toISOString().split('T')[0],
        subtotal_excl_vat: 5000,
        vat_amount: 750,
        total_incl_vat: 5750,
        deposit_percentage: 25,
        deposit_amount: 1437.50,
        balance_remaining: 4312.50,
        terms_text: 'SLA test quote terms',
        notes: 'SLA test quote - created for integration testing',
        created_by_user_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single();

    console.log(`✅ Created test quote: ${testQuote.quote_number}`);

    // Add test items
    const { data: testItem } = await supabase
      .from('items')
      .insert({
        description: 'SLA Test Service Package',
        unit_price: 5000,
        qty: 1,
        taxable: true,
        item_type: 'Fixed',
        unit: 'each'
      })
      .select()
      .single();

    // Link item to quote
    await supabase
      .from('quote_items')
      .insert({
        quote_id: testQuote.id,
        item_id: testItem.id
      });

    console.log('✅ Added test items to quote');
    return testQuote;

  } catch (error) {
    console.error('❌ Failed to create test quote:', error);
    throw error;
  }
}

async function testSLAGeneration(quoteId) {
  console.log('\n🧪 Testing SLA generation...');

  try {
    const response = await fetch('http://localhost:3001/api/sla/auto-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quote_id: quoteId,
        trigger_source: 'integration_test'
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SLA generated successfully!');
      console.log(`📋 SLA ID: ${result.sla_id}`);
      return { success: true, slaId: result.sla_id };
    } else {
      console.error('❌ SLA generation failed:', result);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('❌ SLA generation error:', error);
    return { success: false, error: error.message };
  }
}

async function testQuoteStatusChange(quoteId) {
  console.log('\n🔄 Testing quote status change automation...');

  try {
    // Update quote to accepted status (this should trigger SLA generation)
    const { data: updatedQuote } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    console.log(`✅ Quote status changed to: ${updatedQuote.status}`);

    // Wait a moment for database triggers to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if SLA was created by the database trigger
    const { data: slas } = await supabase
      .from('service_agreements')
      .select('id, agreement_number, auto_generated, automation_trigger')
      .eq('quote_id', quoteId);

    if (slas && slas.length > 0) {
      console.log('✅ SLA created automatically by database trigger!');
      console.log(`📋 SLA: ${slas[0].agreement_number}`);
      console.log(`🤖 Auto-generated: ${slas[0].auto_generated}`);
      return { success: true, sla: slas[0] };
    } else {
      console.log('⚠️  No SLA created by database trigger (may need manual trigger)');
      return { success: false, message: 'No automatic SLA created' };
    }

  } catch (error) {
    console.error('❌ Status change test failed:', error);
    return { success: false, error: error.message };
  }
}

async function testPDFGeneration(slaId) {
  console.log('\n📄 Testing SLA PDF generation...');

  try {
    const response = await fetch(`http://localhost:3001/api/sla/${slaId}/pdf`);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('✅ PDF generated successfully!');
      console.log(`📄 Content-Type: ${contentType}`);

      // Get PDF size
      const pdfBuffer = await response.arrayBuffer();
      const pdfSize = pdfBuffer.byteLength;
      console.log(`📏 PDF Size: ${Math.round(pdfSize / 1024)} KB`);

      return { success: true, size: pdfSize };
    } else {
      const error = await response.text();
      console.error('❌ PDF generation failed:', error);
      return { success: false, error };
    }

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupTestData(quoteId) {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete quote items relationships
    await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    // Delete quote
    await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    // Delete any associated SLAs
    await supabase
      .from('service_agreements')
      .delete()
      .eq('quote_id', quoteId);

    console.log('✅ Test data cleaned up');
    return true;

  } catch (error) {
    console.error('⚠️  Cleanup failed:', error);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Starting SLA Integration Test...');
  console.log('=====================================');

  let testQuote;
  let testSLA;

  try {
    // Step 1: Create test quote
    testQuote = await createTestQuote();

    // Step 2: Test manual SLA generation
    const manualResult = await testSLAGeneration(testQuote.id);
    if (!manualResult.success) {
      console.log('⚠️  Manual SLA generation failed, trying status change trigger...');
    } else {
      testSLA = manualResult.slaId;
    }

    // Step 3: Test status change automation
    const statusResult = await testQuoteStatusChange(testQuote.id);
    if (statusResult.success && !testSLA) {
      testSLA = statusResult.sla.id;
    }

    // Step 4: Test PDF generation if we have an SLA
    if (testSLA) {
      await testPDFGeneration(testSLA);
    } else {
      console.log('⚠️  No SLA available for PDF testing');
    }

    console.log('\n=====================================');
    console.log('🏁 Integration Test Results:');
    console.log(`📋 Test Quote: ${testQuote.quote_number}`);
    console.log(`🤖 SLA Created: ${testSLA ? 'YES' : 'NO'}`);
    console.log(`📄 PDF Tested: ${testSLA ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    // Cleanup
    if (testQuote) {
      await cleanupTestData(testQuote.id);
    }
  }
}

// Run the integration test
runIntegrationTest()
  .then(() => {
    console.log('\n✅ Integration test completed');
  })
  .catch(error => {
    console.error('❌ Integration test error:', error);
  });